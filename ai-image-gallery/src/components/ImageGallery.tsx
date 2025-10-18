import React from 'react';
import type { ImageMetadata } from '../types/image';
import { ImageCard } from './ImageCard';
import { LoadingSpinner } from './LoadingSpinner';
import { Button } from './Button';
import { useImageGallery } from '../hooks/useImageGallery';

interface ImageGalleryProps {
  onImageSelect?: (image: ImageMetadata) => void;
  onUploadClick?: () => void;
  className?: string;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  onImageSelect,
  onUploadClick,
  className = ''
}) => {
  const {
    images,
    loading,
    loadingMore,
    error,
    pagination,
    loadMore,
    refresh,
    deleteImage,
    clearError,
    hasImages,
    canLoadMore
  } = useImageGallery();

  const handleImageDelete = async (imageId: string) => {
    await deleteImage(imageId);
  };

  if (loading && !hasImages) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-500 mt-4">Loading images...</p>
        </div>
      </div>
    );
  }

  if (error && !hasImages) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <div className="flex justify-center mb-4">
            <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-red-800 mb-2">Failed to load images</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="flex space-x-2">
            <Button onClick={refresh} variant="secondary">
              Try Again
            </Button>
            <Button onClick={clearError} variant="secondary">
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!hasImages) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="max-w-md mx-auto">
          <div className="flex justify-center mb-4">
            <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No images yet</h3>
          <p className="text-gray-500 mb-6">
            Upload your first image to get started with AI-powered image management.
          </p>
          {onUploadClick && (
            <Button onClick={onUploadClick} className="inline-flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Images
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Gallery Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Your Images</h2>
          <p className="text-sm text-gray-500">
            {pagination.total} image{pagination.total !== 1 ? 's' : ''} total
          </p>
        </div>
        
        <Button onClick={refresh} variant="secondary" size="sm">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </Button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-yellow-800">{error}</p>
            </div>
            <div className="ml-3">
              <button
                onClick={clearError}
                className="text-yellow-400 hover:text-yellow-600"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {images.map((image) => (
          <ImageCard
            key={image.id}
            image={image}
            onClick={() => onImageSelect?.(image)}
            onDelete={() => handleImageDelete(image.id)}
          />
        ))}
      </div>

      {/* Load More Button */}
      {canLoadMore && (
        <div className="text-center pt-6">
          <Button
            onClick={loadMore}
            disabled={loadingMore}
            variant="secondary"
          >
            {loadingMore ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}

      {/* Pagination Info */}
      <div className="text-center text-sm text-gray-500">
        Showing {images.length} of {pagination.total} images
      </div>
    </div>
  );
};
