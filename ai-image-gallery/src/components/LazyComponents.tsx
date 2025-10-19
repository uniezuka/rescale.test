import React, { Suspense, lazy } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

// Lazy load heavy components
export const ImageModal = lazy(() => import('./ImageModal').then(module => ({ default: module.ImageModal })));
export const ImageUpload = lazy(() => import('./ImageUpload').then(module => ({ default: module.ImageUpload })));
export const SearchableImageGallery = lazy(() => import('./SearchableImageGallery').then(module => ({ default: module.SearchableImageGallery })));
export const SimilarImageSearch = lazy(() => import('./SimilarImageSearch').then(module => ({ default: module.SimilarImageSearch })));
export const FilterPanel = lazy(() => import('./FilterPanel').then(module => ({ default: module.FilterPanel })));
export const ProcessingDiagnostics = lazy(() => import('./ProcessingDiagnostics').then(module => ({ default: module.ProcessingDiagnostics })));

// Higher-order component for lazy loading with fallback
export const withLazyLoading = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) => {
  const LazyComponent = lazy(() => Promise.resolve({ default: Component }));
  
  return (props: P) => (
    <Suspense fallback={fallback || <LoadingSpinner />}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

// Lazy loading wrapper with custom fallback
export const LazyWrapper: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => (
  <Suspense fallback={fallback || <LoadingSpinner />}>
    {children}
  </Suspense>
);
