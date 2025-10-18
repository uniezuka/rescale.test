import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SearchService } from '../services/searchService';
import { Input } from './Input';
import { Button } from './Button';
import { LoadingSpinner } from './LoadingSpinner';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onClear: () => void;
  placeholder?: string;
  className?: string;
  showSuggestions?: boolean;
  debounceMs?: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onClear,
  placeholder = "Search images by tags, descriptions, or keywords...",
  className = '',
  showSuggestions = true,
  debounceMs = 300
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [popularTags, setPopularTags] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showSuggestionsDropdown, setShowSuggestionsDropdown] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<number | null>(null);

  // Load suggestions when query changes
  const loadSuggestions = useCallback(async (searchQuery: string) => {
    if (!showSuggestions) return;

    try {
      setLoadingSuggestions(true);
      const result = await SearchService.getSearchSuggestions(searchQuery);
      setSuggestions(result.suggestions);
      setPopularTags(result.popular_tags);
      setRecentSearches(result.recent_searches);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  }, [showSuggestions]);

  // Load initial suggestions
  useEffect(() => {
    loadSuggestions('');
  }, [loadSuggestions]);

  // Debounced search
  const debouncedSearch = useCallback((searchQuery: string) => {
    if (debounceTimeoutRef.current !== null) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        onSearch(searchQuery);
        SearchService.saveRecentSearch(searchQuery);
        setIsSearching(false);
      }
    }, debounceMs);
  }, [onSearch, debounceMs]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.trim()) {
      debouncedSearch(value);
      loadSuggestions(value);
    } else {
      onClear();
    }
  };

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsSearching(true);
      onSearch(query);
      SearchService.saveRecentSearch(query);
      setIsSearching(false);
      setShowSuggestionsDropdown(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setIsSearching(true);
    onSearch(suggestion);
    SearchService.saveRecentSearch(suggestion);
    setIsSearching(false);
    setShowSuggestionsDropdown(false);
  };

  // Handle clear
  const handleClear = () => {
    setQuery('');
    onClear();
    setShowSuggestionsDropdown(false);
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (showSuggestions && (suggestions.length > 0 || popularTags.length > 0 || recentSearches.length > 0)) {
      setShowSuggestionsDropdown(true);
    }
  };

  // Handle input blur
  const handleInputBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      if (!dropdownRef.current?.contains(document.activeElement)) {
        setShowSuggestionsDropdown(false);
      }
    }, 150);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestionsDropdown(false);
      inputRef.current?.blur();
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current !== null) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const hasSuggestions = suggestions.length > 0 || popularTags.length > 0 || recentSearches.length > 0;

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <Input
            ref={inputRef}
            value={query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="pr-20"
            showValidation={false}
          />
          
          {/* Search Icon */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {isSearching ? (
              <LoadingSpinner size="sm" />
            ) : (
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </div>

          {/* Clear Button */}
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute inset-y-0 right-8 flex items-center pr-2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Search Button */}
        <Button
          type="submit"
          disabled={!query.trim() || isSearching}
          className="absolute right-1 top-1 h-8 px-3 text-sm"
        >
          Search
        </Button>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && showSuggestionsDropdown && hasSuggestions && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto"
        >
          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="p-2">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Suggestions
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* Popular Tags */}
          {popularTags.length > 0 && (
            <div className="p-2 border-t border-gray-100">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Popular Tags
              </div>
              <div className="flex flex-wrap gap-1">
                {popularTags.slice(0, 8).map((tag, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(tag)}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="p-2 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Recent Searches
                </div>
                <button
                  onClick={() => {
                    SearchService.clearRecentSearches();
                    setRecentSearches([]);
                  }}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Clear
                </button>
              </div>
              {recentSearches.slice(0, 5).map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(search)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center"
                >
                  <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {search}
                </button>
              ))}
            </div>
          )}

          {/* Loading State */}
          {loadingSuggestions && (
            <div className="p-4 text-center">
              <LoadingSpinner size="sm" />
              <p className="text-sm text-gray-500 mt-2">Loading suggestions...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
