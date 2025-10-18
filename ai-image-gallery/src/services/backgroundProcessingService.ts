import { supabase } from './supabase';
import { AzureVisionService } from './azureVisionService';
import type { ImageMetadata } from '../types/image';

export interface ProcessingJob {
  id: string;
  imageId: string;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  maxAttempts: number;
  error?: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface ProcessingResult {
  success: boolean;
  tags?: string[];
  description?: string;
  dominantColors?: string[];
  error?: string;
}

export class BackgroundProcessingService {
  private static readonly BATCH_SIZE = 10;
  
  /**
   * Queue an image for AI processing
   */
  static async queueImageProcessing(imageId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Check if image exists and belongs to user
    const { data: image, error: fetchError } = await supabase
      .from('images')
      .select('*')
      .eq('id', imageId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !image) {
      throw new Error('Image not found or access denied');
    }

    // Check usage limits before processing
    if (!AzureVisionService.canMakeRequest()) {
      throw new Error('Azure Computer Vision usage limits exceeded. Please wait or upgrade your plan.');
    }

    // Increment usage counter
    AzureVisionService.incrementUsage();

    // Update image status to processing
    const { error: updateError } = await supabase
      .from('images')
      .update({ 
        processing_status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', imageId);

    if (updateError) {
      throw new Error(`Failed to update image status: ${updateError.message}`);
    }

    // Start processing immediately (for now, we'll process in the foreground)
    // In a real implementation, this would trigger a background job
    this.processImage(imageId).catch(error => {
      console.error('Background processing failed:', error);
      this.handleProcessingError(imageId, error.message);
    });
  }

  /**
   * Process a single image with AI analysis using FastAPI backend
   */
  static async processImage(imageId: string): Promise<ProcessingResult> {
    // Set a timeout for the entire processing operation
    const timeoutPromise = new Promise<ProcessingResult>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Processing timeout - operation took too long'));
      }, 300000); // 5 minutes timeout
    });

    const processingPromise = this.processImageInternal(imageId);

