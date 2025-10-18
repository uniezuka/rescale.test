import { supabase } from './supabase';
import type { ImageMetadata, UploadProgress, ImageUploadOptions, ThumbnailOptions } from '../types/image';
import imageCompression from 'browser-image-compression';
import { BackgroundProcessingService } from './backgroundProcessingService';

export class ImageService {
  private static readonly STORAGE_BUCKET = 'images';
  private static readonly THUMBNAIL_BUCKET = 'thumbnails';
  
  private static readonly DEFAULT_UPLOAD_OPTIONS: ImageUploadOptions = {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    maxWidth: 4096,
    maxHeight: 4096,
    quality: 0.8
  };

  private static readonly THUMBNAIL_OPTIONS: ThumbnailOptions = {
    width: 300,
    height: 300,
    quality: 0.8,
    format: 'jpeg'
  };

  /**
   * Upload a single image with progress tracking
   */
  static async uploadImage(
    file: File,
    options: Partial<ImageUploadOptions> = {},
    onProgress?: (progress: UploadProgress) => void
  ): Promise<ImageMetadata> {
    const uploadOptions = { ...this.DEFAULT_UPLOAD_OPTIONS, ...options };
    
    // Validate file
    this.validateFile(file, uploadOptions);

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const filename = `${user.id}/${timestamp}_${Math.random().toString(36).substring(7)}.${fileExtension}`;

    // Compress image if needed
    const compressedFile = await this.compressImage(file, uploadOptions);
    
    // Update progress
    onProgress?.({
      file,
      progress: 20,
      status: 'uploading'
    });

    // Upload original image
    const { error: uploadError } = await supabase.storage
      .from(this.STORAGE_BUCKET)
      .upload(filename, compressedFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    // Update progress
    onProgress?.({
      file,
      progress: 50,
      status: 'processing'
    });

    // Generate and upload thumbnail
    const thumbnailUrl = await this.generateAndUploadThumbnail(compressedFile, filename);

    // Get image dimensions
    const dimensions = await this.getImageDimensions(compressedFile);

    // Create metadata record
    const imageMetadata: Omit<ImageMetadata, 'id' | 'uploaded_at' | 'updated_at'> = {
      user_id: user.id,
      filename,
      original_filename: file.name,
      file_size: compressedFile.size,
      mime_type: file.type,
      width: dimensions.width,
      height: dimensions.height,
      processing_status: 'pending',
      thumbnail_url: thumbnailUrl,
      original_url: this.getPublicUrl(this.STORAGE_BUCKET, filename)
    };

    const { data: metadata, error: metadataError } = await supabase
      .from('images')
      .insert(imageMetadata)
      .select()
      .single();

    if (metadataError) throw new Error(`Metadata save failed: ${metadataError.message}`);

    // Update progress
    onProgress?.({
      file,
      progress: 100,
      status: 'completed'
    });

    // Queue image for AI processing
    try {
      await BackgroundProcessingService.queueImageProcessing(metadata.id);
    } catch (error) {
      console.warn('Failed to queue image for AI processing:', error);
      // Don't fail the upload if AI processing fails
    }

    return metadata;
  }

  /**
   * Upload multiple images
   */
  static async uploadMultipleImages(
    files: File[],
    options: Partial<ImageUploadOptions> = {},
    onProgress?: (progress: UploadProgress) => void
  ): Promise<ImageMetadata[]> {
    const results: ImageMetadata[] = [];
    const errors: Error[] = [];

    for (const file of files) {
      try {
        const result = await this.uploadImage(file, options, onProgress);
        results.push(result);
      } catch (error) {
        errors.push(error as Error);
        onProgress?.({
          file,
          progress: 0,
          status: 'error',
          error: (error as Error).message
        });
      }
    }

    if (errors.length > 0 && results.length === 0) {
      throw new Error(`All uploads failed: ${errors.map(e => e.message).join(', ')}`);
    }

    return results;
  }

  /**
   * Get user's images with pagination
   */
  static async getUserImages(
    page: number = 1,
    limit: number = 20,
    filters?: { search?: string; tags?: string[] }
  ): Promise<{ images: ImageMetadata[]; total: number }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('images')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('uploaded_at', { ascending: false })
      .range(from, to);

    // Apply filters if provided
    if (filters?.search) {
      query = query.or(`filename.ilike.%${filters.search}%,ai_description.ilike.%${filters.search}%`);
    }

    if (filters?.tags?.length > 0) {
      query = query.contains('ai_tags', filters.tags);
    }

    const { data, error, count } = await query;

    if (error) throw new Error(`Failed to fetch images: ${error.message}`);

    return {
      images: data || [],
      total: count || 0
    };
  }

