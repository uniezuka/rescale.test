import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { ImageService } from '../services/imageService';
import type { UploadProgress } from '../types/image';
import { Button } from './Button';
import { LoadingSpinner } from './LoadingSpinner';
import { useToast } from '../contexts/ToastContext';
import { useErrorHandler } from '../hooks/useErrorHandler';

interface ImageUploadProps {
  onUploadComplete?: (images: any[]) => void;
  onUploadProgress?: (progress: UploadProgress[]) => void;
  maxFiles?: number;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onUploadComplete,
  onUploadProgress,
  maxFiles = 10,
  className = ''
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();
  const { handleError } = useErrorHandler();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setError(null);
    setIsUploading(true);
    
    const progressArray: UploadProgress[] = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading'
    }));
    
    setUploadProgress(progressArray);
    onUploadProgress?.(progressArray);

    try {
      const results = await ImageService.uploadMultipleImages(
        acceptedFiles,
        {},
        (progress) => {
          setUploadProgress(prev => {
            const updated = prev.map(p => 
              p.file === progress.file ? progress : p
            );
            onUploadProgress?.(updated);
            return updated;
          });
        }
      );

      onUploadComplete?.(results);
      setUploadProgress([]);
      
      // Show success toast
      addToast({
        type: 'success',
        title: 'Upload complete!',
        message: `${results.length} image${results.length !== 1 ? 's' : ''} uploaded successfully`
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setError(errorMessage);
      handleError(error, { 
        context: 'ImageUpload.onDrop',
        showToast: true 
      });
    } finally {
      setIsUploading(false);
    }
  }, [onUploadComplete, onUploadProgress]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles,
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
    disabled: isUploading
  });

  const removeFromProgress = (file: File) => {
    setUploadProgress(prev => prev.filter(p => p.file !== file));
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-4">
          <div className="mx-auto w-12 h-12 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          
          <div>
            <p className="text-lg font-medium text-gray-900">
              {isDragActive ? 'Drop images here' : 'Upload Images'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Drag and drop images here, or click to select files
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Supports JPEG, PNG, GIF, WebP up to 10MB each
            </p>
          </div>

          {!isDragActive && (
            <Button
              type="button"
              variant="secondary"
              disabled={isUploading}
              className="mt-4"
            >
              {isUploading ? 'Uploading...' : 'Choose Files'}
            </Button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Upload Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-900">Upload Progress</h3>
          {uploadProgress.map((progress, index) => (
            <div key={index} className="bg-white border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {progress.status === 'uploading' || progress.status === 'processing' ? (
                      <LoadingSpinner size="sm" />
                    ) : progress.status === 'completed' ? (
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : progress.status === 'error' ? (
                      <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {progress.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {Math.round(progress.file.size / 1024)} KB
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    {progress.progress}%
                  </span>
                  {progress.status === 'error' && (
                    <button
                      onClick={() => removeFromProgress(progress.file)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              {progress.status !== 'completed' && progress.status !== 'error' && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress.progress}%` }}
                  />
                </div>
              )}

              {/* Status Text */}
              <div className="mt-2">
                <p className="text-xs text-gray-500">
                  {progress.status === 'uploading' && 'Uploading...'}
                  {progress.status === 'processing' && 'Processing...'}
                  {progress.status === 'completed' && 'Upload complete'}
                  {progress.status === 'error' && progress.error}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
