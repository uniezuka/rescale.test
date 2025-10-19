import { useState, useCallback, useRef } from 'react';

interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  enableLazyLoading?: boolean;
  enableProgressiveLoading?: boolean;
}

interface OptimizedImageState {
  src: string;
  loading: boolean;
  error: boolean;
  loaded: boolean;
}

export const useImageOptimization = (options: ImageOptimizationOptions = {}) => {
  const {
    maxWidth = 800,
    maxHeight = 600,
    quality = 0.8,
    format = 'webp',
    enableLazyLoading = true,
    enableProgressiveLoading = true,
  } = options;

  const [imageState, setImageState] = useState<OptimizedImageState>({
    src: '',
    loading: false,
    error: false,
    loaded: false,
  });

  const observerRef = useRef<IntersectionObserver | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Optimize image URL with parameters
  const optimizeImageUrl = useCallback((originalUrl: string): string => {
    if (!originalUrl) return originalUrl;

    // If it's a Supabase URL, add optimization parameters
    if (originalUrl.includes('supabase')) {
      const url = new URL(originalUrl);
      
      // Add image transformation parameters
      url.searchParams.set('width', maxWidth.toString());
      url.searchParams.set('height', maxHeight.toString());
      url.searchParams.set('quality', quality.toString());
      url.searchParams.set('format', format);
      
      return url.toString();
    }

    // For other URLs, return as-is (could be enhanced with other CDN services)
    return originalUrl;
  }, [maxWidth, maxHeight, quality, format]);

  // Lazy loading setup
  const setupLazyLoading = useCallback((imgElement: HTMLImageElement) => {
    if (!enableLazyLoading) {
      imgElement.src = imageState.src;
      return;
    }

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            img.src = imageState.src;
            observerRef.current?.unobserve(img);
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
      }
    );

    observerRef.current.observe(imgElement);
  }, [imageState.src, enableLazyLoading]);

  // Progressive loading
  const setupProgressiveLoading = useCallback((imgElement: HTMLImageElement) => {
    if (!enableProgressiveLoading) return;

    // Create a low-quality placeholder
    const placeholder = document.createElement('canvas');
    const ctx = placeholder.getContext('2d');
    
    if (ctx) {
      placeholder.width = 20;
      placeholder.height = 20;
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, 20, 20);
      
      imgElement.src = placeholder.toDataURL();
    }

    // Load the actual image
    const actualImg = new Image();
    actualImg.onload = () => {
      imgElement.src = actualImg.src;
      setImageState(prev => ({ ...prev, loaded: true, loading: false }));
    };
    
    actualImg.onerror = () => {
      setImageState(prev => ({ ...prev, error: true, loading: false }));
    };
    
    actualImg.src = imageState.src;
  }, [imageState.src, enableProgressiveLoading]);

  // Load optimized image
  const loadImage = useCallback((originalUrl: string) => {
    setImageState(prev => ({ ...prev, loading: true, error: false, loaded: false }));
    
    const optimizedUrl = optimizeImageUrl(originalUrl);
    setImageState(prev => ({ ...prev, src: optimizedUrl }));
  }, [optimizeImageUrl]);

  // Cleanup
  const cleanup = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
  }, []);

  return {
    imageState,
    loadImage,
    setupLazyLoading,
    setupProgressiveLoading,
    cleanup,
    imgRef,
  };
};

// Hook for managing multiple images
export const useImageGalleryOptimization = (imageUrls: string[]) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
  const [errorImages, setErrorImages] = useState<Set<string>>(new Set());

  const loadImage = useCallback((url: string) => {
    if (loadedImages.has(url) || loadingImages.has(url)) return;

    setLoadingImages(prev => new Set(prev).add(url));

    const img = new Image();
    img.onload = () => {
      setLoadedImages(prev => new Set(prev).add(url));
      setLoadingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(url);
        return newSet;
      });
    };
    
    img.onerror = () => {
      setErrorImages(prev => new Set(prev).add(url));
      setLoadingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(url);
        return newSet;
      });
    };
    
    img.src = url;
  }, [loadedImages, loadingImages]);

  const loadAllImages = useCallback(() => {
    imageUrls.forEach(loadImage);
  }, [imageUrls, loadImage]);

  const isImageLoaded = useCallback((url: string) => loadedImages.has(url), [loadedImages]);
  const isImageLoading = useCallback((url: string) => loadingImages.has(url), [loadingImages]);
  const isImageError = useCallback((url: string) => errorImages.has(url), [errorImages]);

  return {
    loadedImages: Array.from(loadedImages),
    loadingImages: Array.from(loadingImages),
    errorImages: Array.from(errorImages),
    loadImage,
    loadAllImages,
    isImageLoaded,
    isImageLoading,
    isImageError,
    totalImages: imageUrls.length,
    loadedCount: loadedImages.size,
    loadingCount: loadingImages.size,
    errorCount: errorImages.size,
  };
};
