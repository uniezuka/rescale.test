import { supabase } from './supabase';
import type { ImageMetadata } from '../types/image';

export interface ProcessingUpdate {
  imageId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'deleted';
  progress?: number;
  error?: string;
  tags?: string[];
  description?: string;
  dominantColors?: string[];
}

export type ProcessingUpdateCallback = (update: ProcessingUpdate) => void;

export class RealTimeService {
  private static subscriptions: Map<string, ReturnType<typeof supabase.channel>> = new Map();
  private static callbacks: Map<string, ProcessingUpdateCallback[]> = new Map();

  /**
   * Subscribe to real-time updates for a specific image
   */
  static subscribeToImageUpdates(
    imageId: string,
    callback: ProcessingUpdateCallback
  ): () => void {
    const subscriptionKey = `image_${imageId}`;
    
    // Add callback to the list
    if (!this.callbacks.has(subscriptionKey)) {
      this.callbacks.set(subscriptionKey, []);
    }
    this.callbacks.get(subscriptionKey)!.push(callback);

    // Create subscription if it doesn't exist
    if (!this.subscriptions.has(subscriptionKey)) {
      const subscription = supabase
        .channel(`image-updates-${imageId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'images',
            filter: `id=eq.${imageId}`,
          },
          (payload) => {
            this.handleImageUpdate(payload.new as ImageMetadata);
          }
        )
        .subscribe();

      this.subscriptions.set(subscriptionKey, subscription);
    }

    // Return unsubscribe function
    return () => {
      this.unsubscribeFromImageUpdates(imageId, callback);
    };
  }

  /**
   * Subscribe to real-time updates for all images of a specific user
   */
  static subscribeToUserImageUpdates(
    userId: string,
    callback: ProcessingUpdateCallback
  ): () => void {
    const subscriptionKey = `user_${userId}`;
    
    // Add callback to the list
    if (!this.callbacks.has(subscriptionKey)) {
      this.callbacks.set(subscriptionKey, []);
    }
    this.callbacks.get(subscriptionKey)!.push(callback);

    // Create subscription if it doesn't exist
    if (!this.subscriptions.has(subscriptionKey)) {
      const subscription = supabase
        .channel(`user-image-updates-${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'images',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            this.handleImageUpdate(payload.new as ImageMetadata);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'images',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            this.handleImageUpdate(payload.new as ImageMetadata);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'images',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            this.handleImageDelete(payload.old as ImageMetadata);
          }
        )
        .subscribe();

      this.subscriptions.set(subscriptionKey, subscription);
    }

    // Return unsubscribe function
    return () => {
      this.unsubscribeFromUserImageUpdates(userId, callback);
    };
  }

  /**
   * Subscribe to all processing updates
   */
  static subscribeToProcessingUpdates(
    callback: ProcessingUpdateCallback
  ): () => void {
    const subscriptionKey = 'processing_updates';
    
    // Add callback to the list
    if (!this.callbacks.has(subscriptionKey)) {
      this.callbacks.set(subscriptionKey, []);
    }
    this.callbacks.get(subscriptionKey)!.push(callback);

    // Create subscription if it doesn't exist
    if (!this.subscriptions.has(subscriptionKey)) {
      const subscription = supabase
        .channel('processing-updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'images',
            filter: 'processing_status=neq.pending',
          },
          (payload) => {
            this.handleImageUpdate(payload.new as ImageMetadata);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'images',
          },
          (payload) => {
            this.handleImageDelete(payload.old as ImageMetadata);
          }
        )
        .subscribe();

      this.subscriptions.set(subscriptionKey, subscription);
    }

