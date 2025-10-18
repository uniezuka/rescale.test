import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ImageUpload } from '../components/ImageUpload';
import { ImageGallery } from '../components/ImageGallery';
import { ImageModal } from '../components/ImageModal';
import { Breadcrumb } from '../components/Breadcrumb';
import { ProcessingStatus } from '../components/ProcessingStatus';
import type { ImageMetadata } from '../types/image';

export const DashboardPage: React.FC = () => {
  const { user, loading } = useAuth();
  const [selectedImage, setSelectedImage] = useState<ImageMetadata | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'gallery'>('gallery');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const handleUploadComplete = (images: ImageMetadata[]) => {
    setActiveTab('gallery');
  };

  const handleImageSelect = (image: ImageMetadata) => {
    setSelectedImage(image);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedImage(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb />
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                AI Image Gallery
              </h1>
              <p className="text-gray-600">
                Welcome back, {user?.email}! Upload and manage your images with AI-powered analysis.
              </p>
            </div>
            <div className="hidden md:block">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-sm">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-800">
                      <strong>Tip:</strong> Drag & drop images to upload quickly!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('gallery')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'gallery'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Gallery
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'upload'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Upload
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'gallery' ? (
          <div>
            <ImageGallery
              onImageSelect={handleImageSelect}
              onUploadClick={() => setActiveTab('upload')}
            />
          </div>
        ) : (
          <div>
            <ImageUpload onUploadComplete={handleUploadComplete} />
          </div>
        )}

        {/* Processing Status */}
        <div className="mt-8">
          <ProcessingStatus />
        </div>

        {/* Feature Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              AI-Powered Analysis
            </h3>
            <p className="text-blue-800 text-sm">
              Automatically extract tags, descriptions, and dominant colors from your images using Azure Computer Vision.
            </p>
          </div>
          
          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              Real-time Processing
            </h3>
            <p className="text-green-800 text-sm">
              Watch your images get processed in real-time with automatic status updates and notifications.
            </p>
          </div>
          
          <div className="bg-purple-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-purple-900 mb-2">
              Smart Organization
            </h3>
            <p className="text-purple-800 text-sm">
              Easily search and filter your images by AI-generated tags and descriptions.
            </p>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {isModalOpen && selectedImage && (
        <ImageModal
          image={selectedImage}
          isOpen={isModalOpen}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};
