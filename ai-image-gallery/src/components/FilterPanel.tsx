import React, { useState, useEffect } from 'react';
import { SearchService } from '../services/searchService';
import { Button } from './Button';
import { Input } from './Input';
import type { SearchFilters } from '../types';

interface FilterPanelProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onClearFilters: () => void;
  className?: string;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  className = ''
}) => {
  const [popularTags, setPopularTags] = useState<string[]>([]);
  const [popularColors, setPopularColors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load popular tags and colors
  useEffect(() => {
    loadPopularData();
  }, []);

  const loadPopularData = async () => {
    try {
      setLoading(true);
      const suggestions = await SearchService.getSearchSuggestions('');
      setPopularTags(suggestions.popular_tags);
      
      // Extract popular colors from suggestions (this would need backend support)
      // For now, we'll use a predefined set of common colors
      setPopularColors([
        '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
        '#FFA500', '#800080', '#008000', '#000080', '#808080', '#000000'
      ]);
    } catch (error) {
      console.error('Failed to load popular data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTagToggle = (tag: string) => {
    const currentTags = filters.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    
    onFiltersChange({ ...filters, tags: newTags });
  };

  const handleColorToggle = (color: string) => {
    const currentColors = filters.colors || [];
    const newColors = currentColors.includes(color)
      ? currentColors.filter(c => c !== color)
      : [...currentColors, color];
    
    onFiltersChange({ ...filters, colors: newColors });
  };

  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, dateFrom: e.target.value });
  };

  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, dateTo: e.target.value });
  };

  const handleFileSizeMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value ? parseInt(e.target.value) : undefined;
    onFiltersChange({ ...filters, fileSizeMin: value });
  };

  const handleFileSizeMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value ? parseInt(e.target.value) : undefined;
    onFiltersChange({ ...filters, fileSizeMax: value });
  };

  const hasActiveFilters = () => {
    return (
      (filters.tags && filters.tags.length > 0) ||
      (filters.colors && filters.colors.length > 0) ||
      filters.dateFrom ||
      filters.dateTo ||
      filters.fileSizeMin ||
      filters.fileSizeMax
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        <div className="flex items-center space-x-2">
          {hasActiveFilters() && (
            <Button
              onClick={onClearFilters}
              variant="secondary"
              size="sm"
            >
              Clear All
            </Button>
          )}
          <Button
            onClick={() => setShowAdvanced(!showAdvanced)}
            variant="secondary"
            size="sm"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced
          </Button>
        </div>
      </div>

      {/* Tags Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tags
        </label>
        {loading ? (
          <div className="text-sm text-gray-500">Loading tags...</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {popularTags.slice(0, 12).map((tag, index) => (
              <button
                key={index}
                onClick={() => handleTagToggle(tag)}
                className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                  filters.tags?.includes(tag)
                    ? 'bg-blue-100 text-blue-800 border-blue-300'
                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
        {filters.tags && filters.tags.length > 0 && (
          <div className="mt-2 text-sm text-gray-600">
            {filters.tags.length} tag{filters.tags.length !== 1 ? 's' : ''} selected
          </div>
        )}
      </div>

      {/* Colors Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Colors
        </label>
        <div className="flex flex-wrap gap-2">
          {popularColors.map((color, index) => (
            <button
              key={index}
              onClick={() => handleColorToggle(color)}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                filters.colors?.includes(color)
                  ? 'border-gray-800 scale-110'
                  : 'border-gray-300 hover:scale-105'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
        {filters.colors && filters.colors.length > 0 && (
          <div className="mt-2 text-sm text-gray-600">
            {filters.colors.length} color{filters.colors.length !== 1 ? 's' : ''} selected
          </div>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="space-y-4 border-t border-gray-200 pt-4">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Date
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">From</label>
                <Input
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={handleDateFromChange}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">To</label>
                <Input
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={handleDateToChange}
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* File Size Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              File Size
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Min Size (bytes)</label>
                <Input
                  type="number"
                  value={filters.fileSizeMin || ''}
                  onChange={handleFileSizeMinChange}
                  placeholder="0"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Max Size (bytes)</label>
                <Input
                  type="number"
                  value={filters.fileSizeMax || ''}
                  onChange={handleFileSizeMaxChange}
                  placeholder="1000000"
                  className="text-sm"
                />
              </div>
            </div>
            {filters.fileSizeMin && (
              <div className="mt-1 text-xs text-gray-500">
                Min: {formatFileSize(filters.fileSizeMin)}
              </div>
            )}
            {filters.fileSizeMax && (
              <div className="mt-1 text-xs text-gray-500">
                Max: {formatFileSize(filters.fileSizeMax)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters() && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm font-medium text-blue-900 mb-2">Active Filters:</div>
          <div className="space-y-1">
            {filters.tags && filters.tags.length > 0 && (
              <div className="text-sm text-blue-800">
                Tags: {filters.tags.join(', ')}
              </div>
            )}
            {filters.colors && filters.colors.length > 0 && (
              <div className="text-sm text-blue-800">
                Colors: {filters.colors.join(', ')}
              </div>
            )}
            {filters.dateFrom && (
              <div className="text-sm text-blue-800">
                From: {new Date(filters.dateFrom).toLocaleDateString()}
              </div>
            )}
            {filters.dateTo && (
              <div className="text-sm text-blue-800">
                To: {new Date(filters.dateTo).toLocaleDateString()}
              </div>
            )}
            {filters.fileSizeMin && (
              <div className="text-sm text-blue-800">
                Min Size: {formatFileSize(filters.fileSizeMin)}
              </div>
            )}
            {filters.fileSizeMax && (
              <div className="text-sm text-blue-800">
                Max Size: {formatFileSize(filters.fileSizeMax)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
