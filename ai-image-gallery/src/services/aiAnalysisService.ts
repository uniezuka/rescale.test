import type { ImageMetadata } from '../types/image';

export interface AIAnalysisResult {
  tags: string[];
  description: string;
  dominantColors: string[];
  confidence?: number;
  processingTime?: number;
}

export interface AIAnalysisOptions {
  includeConfidence?: boolean;
  maxTags?: number;
  maxDescriptionLength?: number;
  maxColors?: number;
}

export class AIAnalysisService {
  private static readonly DEFAULT_OPTIONS: AIAnalysisOptions = {
    includeConfidence: false,
    maxTags: 8,
    maxDescriptionLength: 200,
    maxColors: 5
  };

  /**
   * Process AI analysis results and apply business logic
   */
  static processAnalysisResult(
    rawResult: any,
    options: Partial<AIAnalysisOptions> = {}
  ): AIAnalysisResult {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };

    return {
      tags: this.processTags(rawResult.tags || [], opts.maxTags!),
      description: this.processDescription(rawResult.description || '', opts.maxDescriptionLength!),
      dominantColors: this.processColors(rawResult.dominantColors || [], opts.maxColors!),
      confidence: opts.includeConfidence ? this.calculateConfidence(rawResult) : undefined,
      processingTime: rawResult.processingTime
    };
  }

  /**
   * Process and clean tags
   */
  private static processTags(tags: string[], maxTags: number): string[] {
    return tags
      .filter(tag => tag && typeof tag === 'string')
      .map(tag => tag.toLowerCase().trim())
      .filter(tag => tag.length > 2 && tag.length < 50)
      .filter((tag, index, arr) => arr.indexOf(tag) === index) // Remove duplicates
      .slice(0, maxTags);
  }

  /**
   * Process and clean description
   */
  private static processDescription(description: string, maxLength: number): string {
    if (!description || typeof description !== 'string') return '';
    
    return description
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .substring(0, maxLength);
  }

  /**
   * Process and clean colors
   */
  private static processColors(colors: string[], maxColors: number): string[] {
    return colors
      .filter(color => color && typeof color === 'string')
      .filter(color => /^#[0-9A-Fa-f]{6}$/.test(color))
      .map(color => color.toUpperCase())
      .filter((color, index, arr) => arr.indexOf(color) === index) // Remove duplicates
      .slice(0, maxColors);
  }

  /**
   * Calculate overall confidence score
   */
  private static calculateConfidence(result: any): number {
    // This is a simplified confidence calculation
    // In a real implementation, you'd use the actual confidence scores from Azure
    let confidence = 0.5; // Base confidence

    if (result.tags && result.tags.length > 0) {
      confidence += 0.2;
    }

    if (result.description && result.description.length > 10) {
      confidence += 0.2;
    }

    if (result.dominantColors && result.dominantColors.length > 0) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Generate search keywords from AI analysis
   */
  static generateSearchKeywords(image: ImageMetadata): string[] {
    const keywords: string[] = [];

    // Add filename keywords
    if (image.original_filename) {
      const filenameKeywords = image.original_filename
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2);
      keywords.push(...filenameKeywords);
    }

    // Add AI tags
    if (image.ai_tags && image.ai_tags.length > 0) {
      keywords.push(...image.ai_tags);
    }

    // Add description keywords
    if (image.ai_description) {
      const descriptionKeywords = image.ai_description
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 3);
      keywords.push(...descriptionKeywords);
    }

    // Remove duplicates and return
    return [...new Set(keywords)];
  }

  /**
   * Calculate similarity score between two images
   */
  static calculateSimilarity(image1: ImageMetadata, image2: ImageMetadata): number {
    let similarity = 0;
    let factors = 0;

    // Tag similarity
    if (image1.ai_tags && image2.ai_tags) {
      const commonTags = image1.ai_tags.filter(tag => image2.ai_tags!.includes(tag));
      const tagSimilarity = commonTags.length / Math.max(image1.ai_tags.length, image2.ai_tags.length);
      similarity += tagSimilarity * 0.4;
      factors += 0.4;
    }

    // Color similarity
    if (image1.dominant_colors && image2.dominant_colors) {
      const commonColors = image1.dominant_colors.filter(color => image2.dominant_colors!.includes(color));
      const colorSimilarity = commonColors.length / Math.max(image1.dominant_colors.length, image2.dominant_colors.length);
      similarity += colorSimilarity * 0.3;
      factors += 0.3;
    }

    // Description similarity (simplified)
    if (image1.ai_description && image2.ai_description) {
      const words1 = image1.ai_description.toLowerCase().split(/\s+/);
      const words2 = image2.ai_description.toLowerCase().split(/\s+/);
      const commonWords = words1.filter(word => words2.includes(word));
      const descriptionSimilarity = commonWords.length / Math.max(words1.length, words2.length);
      similarity += descriptionSimilarity * 0.3;
      factors += 0.3;
    }

    return factors > 0 ? similarity / factors : 0;
  }

  /**
   * Find similar images
   */
  static findSimilarImages(
    targetImage: ImageMetadata,
    allImages: ImageMetadata[],
    threshold: number = 0.3,
    limit: number = 10
  ): Array<{ image: ImageMetadata; similarity: number }> {
    const similarities = allImages
      .filter(img => img.id !== targetImage.id)
      .map(img => ({
        image: img,
        similarity: this.calculateSimilarity(targetImage, img)
      }))
      .filter(item => item.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return similarities;
  }

  /**
   * Generate color palette from dominant colors
   */
  static generateColorPalette(colors: string[]): {
    primary: string;
    secondary: string[];
    complementary: string[];
  } {
    if (colors.length === 0) {
      return {
        primary: '#000000',
        secondary: [],
        complementary: []
      };
    }

    const primary = colors[0];
    const secondary = colors.slice(1, 4);
    const complementary = this.generateComplementaryColors(primary);

    return {
      primary,
      secondary,
      complementary
    };
  }

  /**
   * Generate complementary colors
   */
  private static generateComplementaryColors(baseColor: string): string[] {
    // Convert hex to RGB
    const hex = baseColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Generate complementary color
    const compR = 255 - r;
    const compG = 255 - g;
    const compB = 255 - b;

    const complementary = `#${compR.toString(16).padStart(2, '0')}${compG.toString(16).padStart(2, '0')}${compB.toString(16).padStart(2, '0')}`;

    return [complementary];
  }

  /**
   * Validate AI analysis result
   */
  static validateAnalysisResult(result: any): boolean {
    if (!result || typeof result !== 'object') return false;

    // Check required fields
    if (!Array.isArray(result.tags)) return false;
    if (typeof result.description !== 'string') return false;
    if (!Array.isArray(result.dominantColors)) return false;

    // Validate tags
    if (!result.tags.every((tag: any) => typeof tag === 'string' && tag.length > 0)) {
      return false;
    }

    // Validate colors
    if (!result.dominantColors.every((color: any) => 
      typeof color === 'string' && /^#[0-9A-Fa-f]{6}$/.test(color)
    )) {
      return false;
    }

    return true;
  }

  /**
   * Get analysis quality score
   */
  static getAnalysisQuality(image: ImageMetadata): {
    score: number;
    factors: {
      hasTags: boolean;
      hasDescription: boolean;
      hasColors: boolean;
      tagCount: number;
      descriptionLength: number;
      colorCount: number;
    };
  } {
    const factors = {
      hasTags: !!(image.ai_tags && image.ai_tags.length > 0),
      hasDescription: !!(image.ai_description && image.ai_description.length > 0),
      hasColors: !!(image.dominant_colors && image.dominant_colors.length > 0),
      tagCount: image.ai_tags?.length || 0,
      descriptionLength: image.ai_description?.length || 0,
      colorCount: image.dominant_colors?.length || 0
    };

    let score = 0;

    // Base score for having any analysis
    if (factors.hasTags || factors.hasDescription || factors.hasColors) {
      score += 0.3;
    }

    // Tag quality
    if (factors.hasTags) {
      score += Math.min(factors.tagCount / 8, 1) * 0.3;
    }

    // Description quality
    if (factors.hasDescription) {
      score += Math.min(factors.descriptionLength / 100, 1) * 0.2;
    }

    // Color quality
    if (factors.hasColors) {
      score += Math.min(factors.colorCount / 5, 1) * 0.2;
    }

    return {
      score: Math.min(score, 1.0),
      factors
    };
  }
}
