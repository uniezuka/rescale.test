import { supabase } from './supabase';
import type { SearchResult } from '../types';

export interface SearchOptions {
  query?: string;
  color?: string;
  tags?: string[];
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SimilarImageOptions {
  imageId: string;
  limit?: number;
  similarityThreshold?: number;
}

export interface SearchSuggestions {
  query: string;
  suggestions: string[];
  popular_tags: string[];
  recent_searches: string[];
}

export class SearchService {
  /**
   * Search images with various filters
   */
  static async searchImages(options: SearchOptions = {}): Promise<SearchResult> {
    const {
      query,
      color,
      tags,
      page = 1,
      limit = 20,
      sortBy = 'uploaded_at',
      sortOrder = 'desc'
    } = options;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let searchQuery = supabase
        .from('images')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply text search
      if (query) {
        searchQuery = searchQuery.or(`ai_description.ilike.%${query}%,ai_tags.cs.{${query}}`);
      }

      // Apply color filter
      if (color) {
        const colorCode = color.startsWith('#') ? color : `#${color}`;
        console.log('Applying color filter:', colorCode);
        searchQuery = searchQuery.contains('dominant_colors', [colorCode]);
      }

      // Apply tag filter
      if (tags && tags.length > 0) {
        searchQuery = searchQuery.overlaps('ai_tags', tags);
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      searchQuery = searchQuery.range(from, to);

      const { data, error, count } = await searchQuery;

      if (error) throw new Error(`Search failed: ${error.message}`);

      return {
        images: data || [],
        total: count || 0,
        page,
        limit,
        hasNext: page * limit < (count || 0),
        hasPrev: page > 1,
        searchTime: 0 // We'll calculate this on the backend
      };
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  /**
   * Find similar images based on AI analysis
   */
  static async findSimilarImages(options: SimilarImageOptions): Promise<{
    source_image_id: string;
    similar_images: any[];
    search_time: number;
  }> {
    const { imageId, limit = 10, similarityThreshold = 0.7 } = options;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get source image
      const { data: sourceImage, error: sourceError } = await supabase
        .from('images')
        .select('*')
        .eq('id', imageId)
        .eq('user_id', user.id)
        .single();

      if (sourceError || !sourceImage) {
        throw new Error('Source image not found');
      }

      if (!sourceImage.ai_tags || !sourceImage.ai_description) {
        throw new Error('Source image must have AI analysis completed');
      }

      // Get all other images with AI analysis
      const { data: allImages, error: allImagesError } = await supabase
        .from('images')
        .select('*')
        .eq('user_id', user.id)
        .neq('id', imageId)
        .not('ai_tags', 'is', null)
        .not('ai_description', 'is', null);

      if (allImagesError) {
        throw new Error(`Failed to fetch images: ${allImagesError.message}`);
      }

      if (!allImages || allImages.length === 0) {
        return {
          source_image_id: imageId,
          similar_images: [],
          search_time: 0
        };
      }

      // Calculate similarity scores
      const similarImages = [];
      const sourceTags = new Set(sourceImage.ai_tags);
      const sourceDescription = sourceImage.ai_description.toLowerCase();

      for (const image of allImages) {
        // Calculate tag similarity (Jaccard similarity)
        const imageTags = new Set(image.ai_tags);
        const tagIntersection = new Set([...sourceTags].filter(x => imageTags.has(x)));
        const tagUnion = new Set([...sourceTags, ...imageTags]);
        const tagSimilarity = tagUnion.size > 0 ? tagIntersection.size / tagUnion.size : 0;

        // Calculate description similarity (word overlap)
        const imageDescription = image.ai_description.toLowerCase();
        const sourceWords = new Set(sourceDescription.split(/\s+/));
        const imageWords = new Set(imageDescription.split(/\s+/));
        const wordIntersection = new Set([...sourceWords].filter(x => imageWords.has(x)));
        const wordUnion = new Set([...sourceWords, ...imageWords]);
        const descSimilarity = wordUnion.size > 0 ? wordIntersection.size / wordUnion.size : 0;

        // Combined similarity score (70% tags, 30% description)
        const combinedSimilarity = (tagSimilarity * 0.7) + (descSimilarity * 0.3);

        if (combinedSimilarity >= similarityThreshold) {
          similarImages.push({
            id: image.id,
            filename: image.original_filename,
            thumbnail_url: image.thumbnail_url,
            similarity_score: Math.round(combinedSimilarity * 1000) / 1000,
            tag_similarity: Math.round(tagSimilarity * 1000) / 1000,
            description_similarity: Math.round(descSimilarity * 1000) / 1000,
            ai_tags: image.ai_tags,
            ai_description: image.ai_description,
            uploaded_at: image.uploaded_at
          });
        }
      }

      // Sort by similarity score and limit results
      similarImages.sort((a, b) => b.similarity_score - a.similarity_score);
      const limitedResults = similarImages.slice(0, limit);

      return {
        source_image_id: imageId,
        similar_images: limitedResults,
        search_time: 0 // We'll calculate this on the backend
      };
    } catch (error) {
      console.error('Similar image search error:', error);
      throw error;
    }
  }

  /**
   * Get search suggestions
   */
  static async getSearchSuggestions(query: string): Promise<SearchSuggestions> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get popular tags
      const { data: tagsData, error: tagsError } = await supabase
        .from('images')
        .select('ai_tags')
        .eq('user_id', user.id)
        .not('ai_tags', 'is', null);

      if (tagsError) {
        throw new Error(`Failed to fetch tags: ${tagsError.message}`);
      }

      let popularTags: string[] = [];
      if (tagsData) {
        const allTags: string[] = [];
        for (const image of tagsData) {
          allTags.push(...(image.ai_tags || []));
        }

        // Count tag frequency
        const tagCounts: { [key: string]: number } = {};
        for (const tag of allTags) {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }

        // Get top 10 tags
        popularTags = Object.entries(tagCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([tag]) => tag);
      }

      // Generate suggestions based on query
      const suggestions = query
        ? popularTags.filter(tag => tag.toLowerCase().includes(query.toLowerCase())).slice(0, 5)
        : [];

      // Get recent searches from localStorage
      const recentSearches = this.getRecentSearches();

      return {
        query,
        suggestions,
        popular_tags: popularTags,
        recent_searches: recentSearches
      };
    } catch (error) {
      console.error('Search suggestions error:', error);
      throw error;
    }
  }

  /**
   * Save search query to recent searches
   */
  static saveRecentSearch(query: string): void {
    if (!query.trim()) return;

    try {
      const recentSearches = this.getRecentSearches();
      const newSearches = [query, ...recentSearches.filter(s => s !== query)].slice(0, 10);
      localStorage.setItem('recent_searches', JSON.stringify(newSearches));
    } catch (error) {
      console.error('Failed to save recent search:', error);
    }
  }

  /**
   * Get recent searches from localStorage
   */
  static getRecentSearches(): string[] {
    try {
      const stored = localStorage.getItem('recent_searches');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get recent searches:', error);
      return [];
    }
  }

  /**
   * Clear recent searches
   */
  static clearRecentSearches(): void {
    try {
      localStorage.removeItem('recent_searches');
    } catch (error) {
      console.error('Failed to clear recent searches:', error);
    }
  }
}