    // Return unsubscribe function
    return () => {
      this.unsubscribeFromProcessingUpdates(callback);
    };
  }

  /**
   * Handle image update from database
   */
  private static handleImageUpdate(image: ImageMetadata): void {
    const update: ProcessingUpdate = {
      imageId: image.id,
      status: image.processing_status,
      tags: image.ai_tags,
      description: image.ai_description,
      dominantColors: image.dominant_colors,
    };

    // Determine progress based on status
    switch (image.processing_status) {
      case 'pending':
        update.progress = 0;
        break;
      case 'processing':
        update.progress = 50;
        break;
      case 'completed':
        update.progress = 100;
        break;
      case 'failed':
        update.progress = 0;
        update.error = 'Processing failed';
        break;
    }

    // Notify all relevant callbacks
    this.notifyCallbacks(update);
  }

  /**
   * Handle image deletion from database
   */
  private static handleImageDelete(image: ImageMetadata): void {
    const update: ProcessingUpdate = {
      imageId: image.id,
      status: 'deleted',
      progress: 0,
    };

    // Notify all relevant callbacks
    this.notifyCallbacks(update);
  }

  /**
   * Notify all relevant callbacks about the update
   */
  private static notifyCallbacks(update: ProcessingUpdate): void {
    // Notify specific image callbacks
    const imageKey = `image_${update.imageId}`;
    const imageCallbacks = this.callbacks.get(imageKey);
    if (imageCallbacks) {
      imageCallbacks.forEach(callback => {
        try {
          callback(update);
        } catch (error) {
          console.error('Error in image update callback:', error);
        }
      });
    }

    // Notify user callbacks (for subscribeToUserImageUpdates)
    for (const [key, callbacks] of this.callbacks.entries()) {
      if (key.startsWith('user_')) {
        callbacks.forEach(callback => {
          try {
            callback(update);
          } catch (error) {
            console.error('Error in user update callback:', error);
          }
        });
      }
    }

    // Notify processing update callbacks
    const processingCallbacks = this.callbacks.get('processing_updates');
    if (processingCallbacks) {
      processingCallbacks.forEach(callback => {
        try {
          callback(update);
        } catch (error) {
          console.error('Error in processing update callback:', error);
        }
      });
    }
  }

  /**
   * Unsubscribe from image updates
   */
  private static unsubscribeFromImageUpdates(
    imageId: string,
    callback: ProcessingUpdateCallback
  ): void {
    const subscriptionKey = `image_${imageId}`;
    const callbacks = this.callbacks.get(subscriptionKey);
    
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
      
      // If no more callbacks, remove subscription
      if (callbacks.length === 0) {
        this.callbacks.delete(subscriptionKey);
        const subscription = this.subscriptions.get(subscriptionKey);
        if (subscription) {
          subscription.unsubscribe();
          this.subscriptions.delete(subscriptionKey);
        }
      }
    }
  }

  /**
   * Unsubscribe from user image updates
   */
  private static unsubscribeFromUserImageUpdates(
    userId: string,
    callback: ProcessingUpdateCallback
  ): void {
    const subscriptionKey = `user_${userId}`;
    const callbacks = this.callbacks.get(subscriptionKey);
    
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
      
      // If no more callbacks, remove subscription
      if (callbacks.length === 0) {
        this.callbacks.delete(subscriptionKey);
        const subscription = this.subscriptions.get(subscriptionKey);
        if (subscription) {
          subscription.unsubscribe();
          this.subscriptions.delete(subscriptionKey);
        }
      }
    }
  }

  /**
   * Unsubscribe from processing updates
   */
  private static unsubscribeFromProcessingUpdates(
    callback: ProcessingUpdateCallback
  ): void {
    const subscriptionKey = 'processing_updates';
    const callbacks = this.callbacks.get(subscriptionKey);
    
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
      
      // If no more callbacks, remove subscription
      if (callbacks.length === 0) {
        this.callbacks.delete(subscriptionKey);
        const subscription = this.subscriptions.get(subscriptionKey);
        if (subscription) {
          subscription.unsubscribe();
          this.subscriptions.delete(subscriptionKey);
        }
      }
    }
  }

  /**
   * Get debug information about current subscriptions
   */
  static getDebugInfo(): {
    subscriptions: string[];
    callbacks: Record<string, number>;
  } {
    return {
      subscriptions: Array.from(this.subscriptions.keys()),
      callbacks: Object.fromEntries(
        Array.from(this.callbacks.entries()).map(([key, callbacks]) => [key, callbacks.length])
      )
    };
  }

  /**
   * Clear all subscriptions (for testing)
   */
  static clearAllSubscriptions(): void {
    // Unsubscribe from all channels
    for (const subscription of this.subscriptions.values()) {
      subscription.unsubscribe();
    }
    
    // Clear maps
    this.subscriptions.clear();
    this.callbacks.clear();
  }
}
