import { supabase } from './supabase';
import type { ImageMetadata, UploadProgress, ImageUploadOptions } from '../types/image';

/**
 * FastAPI-based image service for production deployment
 * This service uses the FastAPI backend for all image operations
 */
export class FastApiImageService {
  private static readonly API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
  
  private static readonly DEFAULT_UPLOAD_OPTIONS: ImageUploadOptions = {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    maxWidth: 4096,
    maxHeight: 4096,
    quality: 0.8
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

    // Get current user and session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('User not authenticated');

    // Update progress
    onProgress?.({
      file,
      progress: 10,
      status: 'uploading'
    });

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Upload via FastAPI backend
      const response = await fetch(`${this.API_BASE_URL}/images/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Upload failed: ${response.statusText}`);
      }

      // Update progress
      onProgress?.({
        file,
        progress: 80,
        status: 'processing'
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Upload failed');
      }

      // Get the uploaded image details
      const imageResponse = await fetch(`${this.API_BASE_URL}/images/${result.image_id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        }
      });

      if (!imageResponse.ok) {
        throw new Error('Failed to fetch uploaded image details');
      }

      const imageData = await imageResponse.json();

      // Update progress
      onProgress?.({
        file,
        progress: 100,
        status: 'completed'
      });

      return imageData;

    } catch (error) {
      onProgress?.({
        file,
        progress: 0,
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload failed'
      });
      throw error;
    }
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
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('User not authenticated');

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    if (filters?.search) {
      params.append('search', filters.search);
    }

    if (filters?.tags && filters.tags.length > 0) {
      params.append('tags', filters.tags.join(','));
    }

    const response = await fetch(`${this.API_BASE_URL}/images/?${params}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch images: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      images: data.images || [],
      total: data.total || 0
    };
  }

  /**
   * Get a specific image by ID
   */
  static async getImageById(imageId: string): Promise<ImageMetadata | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('User not authenticated');

    const response = await fetch(`${this.API_BASE_URL}/images/${imageId}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      }
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Delete an image
   */
  static async deleteImage(imageId: string): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('User not authenticated');

    const response = await fetch(`${this.API_BASE_URL}/images/${imageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to delete image: ${response.statusText}`);
    }
  }

  /**
   * Retry AI processing for a failed image
   */
  static async retryProcessing(imageId: string): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('User not authenticated');

    const response = await fetch(`${this.API_BASE_URL}/images/${imageId}/retry-processing`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to retry processing: ${response.statusText}`);
    }
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
}
