import { supabase } from './supabase';

/**
 * Service for secure image URL generation and serving
 * This service provides API-based image URLs that require authentication
 */
export class SecureImageService {
  private static readonly API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

  /**
   * Get secure thumbnail URL that requires authentication
   */
  static getSecureThumbnailUrl(imageId: string): string {
    return `${this.API_BASE_URL}/images/${imageId}/thumbnail`;
  }

  /**
   * Get secure image view URL that requires authentication
   */
  static getSecureImageViewUrl(imageId: string): string {
    return `${this.API_BASE_URL}/images/${imageId}/view`;
  }

  /**
   * Get secure image download URL that requires authentication
   */
  static getSecureImageDownloadUrl(imageId: string): string {
    return `${this.API_BASE_URL}/images/${imageId}/download`;
  }

  /**
   * Get authenticated headers for API requests
   */
  private static async getAuthHeaders(): Promise<HeadersInit> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No active session found');
    }

    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Fetch image blob with authentication
   */
  static async fetchImageBlob(url: string): Promise<Blob> {
    try {
      const headers = await this.getAuthHeaders();
      
      // Remove Content-Type header for blob requests
      const blobHeaders = { ...headers } as Record<string, string>;
      delete blobHeaders['Content-Type'];
      
      const response = await fetch(url, {
        method: 'GET',
        headers: blobHeaders
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error fetching image blob:', error);
      throw error;
    }
  }

  /**
   * Create object URL from secure image
   */
  static async createSecureImageUrl(imageId: string, type: 'thumbnail' | 'view' = 'thumbnail'): Promise<string> {
    try {
      const url = type === 'thumbnail' 
        ? this.getSecureThumbnailUrl(imageId)
        : this.getSecureImageViewUrl(imageId);
      
      const blob = await this.fetchImageBlob(url);
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error creating secure image URL:', error);
      // Return a placeholder or error image
      return this.getPlaceholderImageUrl();
    }
  }

  /**
   * Get placeholder image URL for errors
   */
  private static getPlaceholderImageUrl(): string {
    // Create a simple placeholder using data URL
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#999';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Image not available', canvas.width / 2, canvas.height / 2);
    }
    
    return canvas.toDataURL();
  }

  /**
   * Revoke object URL to free memory
   */
  static revokeImageUrl(url: string): void {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Batch create secure image URLs
   */
  static async batchCreateSecureImageUrls(
    imageIds: string[], 
    type: 'thumbnail' | 'view' = 'thumbnail'
  ): Promise<Map<string, string>> {
    const urlMap = new Map<string, string>();
    
    try {
      // Create URLs in parallel with concurrency limit
      const batchSize = 5;
      for (let i = 0; i < imageIds.length; i += batchSize) {
        const batch = imageIds.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (imageId) => {
          try {
            const url = await this.createSecureImageUrl(imageId, type);
            return { imageId, url };
          } catch (error) {
            console.error(`Failed to create URL for image ${imageId}:`, error);
            return { imageId, url: this.getPlaceholderImageUrl() };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach(({ imageId, url }) => {
          urlMap.set(imageId, url);
        });
      }
    } catch (error) {
      console.error('Error in batch URL creation:', error);
    }

    return urlMap;
  }
}
