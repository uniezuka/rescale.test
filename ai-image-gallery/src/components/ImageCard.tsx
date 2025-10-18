import React, { useState } from 'react';
import type { ImageMetadata } from '../types/image';

interface ImageCardProps {
  image: ImageMetadata;
  onClick?: () => void;
  onDelete?: () => void;
  className?: string;
}

export const ImageCard: React.FC<ImageCardProps> = ({
  image,
  onClick,
  onDelete,
  className = ''
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
    setShowDeleteConfirm(false);
  };

  const handleDeleteCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
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
    return date.toLocaleDateString();
  };

  return (
    <div
      className={`
        relative group bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden
        hover:shadow-md transition-shadow cursor-pointer
        ${className}
      `}
      onClick={onClick}
    >
      {/* Image Container */}
      <div className="aspect-square relative overflow-hidden bg-gray-100">
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
          </div>
        )}
        
        {imageError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-xs text-gray-500">Failed to load</p>
            </div>
          </div>
        ) : (
          <img
            src={image.thumbnail_url || image.original_url}
            alt={image.original_filename}
            className={`
              w-full h-full object-cover transition-opacity duration-200
              ${imageLoaded ? 'opacity-100' : 'opacity-0'}
            `}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="lazy"
          />
        )}

        {/* Processing Status Overlay */}
        {image.processing_status === 'processing' && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs">Processing...</p>
            </div>
          </div>
        )}

        {image.processing_status === 'failed' && (
          <div className="absolute inset-0 bg-red-500 bg-opacity-75 flex items-center justify-center">
            <div className="text-center text-white">
              <svg className="w-6 h-6 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-xs">Processing Failed</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleDeleteClick}
            className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
            title="Delete image"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Delete Confirmation Overlay */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
            <div className="bg-white rounded-lg p-4 mx-4 max-w-xs">
              <p className="text-sm text-gray-900 mb-4 text-center">
                Are you sure you want to delete this image?
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={handleDeleteCancel}
                  className="flex-1 px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 px-3 py-2 text-sm text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Image Info */}
      <div className="p-3">
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-900 truncate" title={image.original_filename}>
            {image.original_filename}
          </p>
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{formatFileSize(image.file_size)}</span>
            <span>{formatDate(image.uploaded_at)}</span>
          </div>

          {/* AI Tags Preview */}
          {image.ai_tags && image.ai_tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {image.ai_tags.slice(0, 2).map((tag, index) => (
                <span
                  key={index}
                  className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                >
                  {tag}
                </span>
              ))}
              {image.ai_tags.length > 2 && (
                <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                  +{image.ai_tags.length - 2}
                </span>
              )}
            </div>
          )}

          {/* Processing Status */}
          {image.processing_status === 'pending' && (
            <div className="flex items-center mt-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2" />
              <span className="text-xs text-yellow-600">Pending analysis</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
