import { useState, useCallback, useEffect } from 'react';
import { SearchService } from '../services/searchService';
import { useErrorHandler } from './useErrorHandler';
import { useToast } from '../contexts/ToastContext';
import type { SearchFilters, SearchResult } from '../types';

interface UseSearchOptions {
  initialQuery?: string;
  initialFilters?: SearchFilters;
  pageSize?: number;
  autoSearch?: boolean;
}

interface UseSearchReturn {
  // State
  query: string;
  filters: SearchFilters;
  results: SearchResult | null;
  loading: boolean;
  searching: boolean;
  error: string | null;
  
  // Actions
  setQuery: (query: string) => void;
  setFilters: (filters: SearchFilters) => void;
  search: (searchQuery?: string, searchFilters?: SearchFilters, showNotifications?: boolean) => Promise<void>;
  clearSearch: () => void;
  clearFilters: () => void;
  clearError: () => void;
  
  // Computed
  hasResults: boolean;
  hasActiveFilters: boolean;
  hasSearch: boolean;
}

export const useSearch = (options: UseSearchOptions = {}): UseSearchReturn => {
  const {
    initialQuery = '',
    initialFilters = {},
    pageSize = 20,
    autoSearch = false
  } = options;

  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { handleError } = useErrorHandler();
  const { addToast } = useToast();

  // Check if there are active filters
  const hasActiveFilters = useCallback(() => {
    return Boolean(
      (filters.tags && filters.tags.length > 0) ||
      (filters.colors && filters.colors.length > 0) ||
      filters.dateFrom ||
      filters.dateTo ||
      filters.fileSizeMin ||
      filters.fileSizeMax
    );
  }, [filters]);

  // Check if there's an active search
  const hasSearch = useCallback(() => {
    return Boolean(query.trim().length > 0 || hasActiveFilters());
  }, [query, hasActiveFilters]);

  // Perform search
  const search = useCallback(async (searchQuery?: string, searchFilters?: SearchFilters, showNotifications: boolean = true) => {
    const finalQuery = searchQuery !== undefined ? searchQuery : query;
    const finalFilters = searchFilters !== undefined ? searchFilters : filters;

    // Don't search if no query and no filters
    if (!finalQuery.trim() && !hasActiveFilters()) {
      setResults(null);
      return;
    }

    try {
      setSearching(true);
      setError(null);

      const searchOptions = {
        query: finalQuery.trim() || undefined,
        color: finalFilters.colors?.[0], // Use first color for now
        tags: finalFilters.tags,
        page: 1,
        limit: pageSize,
        sortBy: 'uploaded_at',
        sortOrder: 'desc' as const
      };

      const searchResults = await SearchService.searchImages(searchOptions);
      setResults(searchResults);

      // Only show notifications for explicit searches, not auto-searches
      if (showNotifications) {
        if (searchResults.images.length > 0) {
          addToast({
            type: 'success',
            title: 'Search Complete',
            message: `Found ${searchResults.total} image${searchResults.total !== 1 ? 's' : ''}`,
            duration: 3000
          });
        } else {
          addToast({
            type: 'info',
            title: 'No Results',
            message: 'No images found matching your search criteria',
            duration: 3000
          });
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      handleError(err, { context: 'Search.search' });
      
      // Always show error notifications
      addToast({
        type: 'error',
        title: 'Search Failed',
        message: errorMessage,
        duration: 5000
      });
    } finally {
      setSearching(false);
    }
  }, [query, filters, pageSize, hasActiveFilters, addToast, handleError]);

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery('');
    setResults(null);
    setError(null);
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters({});
    setError(null);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-search when query or filters change
  useEffect(() => {
    if (autoSearch && (query.trim() || hasActiveFilters())) {
      const timeoutId = setTimeout(() => {
        search(undefined, undefined, false); // Disable notifications for auto-search
      }, 300); // Debounce search

      return () => clearTimeout(timeoutId);
    }
  }, [autoSearch, query, filters, search, hasActiveFilters]);

  // Computed values
  const hasResults = results !== null && results.images.length > 0;

  return {
    // State
    query,
    filters,
    results,
    loading: searching,
    searching,
    error,
    
    // Actions
    setQuery,
    setFilters,
    search,
    clearSearch,
    clearFilters,
    clearError,
    
    // Computed
    hasResults,
    hasActiveFilters: hasActiveFilters(),
    hasSearch: hasSearch()
  };
};
