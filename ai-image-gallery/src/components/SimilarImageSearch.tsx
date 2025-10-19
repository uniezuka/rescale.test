import React, { useState, useEffect, useCallback } from 'react';
import { SearchService } from '../services/searchService';
import { Button } from './Button';
import { LoadingSpinner } from './LoadingSpinner';
import { ImageCard } from './ImageCard';
import type { ImageMetadata } from '../types/image';

interface SimilarImageSearchProps {
  sourceImage: ImageMetadata;
  onImageSelect?: (image: ImageMetadata) => void;
  onClose?: () => void;
  className?: string;
}

interface SimilarImage {
  id: string;
  filename: string;
  thumbnail_url: string;
  similarity_score: number;
  tag_similarity: number;
  description_similarity: number;
  ai_tags: string[];
  ai_description: string;
  created_at: string;
}

export const SimilarImageSearch: React.FC<SimilarImageSearchProps> = ({
  sourceImage,
  onImageSelect,
  onClose,
  className = ''
}) => {
  const [similarImages, setSimilarImages] = useState<SimilarImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.7);
  const [maxResults, setMaxResults] = useState(10);

  const findSimilarImages = useCallback(async () => {
    if (!sourceImage.id) return;

    try {
      setLoading(true);
      setError(null);

      const result = await SearchService.findSimilarImages({
        imageId: sourceImage.id,
        limit: maxResults,
        similarityThreshold
      });

      setSimilarImages(result.similar_images);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to find similar images';
      setError(errorMessage);
      console.error('Similar image search error:', err);
    } finally {
      setLoading(false);
    }
  }, [sourceImage.id, maxResults, similarityThreshold]);

  // Automatically search for similar images when component mounts
  useEffect(() => {
    if (sourceImage.id) {
      findSimilarImages();
    }
  }, [sourceImage.id, findSimilarImages]);

  const handleImageClick = (similarImage: SimilarImage) => {
    // Convert similar image to ImageMetadata format
    const imageMetadata: ImageMetadata = {
      id: similarImage.id,
      filename: similarImage.filename,
      original_filename: similarImage.filename,
      file_size: 0, // Not available in similar image data
      mime_type: 'image/jpeg', // Default assumption
      width: 0, // Not available
      height: 0, // Not available
      uploaded_at: similarImage.created_at,
      updated_at: similarImage.created_at,
      processing_status: 'completed',
      ai_tags: similarImage.ai_tags,
      ai_description: similarImage.ai_description,
      dominant_colors: [], // Not available in similar image data
      thumbnail_url: similarImage.thumbnail_url,
      original_url: similarImage.thumbnail_url, // Use thumbnail as fallback
      user_id: sourceImage.user_id
    };

    onImageSelect?.(imageMetadata);
  };

  const getSimilarityColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getSimilarityLabel = (score: number) => {
    if (score >= 0.8) return 'Very Similar';
    if (score >= 0.6) return 'Similar';
    return 'Somewhat Similar';
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Find Similar Images</h3>
          <p className="text-sm text-gray-600 mt-1">
            Find images similar to "{sourceImage.original_filename}"
          </p>
        </div>
        {onClose && (
          <Button onClick={onClose} variant="secondary" size="sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        )}
      </div>

      {/* Source Image Preview */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <img
              src={sourceImage.thumbnail_url || sourceImage.original_url}
              alt={sourceImage.original_filename}
              className="w-16 h-16 object-cover rounded-lg"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {sourceImage.original_filename}
            </h4>
            <p className="text-sm text-gray-500 mt-1">
              {sourceImage.ai_tags?.slice(0, 3).join(', ')}
            </p>
            <p className="text-xs text-gray-400 mt-1 line-clamp-2">
              {sourceImage.ai_description}
            </p>
          </div>
        </div>
      </div>

      {/* Search Controls */}
      <div className="mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Similarity Threshold
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={similarityThreshold}
                onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm text-gray-600 w-12">
                {Math.round(similarityThreshold * 100)}%
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Higher values return more similar images
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Results
            </label>
            <select
              value={maxResults}
              onChange={(e) => setMaxResults(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={5}>5 images</option>
              <option value={10}>10 images</option>
              <option value={20}>20 images</option>
              <option value={50}>50 images</option>
            </select>
          </div>
        </div>

        <Button
          onClick={findSimilarImages}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Finding Similar Images...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Find Similar Images
            </>
          )}
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Search Failed</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {similarImages.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium text-gray-900">
              Similar Images ({similarImages.length})
            </h4>
            <div className="text-sm text-gray-500">
              Sorted by similarity
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {similarImages.map((image) => (
              <div key={image.id} className="relative group">
                <div
                  onClick={() => handleImageClick(image)}
                  className="cursor-pointer"
                >
                  <ImageCard
                    image={{
                      id: image.id,
                      filename: image.filename,
                      original_filename: image.filename,
                      file_size: 0,
                      mime_type: 'image/jpeg',
                      width: 0,
                      height: 0,
                      uploaded_at: image.created_at,
                      updated_at: image.created_at,
                      processing_status: 'completed',
                      ai_tags: image.ai_tags,
                      ai_description: image.ai_description,
                      dominant_colors: [],
                      thumbnail_url: image.thumbnail_url,
                      original_url: image.thumbnail_url,
                      user_id: sourceImage.user_id
                    }}
                    onClick={() => handleImageClick(image)}
                  />
                </div>

                {/* Similarity Score Overlay */}
                <div className="absolute top-2 right-2">
                  <div className={`px-2 py-1 text-xs font-medium rounded-full ${getSimilarityColor(image.similarity_score)}`}>
                    {Math.round(image.similarity_score * 100)}%
                  </div>
                </div>

                {/* Similarity Details on Hover */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="text-white text-center p-2">
                    <div className="text-sm font-medium">
                      {getSimilarityLabel(image.similarity_score)}
                    </div>
                    <div className="text-xs mt-1">
                      Tags: {Math.round(image.tag_similarity * 100)}%
                    </div>
                    <div className="text-xs">
                      Description: {Math.round(image.description_similarity * 100)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {!loading && similarImages.length === 0 && !error && (
        <div className="text-center py-8">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Similar Images Found</h3>
          <p className="text-gray-500 mb-4">
            Try lowering the similarity threshold or check if you have other images with AI analysis.
          </p>
          <Button onClick={findSimilarImages} variant="secondary">
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
};
