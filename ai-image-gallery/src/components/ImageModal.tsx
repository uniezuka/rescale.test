import React, { useEffect, useState } from 'react';
import type { ImageMetadata } from '../types/image';

interface ImageModalProps {
  image: ImageMetadata | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
  canNavigatePrev?: boolean;
  canNavigateNext?: boolean;
}

export const ImageModal: React.FC<ImageModalProps> = ({
  image,
  isOpen,
  onClose,
  onNavigate,
  canNavigatePrev = false,
  canNavigateNext = false
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (canNavigatePrev) {
            onNavigate?.('prev');
          }
          break;
        case 'ArrowRight':
          if (canNavigateNext) {
            onNavigate?.('next');
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onNavigate, canNavigatePrev, canNavigateNext]);

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const downloadImage = async () => {
    if (!image || !image.original_url) return;

    try {
      const response = await fetch(image.original_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = image.original_filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  if (!isOpen || !image) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
      onClick={handleBackdropClick}
    >
      <div className="relative max-w-7xl max-h-full mx-4 w-full">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-75 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Navigation Buttons */}
        {onNavigate && (
          <>
            {canNavigatePrev && (
              <button
                onClick={() => onNavigate('prev')}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-75 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            
            {canNavigateNext && (
              <button
                onClick={() => onNavigate('next')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-75 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-lg overflow-hidden shadow-2xl">
          {/* Image Container */}
          <div className="relative bg-gray-100">
            <div className="flex items-center justify-center max-h-[70vh] min-h-[400px]">
              {!imageLoaded && !imageError && (
                <div className="flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                </div>
              )}

              {imageError ? (
                <div className="text-center p-8">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-500">Failed to load image</p>
                </div>
              ) : (
                <img
                  src={image.original_url}
                  alt={image.original_filename}
                  className={`
                    max-w-full max-h-full object-contain transition-opacity duration-200
                    ${imageLoaded ? 'opacity-100' : 'opacity-0'}
                  `}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                />
              )}
            </div>

            {/* Image Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
              <div className="flex items-center justify-between text-white">
                <div>
                  <h3 className="text-lg font-semibold">{image.original_filename}</h3>
                  <p className="text-sm opacity-75">
                    {image.width} × {image.height} • {formatFileSize(image.file_size)}
                  </p>
                </div>
                <button
                  onClick={downloadImage}
                  className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Download</span>
                </button>
              </div>
            </div>
          </div>

          {/* Metadata Panel */}
          <div className="p-6 max-h-[30vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">File Information</h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Original name:</dt>
                      <dd className="text-gray-900">{image.original_filename}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">File size:</dt>
                      <dd className="text-gray-900">{formatFileSize(image.file_size)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Dimensions:</dt>
                      <dd className="text-gray-900">{image.width} × {image.height}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Type:</dt>
                      <dd className="text-gray-900">{image.mime_type}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Uploaded:</dt>
                      <dd className="text-gray-900">{formatDate(image.uploaded_at)}</dd>
                    </div>
                  </dl>
                </div>

                {/* Processing Status */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Processing Status</h4>
                  <div className="flex items-center space-x-2">
                    {image.processing_status === 'completed' && (
                      <>
                        <div className="w-2 h-2 bg-green-400 rounded-full" />
                        <span className="text-sm text-green-600">Analysis Complete</span>
                      </>
                    )}
                    {image.processing_status === 'processing' && (
                      <>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                        <span className="text-sm text-blue-600">Processing...</span>
                      </>
                    )}
                    {image.processing_status === 'pending' && (
                      <>
                        <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                        <span className="text-sm text-yellow-600">Pending Analysis</span>
                      </>
                    )}
                    {image.processing_status === 'failed' && (
                      <>
                        <div className="w-2 h-2 bg-red-400 rounded-full" />
                        <span className="text-sm text-red-600">Processing Failed</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* AI Analysis */}
              <div className="space-y-4">
                {image.ai_tags && image.ai_tags.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">AI Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {image.ai_tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-block px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {image.ai_description && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">AI Description</h4>
                    <p className="text-sm text-gray-700">{image.ai_description}</p>
                  </div>
                )}

                {image.dominant_colors && image.dominant_colors.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Dominant Colors</h4>
                    <div className="flex space-x-2">
                      {image.dominant_colors.slice(0, 5).map((color, index) => (
                        <div
                          key={index}
                          className="w-8 h-8 rounded border border-gray-200"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
