import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ImageMetadata } from '../types/image';
import { SecureImageService } from '../services/secureImageService';

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
  const [secureImageUrl, setSecureImageUrl] = useState<string | null>(null);

  // Load secure image URL on component mount
  useEffect(() => {
    const loadSecureImage = async () => {
      try {
        const url = await SecureImageService.createSecureImageUrl(image.id, 'thumbnail');
        setSecureImageUrl(url);
      } catch (error) {
        console.error('Failed to load secure image:', error);
        setImageError(true);
        setImageLoaded(true);
      }
    };

    loadSecureImage();

    // Cleanup function to revoke object URL
    return () => {
      if (secureImageUrl) {
        SecureImageService.revokeImageUrl(secureImageUrl);
      }
    };
  }, [image.id]);

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
    <motion.div
      className={`
        relative group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden
        hover:shadow-md transition-all duration-300 cursor-pointer
        ${className}
      `}
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Image Container */}
      <div className="aspect-square relative overflow-hidden bg-gray-100 dark:bg-gray-700">
        {!imageLoaded && (
          <motion.div 
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-600 border-t-blue-600 rounded-full animate-spin" />
          </motion.div>
        )}
        
        {imageError ? (
          <motion.div 
            className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center">
              <svg className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-xs text-gray-500 dark:text-gray-400">Failed to load</p>
            </div>
          </motion.div>
        ) : (
          secureImageUrl && (
            <motion.img
              src={secureImageUrl}
              alt={image.original_filename}
              className="w-full h-full object-cover"
              onLoad={handleImageLoad}
              onError={handleImageError}
              loading="lazy"
              initial={{ opacity: 0 }}
              animate={{ opacity: imageLoaded ? 1 : 0 }}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            />
          )
        )}

        {/* Processing Status Overlay */}
        <AnimatePresence>
          {image.processing_status === 'processing' && (
            <motion.div 
              className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center text-white">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs">Processing...</p>
              </div>
            </motion.div>
          )}

          {image.processing_status === 'failed' && (
            <motion.div 
              className="absolute inset-0 bg-red-500 bg-opacity-75 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center text-white">
                <svg className="w-6 h-6 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-xs">Processing Failed</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <motion.div 
          className="absolute top-2 right-2"
          initial={false}
        >
          <motion.button
            onClick={handleDeleteClick}
            className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
            title="Delete image"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </motion.button>
        </motion.div>

        {/* Delete Confirmation Overlay */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div 
              className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div 
                className="bg-white dark:bg-gray-800 rounded-lg p-4 mx-4 max-w-xs"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-sm text-gray-900 dark:text-gray-100 mb-4 text-center">
                  Are you sure you want to delete this image?
                </p>
                <div className="flex space-x-2">
                  <motion.button
                    onClick={handleDeleteCancel}
                    className="flex-1 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={handleDeleteConfirm}
                    className="flex-1 px-3 py-2 text-sm text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Delete
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Image Info */}
      <div className="p-3">
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate" title={image.original_filename}>
            {image.original_filename}
          </p>
          
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{formatFileSize(image.file_size)}</span>
            <span>{formatDate(image.uploaded_at)}</span>
          </div>

          {/* AI Tags Preview */}
          {image.ai_tags && image.ai_tags.length > 0 && (
            <motion.div 
              className="flex flex-wrap gap-1 mt-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {image.ai_tags.slice(0, 2).map((tag, index) => (
                <motion.span
                  key={index}
                  className="inline-block px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.1 }}
                >
                  {tag}
                </motion.span>
              ))}
              {image.ai_tags.length > 2 && (
                <motion.span 
                  className="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: 0.2 }}
                >
                  +{image.ai_tags.length - 2}
                </motion.span>
              )}
            </motion.div>
          )}

          {/* Processing Status */}
          {image.processing_status === 'pending' && (
            <motion.div 
              className="flex items-center mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse" />
              <span className="text-xs text-yellow-600 dark:text-yellow-400">Pending analysis</span>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
