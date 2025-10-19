import { useState, useEffect, useCallback } from 'react';
import { FastApiImageService } from '../services/fastApiImageService';
import { RealTimeService, type ProcessingUpdate } from '../services/realTimeService';
import type { ImageMetadata, PaginationInfo } from '../types/image';
import { useErrorHandler } from './useErrorHandler';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from './useAuth';

interface UseImageGalleryOptions {
  initialPage?: number;
  pageSize?: number;
  autoLoad?: boolean;
}

interface UseImageGalleryReturn {
  // State
  images: ImageMetadata[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  pagination: PaginationInfo;
  
  // Actions
  loadImages: (page?: number, append?: boolean) => Promise<void>;
  loadMore: () => void;
  refresh: () => void;
  deleteImage: (imageId: string) => Promise<void>;
  clearError: () => void;
  
  // Computed
  hasImages: boolean;
  canLoadMore: boolean;
}

export const useImageGallery = (
  options: UseImageGalleryOptions = {}
): UseImageGalleryReturn => {
  const {
    initialPage = 1,
    pageSize = 20,
    autoLoad = true
  } = options;

  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: initialPage,
    limit: pageSize,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  const { handleError, handleAsyncError } = useErrorHandler();
  const { addToast } = useToast();
  const { user } = useAuth();

  const loadImages = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      if (!append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      setError(null);

      // Use the current pageSize from options instead of pagination.limit
      const result = await FastApiImageService.getUserImages(page, pageSize);
      
      if (append) {
        setImages(prev => [...prev, ...result.images]);
      } else {
        setImages(result.images);
      }

      const totalPages = Math.ceil(result.total / pageSize);
      setPagination(prev => ({
        ...prev,
        page,
        total: result.total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load images';
      setError(errorMessage);
      handleError(err, { context: 'ImageGallery.loadImages' });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [pageSize, handleError]);

  const loadMore = useCallback(() => {
    if (pagination.hasNext && !loadingMore && !loading) {
      loadImages(pagination.page + 1, true);
    }
  }, [pagination.hasNext, pagination.page, loadingMore, loading, loadImages]);

  const refresh = useCallback(() => {
    loadImages(1);
    addToast({
      type: 'info',
      title: 'Refreshing images...',
      message: 'Loading your latest images'
    });
  }, [loadImages, addToast]);

  const deleteImage = useCallback(async (imageId: string): Promise<void> => {
    await handleAsyncError(
      async () => {
        await FastApiImageService.deleteImage(imageId);
        setImages(prev => prev.filter(img => img.id !== imageId));
        setPagination(prev => ({
          ...prev,
          total: prev.total - 1
        }));
        
        addToast({
          type: 'success',
          title: 'Image deleted',
          message: 'The image has been successfully removed from your gallery'
        });
      },
      { context: 'ImageGallery.deleteImage' }
    );
  }, [handleAsyncError, addToast]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-load images on mount
  useEffect(() => {
    if (autoLoad) {
      loadImages(initialPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad, initialPage]); // loadImages intentionally excluded to prevent infinite loop

  // Set up real-time subscriptions for image updates
  useEffect(() => {
    if (!user) return;

    // Subscribe to image updates
    const unsubscribe = RealTimeService.subscribeToUserImageUpdates(user.id, (update: ProcessingUpdate) => {
      // Update the specific image in the state
      setImages(prevImages => {
        return prevImages.map(img => {
          if (img.id === update.imageId) {
            return {
              ...img,
              processing_status: update.status,
              ai_tags: update.tags || img.ai_tags,
              ai_description: update.description || img.ai_description,
              dominant_colors: update.dominantColors || img.dominant_colors,
              updated_at: new Date().toISOString()
            };
          }
          return img;
        });
      });

      // Show notification for completed processing
      if (update.status === 'completed') {
        addToast({
          type: 'success',
          title: 'Image Processing Complete',
          message: 'AI analysis has been completed for your image',
          duration: 5000
        });
      } else if (update.status === 'failed') {
        addToast({
          type: 'error',
          title: 'Processing Failed',
          message: 'Image processing failed. You can retry processing.',
          duration: 8000
        });
      }
    });

    // Set up a fallback polling mechanism for processing images
    const pollingInterval = setInterval(async () => {
      const processingImages = images.filter(img => img.processing_status === 'processing');
      if (processingImages.length > 0) {
        try {
          // Check each processing image for updates
          for (const image of processingImages) {
            const updatedImage = await FastApiImageService.getImageById(image.id);
            if (updatedImage && updatedImage.processing_status !== image.processing_status) {
              // Update the image in state
              setImages(prevImages => {
                return prevImages.map(img => {
                  if (img.id === image.id) {
                    return {
                      ...img,
                      processing_status: updatedImage.processing_status,
                      ai_tags: updatedImage.ai_tags,
                      ai_description: updatedImage.ai_description,
                      dominant_colors: updatedImage.dominant_colors,
                      updated_at: updatedImage.updated_at
                    };
                  }
                  return img;
                });
              });

              // Show notification
              if (updatedImage.processing_status === 'completed') {
                addToast({
                  type: 'success',
                  title: 'Image Processing Complete',
                  message: 'AI analysis has been completed for your image',
                  duration: 5000
                });
              } else if (updatedImage.processing_status === 'failed') {
                addToast({
                  type: 'error',
                  title: 'Processing Failed',
                  message: 'Image processing failed. You can retry processing.',
                  duration: 8000
                });
              }
            }
          }
        } catch (error) {
          console.error('Error during polling:', error);
        }
      }
    }, 3000); // Poll every 3 seconds

    return () => {
      unsubscribe();
      clearInterval(pollingInterval);
    };
  }, [user, addToast, images]);

  // Computed values
  const hasImages = images.length > 0;
  const canLoadMore = pagination.hasNext && !loadingMore && !loading;

  return {
    // State
    images,
    loading,
    loadingMore,
    error,
    pagination,
    
    // Actions
    loadImages,
    loadMore,
    refresh,
    deleteImage,
    clearError,
    
    // Computed
    hasImages,
    canLoadMore
  };
};
