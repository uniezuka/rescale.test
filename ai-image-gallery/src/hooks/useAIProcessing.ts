import { useState, useEffect, useCallback } from 'react';
import { ImageService } from '../services/imageService';
import { RealTimeService, type ProcessingUpdate } from '../services/realTimeService';
import { useAuth } from './useAuth';
import type { ImageMetadata } from '../types/image';

export interface ProcessingStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

export interface UseAIProcessingReturn {
  stats: ProcessingStats;
  isLoading: boolean;
  error: string | null;
  retryProcessing: (imageId: string) => Promise<void>;
  processPendingImages: () => Promise<void>;
  refreshStats: () => Promise<void>;
}

export function useAIProcessing(): UseAIProcessingReturn {
  const [stats, setStats] = useState<ProcessingStats>({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Load initial stats
  const loadStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const processingStats = await ImageService.getProcessingStats();
      setStats(processingStats);
    } catch (err) {
      console.error('Failed to load processing stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load processing stats');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Retry processing for a failed image
  const retryProcessing = useCallback(async (imageId: string) => {
    try {
      setError(null);
      await ImageService.retryProcessing(imageId);
      // Stats will be updated via real-time subscription
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retry processing');
    }
  }, []);

  // Process pending images
  const processPendingImages = useCallback(async () => {
    try {
      setError(null);
      await ImageService.processPendingImages();
      // Stats will be updated via real-time subscription
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process pending images');
    }
  }, []);

  // Refresh stats manually
  const refreshStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const processingStats = await ImageService.getProcessingStats();
      setStats(processingStats);
    } catch (err) {
      console.error('Failed to refresh processing stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh processing stats');
    } finally {
      setIsLoading(false);
    }
  }, []); // Removed loadStats dependency to prevent infinite loop

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    // Load initial stats
    loadStats();

    // Subscribe to processing updates
    const unsubscribe = RealTimeService.subscribeToProcessingUpdates((update: ProcessingUpdate) => {
      // Handle deletion events specifically
      if (update.status === 'deleted') {
        // Immediately refresh stats when an image is deleted
        loadStats();
        return;
      }
      
      // For other updates, refresh stats as well
      loadStats();
    });

    return () => {
      unsubscribe();
    };
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    stats,
    isLoading,
    error,
    retryProcessing,
    processPendingImages,
    refreshStats
  };
}

export interface UseImageProcessingReturn {
  processingStatus: string;
  progress: number;
  isLoading: boolean;
  error: string | null;
  retryProcessing: () => Promise<void>;
}

export function useImageProcessing(imageId: string): UseImageProcessingReturn {
  const [processingStatus, setProcessingStatus] = useState<string>('pending');
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial processing status
  const loadStatus = useCallback(async () => {
    if (!imageId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const status = await ImageService.getProcessingStatus(imageId);
      setProcessingStatus(status.status);
      setProgress(status.progress || 0);
      if (status.error) {
        setError(status.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load processing status');
    } finally {
      setIsLoading(false);
    }
  }, [imageId]);

  // Retry processing
  const retryProcessing = useCallback(async () => {
    try {
      setError(null);
      await ImageService.retryProcessing(imageId);
      // Status will be updated via real-time subscription
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retry processing');
    }
  }, [imageId]);

  // Set up real-time subscription for this specific image
  useEffect(() => {
    if (!imageId) return;

    // Load initial status
    loadStatus();

    // Subscribe to updates for this specific image
    const unsubscribe = RealTimeService.subscribeToImageUpdates(
      imageId,
      (update: ProcessingUpdate) => {
        setProcessingStatus(update.status);
        setProgress(update.progress || 0);
        if (update.error) {
          setError(update.error);
        } else if (update.status === 'completed') {
          setError(null);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [imageId, loadStatus]);

  return {
    processingStatus,
    progress,
    isLoading,
    error,
    retryProcessing
  };
}

export interface UseImageGalleryWithProcessingReturn {
  images: ImageMetadata[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refreshImages: () => Promise<void>;
  deleteImage: (imageId: string) => Promise<void>;
}

export function useImageGalleryWithProcessing(
  pageSize: number = 20
): UseImageGalleryWithProcessingReturn {
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const { user } = useAuth();

  // Load images
  const loadImages = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await ImageService.getUserImages(page, pageSize);
      
      if (append) {
        setImages(prev => [...prev, ...result.images]);
      } else {
        setImages(result.images);
      }
      
      setHasMore(result.images.length === pageSize);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load images');
    } finally {
      setIsLoading(false);
    }
  }, [pageSize]);

  // Load more images
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    await loadImages(currentPage + 1, true);
  }, [hasMore, isLoading, currentPage, loadImages]);

  // Refresh images
  const refreshImages = useCallback(async () => {
    await loadImages(1, false);
  }, [loadImages]);

  // Delete image
  const deleteImage = useCallback(async (imageId: string) => {
    try {
      setError(null);
      await ImageService.deleteImage(imageId);
      setImages(prev => prev.filter(img => img.id !== imageId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete image');
    }
  }, []);

  // Set up real-time subscription for user images
  useEffect(() => {
    if (!user) return;

    // Load initial images
    loadImages(1, false);

    // Subscribe to user image updates
    const unsubscribe = RealTimeService.subscribeToUserImageUpdates(
      user.id, // Use the actual user ID
      (update: ProcessingUpdate) => {
        if (update.status === 'deleted') {
          // Remove the deleted image from the list
          setImages(prev => prev.filter(img => img.id !== update.imageId));
        } else {
          // Update the specific image in the list
          setImages(prev => prev.map(img => 
            img.id === update.imageId 
              ? {
                  ...img,
                  processing_status: update.status,
                  ai_tags: update.tags || img.ai_tags,
                  ai_description: update.description || img.ai_description,
                  dominant_colors: update.dominantColors || img.dominant_colors,
                  updated_at: new Date().toISOString()
                }
              : img
          ));
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user, loadImages]);

  return {
    images,
    isLoading,
    error,
    hasMore,
    loadMore,
    refreshImages,
    deleteImage
  };
}