  /**
   * Get a specific image by ID
   */
  static async getImageById(imageId: string): Promise<ImageMetadata | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('images')
      .select('*')
      .eq('id', imageId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Image not found
      }
      throw new Error(`Failed to fetch image: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete an image and its files
   */
  static async deleteImage(imageId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get image metadata
    const { data: image, error: fetchError } = await supabase
      .from('images')
      .select('*')
      .eq('id', imageId)
      .eq('user_id', user.id)
      .single();

    if (fetchError) throw new Error(`Failed to fetch image: ${fetchError.message}`);
    if (!image) throw new Error('Image not found');

    // Delete files from storage
    const { error: deleteOriginalError } = await supabase.storage
      .from(this.STORAGE_BUCKET)
      .remove([image.filename]);

    if (deleteOriginalError) {
      console.warn('Failed to delete original file:', deleteOriginalError.message);
    }

    // Delete thumbnail
    const thumbnailFilename = image.filename.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '_thumb.jpg');
    const { error: deleteThumbnailError } = await supabase.storage
      .from(this.THUMBNAIL_BUCKET)
      .remove([thumbnailFilename]);

    if (deleteThumbnailError) {
      console.warn('Failed to delete thumbnail:', deleteThumbnailError.message);
    }

    // Delete metadata record
    const { error: deleteMetadataError } = await supabase
      .from('images')
      .delete()
      .eq('id', imageId)
      .eq('user_id', user.id);

    if (deleteMetadataError) throw new Error(`Failed to delete metadata: ${deleteMetadataError.message}`);
  }

  /**
   * Get public URL for a file
   */
  static getPublicUrl(bucket: string, filename: string): string {
    const { data } = supabase.storage.from(bucket).getPublicUrl(filename);
    return data.publicUrl;
  }

  /**
   * Validate file before upload
   */
  private static validateFile(file: File, options: ImageUploadOptions): void {
    if (file.size > options.maxFileSize) {
      throw new Error(`File size exceeds limit of ${Math.round(options.maxFileSize / 1024 / 1024)}MB`);
    }

    if (!options.allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} is not allowed`);
    }
  }

  /**
   * Compress image if needed
   */
  private static async compressImage(
    file: File,
    options: ImageUploadOptions
  ): Promise<File> {
    const compressionOptions = {
      maxSizeMB: options.maxFileSize / 1024 / 1024,
      maxWidthOrHeight: Math.max(options.maxWidth || 4096, options.maxHeight || 4096),
      useWebWorker: true,
      initialQuality: options.quality || 0.8
    };

    return await imageCompression(file, compressionOptions);
  }

  /**
   * Generate thumbnail and upload it
   */
  private static async generateAndUploadThumbnail(
    file: File,
    originalFilename: string
  ): Promise<string> {
    const thumbnailFilename = originalFilename.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '_thumb.jpg');
    
    const compressionOptions = {
      maxSizeMB: 1,
      maxWidthOrHeight: Math.max(this.THUMBNAIL_OPTIONS.width, this.THUMBNAIL_OPTIONS.height),
      useWebWorker: true,
      initialQuality: this.THUMBNAIL_OPTIONS.quality
    };

    const thumbnailFile = await imageCompression(file, compressionOptions);

    const { error } = await supabase.storage
      .from(this.THUMBNAIL_BUCKET)
      .upload(thumbnailFilename, thumbnailFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw new Error(`Thumbnail upload failed: ${error.message}`);

    return this.getPublicUrl(this.THUMBNAIL_BUCKET, thumbnailFilename);
  }

  /**
   * Get image dimensions
   */
  private static getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Get AI processing status for an image
   */
  static async getProcessingStatus(imageId: string): Promise<{
    status: string;
    progress?: number;
    error?: string;
  }> {
    return BackgroundProcessingService.getProcessingStatus(imageId);
  }

  /**
   * Retry AI processing for a failed image
   */
  static async retryProcessing(imageId: string): Promise<void> {
    return BackgroundProcessingService.retryProcessing(imageId);
  }

  /**
   * Get processing statistics for user
   */
  static async getProcessingStats(): Promise<{
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    return BackgroundProcessingService.getProcessingStats();
  }

  /**
   * Process pending images in batch
   */
  static async processPendingImages(): Promise<void> {
    const pendingImages = await BackgroundProcessingService.getPendingImages(10);
    const imageIds = pendingImages.map(img => img.id);
    
    if (imageIds.length > 0) {
      await BackgroundProcessingService.processBatch(imageIds);
    }
  }
}