    try {
      // Race between processing and timeout
      return await Promise.race([processingPromise, timeoutPromise]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown processing error';
      
      // Update image status to failed
      await this.handleProcessingError(imageId, errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Internal processing method with timeout protection
   */
  private static async processImageInternal(imageId: string): Promise<ProcessingResult> {
    try {
      // Get image metadata
      const { data: image, error: fetchError } = await supabase
        .from('images')
        .select('*')
        .eq('id', imageId)
        .single();

      if (fetchError || !image) {
        throw new Error('Image not found');
      }

      // Get image file from storage
      const imageUrl = image.original_url;
      if (!imageUrl) {
        throw new Error('Image URL not found');
      }

      // Process using FastAPI backend
      console.log('Processing image via FastAPI backend:', imageId);
      return await this.processImageViaFastAPI(imageId);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown processing error';
      throw new Error(errorMessage);
    }
  }

  /**
   * Process image using FastAPI backend
   */
  private static async processImageViaFastAPI(imageId: string): Promise<ProcessingResult> {
    try {
      console.log('Processing image via FastAPI backend:', imageId);
      
      // Get authentication token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      // Call FastAPI backend for retry processing
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
      
      console.log('Calling FastAPI backend for retry processing...');
      const response = await fetch(`${API_BASE_URL}/images/${imageId}/retry-processing`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `FastAPI request failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('FastAPI processing result:', result);

      // Wait a moment for processing to complete, then check status
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get updated image data
      const { data: updatedImage, error: fetchError } = await supabase
        .from('images')
        .select('*')
        .eq('id', imageId)
        .single();

      if (fetchError || !updatedImage) {
        throw new Error('Failed to fetch updated image data');
      }

      if (updatedImage.processing_status === 'completed') {
        return {
          success: true,
          tags: updatedImage.ai_tags,
          description: updatedImage.ai_description,
          dominantColors: updatedImage.dominant_colors
        };
      } else if (updatedImage.processing_status === 'failed') {
        throw new Error(updatedImage.error_message || 'Processing failed');
      } else {
        // Still processing, return success but with limited data
        return {
          success: true,
          tags: updatedImage.ai_tags || [],
          description: updatedImage.ai_description || '',
          dominantColors: updatedImage.dominant_colors || []
        };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'FastAPI processing failed';
      console.error('FastAPI processing failed:', errorMessage);
      console.error('Full error:', error);
      
      // Update image status to failed
      await this.handleProcessingError(imageId, errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Process multiple images in batch
   */
  static async processBatch(imageIds: string[]): Promise<ProcessingResult[]> {
    const results: ProcessingResult[] = [];
    
    // Process images in batches to avoid overwhelming the API
    for (let i = 0; i < imageIds.length; i += this.BATCH_SIZE) {
      const batch = imageIds.slice(i, i + this.BATCH_SIZE);
      
      const batchPromises = batch.map(imageId => this.processImage(imageId));
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            success: false,
            error: result.reason instanceof Error ? result.reason.message : 'Unknown error'
          });
        }
      });

      // Add delay between batches to respect rate limits
      if (i + this.BATCH_SIZE < imageIds.length) {
        await this.sleep(1000);
      }
    }

    return results;
  }

  /**
   * Get pending images for processing
   */
  static async getPendingImages(limit: number = 50): Promise<ImageMetadata[]> {
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .eq('processing_status', 'pending')
      .order('uploaded_at', { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch pending images: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get processing status for an image
   */
  static async getProcessingStatus(imageId: string): Promise<{
    status: string;
    progress?: number;
    error?: string;
  }> {
    const { data: image, error } = await supabase
      .from('images')
      .select('processing_status, ai_tags, ai_description, dominant_colors')
      .eq('id', imageId)
      .single();

    if (error || !image) {
      throw new Error('Image not found');
    }

    let progress: number | undefined;
    
    switch (image.processing_status) {
      case 'pending':
        progress = 0;
        break;
      case 'processing':
        progress = 50;
        break;
      case 'completed':
        progress = 100;
        break;
      case 'failed':
        progress = 0;
        break;
    }

    return {
      status: image.processing_status,
      progress,
      error: image.processing_status === 'failed' ? 'Processing failed' : undefined
    };
  }

  /**
   * Retry failed processing
   */
  static async retryProcessing(imageId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Check usage limits before retry
    if (!AzureVisionService.canMakeRequest()) {
      throw new Error('Azure Computer Vision usage limits exceeded. Please wait or upgrade your plan.');
    }

    // Reset image status to pending
    const { error: updateError } = await supabase
      .from('images')
      .update({ 
        processing_status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', imageId)
      .eq('user_id', user.id);

    if (updateError) {
      throw new Error(`Failed to reset image status: ${updateError.message}`);
    }

    // Queue for processing again
    await this.queueImageProcessing(imageId);
  }

  /**
   * Handle processing errors
   */
  private static async handleProcessingError(imageId: string, errorMessage: string): Promise<void> {
    const { error } = await supabase
      .from('images')
      .update({
        processing_status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', imageId);

    if (error) {
      console.error('Failed to update image status to failed:', error);
    }

    console.error(`Image processing failed for ${imageId}:`, errorMessage);
  }

  /**
   * Get processing statistics
   */
  static async getProcessingStats(): Promise<{
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('images')
      .select('processing_status')
      .eq('user_id', user.id);

    if (error) {
      throw new Error(`Failed to fetch processing stats: ${error.message}`);
    }

    const stats = {
      total: data.length,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0
    };

    data.forEach(image => {
      switch (image.processing_status) {
        case 'pending':
          stats.pending++;
          break;
        case 'processing':
          stats.processing++;
          break;
        case 'completed':
          stats.completed++;
          break;
        case 'failed':
          stats.failed++;
          break;
      }
    });

    return stats;
  }

  /**
   * Clean up old failed processing attempts
   */
  static async cleanupFailedProcessing(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7); // 7 days ago

    const { error } = await supabase
      .from('images')
      .update({
        processing_status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('processing_status', 'failed')
      .lt('updated_at', cutoffDate.toISOString());

    if (error) {
      console.error('Failed to cleanup old failed processing:', error);
    }
  }

  /**
   * Sleep utility
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
