export interface AzureVisionResponse {
  tags: string[];
  description: string;
  dominantColors: string[];
}

export interface AzureVisionErrorData {
  code: string;
  message: string;
  details?: unknown;
}

export class AzureVisionService {
  private static readonly ENDPOINT = import.meta.env.VITE_AZURE_CV_ENDPOINT;
  private static readonly API_KEY = import.meta.env.VITE_AZURE_CV_KEY;
  
  // Free tier rate limiting configuration
  // Azure Computer Vision Free Tier: 10,000 predictions per month
  // Conservative limits to stay well within free tier
  private static readonly MAX_REQUESTS_PER_MONTH = 8000; // 80% of free tier limit
  private static readonly MAX_REQUESTS_PER_DAY = 300; // ~10,000/30 days with buffer
  private static readonly MAX_REQUESTS_PER_HOUR = 15; // Conservative hourly limit
  private static readonly MAX_REQUESTS_PER_MINUTE = 1; // Very conservative minute limit
  private static readonly MAX_REQUESTS_PER_SECOND = 1; // One request per second max
  
  // Usage tracking
  private static requestCounts = new Map<string, number[]>();
  private static monthlyUsage = 0;
  private static dailyUsage = 0;
  private static hourlyUsage = 0;
  
  // Usage tracking keys
  private static readonly MINUTE_KEY = 'minute';
  private static readonly SECOND_KEY = 'second';
  
  /**
   * Analyze image using Azure Computer Vision API
   */
  static async analyzeImage(imageUrl: string): Promise<AzureVisionResponse> {
    this.validateConfiguration();
    
    // Check rate limits
    await this.checkRateLimit();
    
    try {
      const response = await fetch(
        `${this.ENDPOINT}/vision/v3.2/analyze?visualFeatures=Tags,Description,Color&details=Landmarks&language=en`,
        {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': this.API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: imageUrl }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AzureVisionError({
          code: `HTTP_${response.status}`,
          message: (errorData as { message?: string }).message || `HTTP ${response.status}: ${response.statusText}`,
          details: errorData
        });
      }

      const data = await response.json();
      
      return this.processAzureResponse(data);
    } catch (error) {
      if (error instanceof AzureVisionError) {
        throw error;
      }
      
      throw new AzureVisionError({
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Unknown network error',
        details: error
      });
    }
  }

  /**
   * Analyze image from file blob
   */
  static async analyzeImageFromBlob(imageBlob: Blob): Promise<AzureVisionResponse> {
    this.validateConfiguration();
    
    // Check rate limits
    await this.checkRateLimit();
    
    try {
      const formData = new FormData();
      formData.append('image', imageBlob);
      
      const response = await fetch(
        `${this.ENDPOINT}/vision/v3.2/analyze?visualFeatures=Tags,Description,Color&details=Landmarks&language=en`,
        {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': this.API_KEY,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AzureVisionError({
          code: `HTTP_${response.status}`,
          message: (errorData as { message?: string }).message || `HTTP ${response.status}: ${response.statusText}`,
          details: errorData
        });
      }

      const data = await response.json();
      
      return this.processAzureResponse(data);
    } catch (error) {
      if (error instanceof AzureVisionError) {
        throw error;
      }
      
      throw new AzureVisionError({
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Unknown network error',
        details: error
      });
    }
  }

  /**
   * Process Azure Computer Vision API response
   */
  private static processAzureResponse(data: unknown): AzureVisionResponse {
    const responseData = data as {
      tags?: Array<{ name: string }>;
      description?: { captions?: Array<{ text: string }> };
      color?: { dominantColors?: string[] };
    };

    const tags = responseData.tags?.map((tag) => tag.name).slice(0, 10) || [];
    const description = responseData.description?.captions?.[0]?.text || '';
    const dominantColors = responseData.color?.dominantColors || [];

    return {
      tags: this.cleanTags(tags),
      description: this.cleanDescription(description),
      dominantColors: this.formatColors(dominantColors)
    };
  }

  /**
   * Clean and filter tags
   */
  private static cleanTags(tags: string[]): string[] {
    return tags
      .filter(tag => tag && tag.length > 2 && tag.length < 50)
      .map(tag => tag.toLowerCase().trim())
      .filter((tag, index, arr) => arr.indexOf(tag) === index) // Remove duplicates
      .slice(0, 8); // Limit to 8 tags
  }

  /**
   * Clean description text
   */
  private static cleanDescription(description: string): string {
    if (!description) return '';
    
    return description
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .substring(0, 200); // Limit length
  }

  /**
   * Format color values
   */
  private static formatColors(colors: string[]): string[] {
    return colors
      .filter(color => color && /^#[0-9A-Fa-f]{6}$/.test(color))
      .map(color => color.toUpperCase())
      .slice(0, 5); // Limit to 5 colors
  }

  /**
   * Validate Azure configuration
   */
  private static validateConfiguration(): void {
    if (!this.ENDPOINT || !this.API_KEY) {
      throw new AzureVisionError({
        code: 'CONFIGURATION_ERROR',
        message: 'Azure Computer Vision endpoint and API key must be configured'
      });
    }
  }

  /**
   * Check and enforce rate limits to stay within free tier
   */
  private static async checkRateLimit(): Promise<void> {
    const now = Date.now();
    
    // Initialize usage tracking from localStorage if available
    this.initializeUsageTracking();
    
    // Check monthly limit (most restrictive)
    if (this.monthlyUsage >= this.MAX_REQUESTS_PER_MONTH) {
      throw new AzureVisionError({
        code: 'MONTHLY_LIMIT_EXCEEDED',
        message: `Monthly free tier limit reached (${this.MAX_REQUESTS_PER_MONTH} requests). Please wait until next month or upgrade to a paid plan.`
      });
    }
    
    // Check daily limit
    if (this.dailyUsage >= this.MAX_REQUESTS_PER_DAY) {
      throw new AzureVisionError({
        code: 'DAILY_LIMIT_EXCEEDED',
        message: `Daily limit reached (${this.MAX_REQUESTS_PER_DAY} requests). Please try again tomorrow.`
      });
    }
    
    // Check hourly limit
    if (this.hourlyUsage >= this.MAX_REQUESTS_PER_HOUR) {
      const waitTime = 3600000 - (now % 3600000); // Wait until next hour
      await this.sleep(waitTime);
    }
    
    // Clean old entries
    this.cleanOldEntries(now);
    
    // Check minute limit
    const minuteRequests = this.requestCounts.get(this.MINUTE_KEY) || [];
    if (minuteRequests.length >= this.MAX_REQUESTS_PER_MINUTE) {
      const oldestRequest = Math.min(...minuteRequests);
      const waitTime = 60000 - (now - oldestRequest);
      if (waitTime > 0) {
        await this.sleep(waitTime);
      }
    }
    
    // Check second limit
    const secondRequests = this.requestCounts.get(this.SECOND_KEY) || [];
    if (secondRequests.length >= this.MAX_REQUESTS_PER_SECOND) {
      const oldestRequest = Math.min(...secondRequests);
      const waitTime = 1000 - (now - oldestRequest);
      if (waitTime > 0) {
        await this.sleep(waitTime);
      }
    }
    
    // Record this request
    this.requestCounts.set(this.MINUTE_KEY, [...(this.requestCounts.get(this.MINUTE_KEY) || []), now]);
    this.requestCounts.set(this.SECOND_KEY, [...(this.requestCounts.get(this.SECOND_KEY) || []), now]);
    
    // Update usage counters
    this.monthlyUsage++;
    this.dailyUsage++;
    this.hourlyUsage++;
    
    // Save usage to localStorage
    this.saveUsageTracking();
  }

  /**
   * Clean old rate limit entries
   */
  private static cleanOldEntries(now: number): void {
    for (const [key, requests] of this.requestCounts.entries()) {
      let cutoff: number;
      switch (key) {
        case this.MINUTE_KEY:
          cutoff = now - 60000; // 1 minute
          break;
        case this.SECOND_KEY:
          cutoff = now - 1000; // 1 second
          break;
        default:
          cutoff = now - 60000; // Default to 1 minute
      }
      this.requestCounts.set(key, requests.filter(time => time > cutoff));
    }
  }

  /**
   * Initialize usage tracking from localStorage
   */
  private static initializeUsageTracking(): void {
    try {
      const stored = localStorage.getItem('azure-vision-usage');
      if (stored) {
        const usage = JSON.parse(stored);
        const now = Date.now();
        
        // Check if we need to reset counters
        const lastReset = usage.lastReset || now;
        const daysSinceReset = Math.floor((now - lastReset) / (1000 * 60 * 60 * 24));
        const monthsSinceReset = Math.floor((now - lastReset) / (1000 * 60 * 60 * 24 * 30));
        
        // Reset daily usage if it's a new day
        if (daysSinceReset >= 1) {
          this.dailyUsage = 0;
          this.hourlyUsage = 0;
        }
        
        // Reset monthly usage if it's a new month
        if (monthsSinceReset >= 1) {
          this.monthlyUsage = 0;
          this.dailyUsage = 0;
          this.hourlyUsage = 0;
        } else {
          this.monthlyUsage = usage.monthly || 0;
          this.dailyUsage = usage.daily || 0;
          this.hourlyUsage = usage.hourly || 0;
        }
      }
    } catch (error) {
      console.warn('Failed to load usage tracking from localStorage:', error);
      // Reset counters if loading fails
      this.monthlyUsage = 0;
      this.dailyUsage = 0;
      this.hourlyUsage = 0;
    }
  }

  /**
   * Save usage tracking to localStorage
   */
  private static saveUsageTracking(): void {
    try {
      const usage = {
        monthly: this.monthlyUsage,
        daily: this.dailyUsage,
        hourly: this.hourlyUsage,
        lastReset: Date.now()
      };
      localStorage.setItem('azure-vision-usage', JSON.stringify(usage));
    } catch (error) {
      console.warn('Failed to save usage tracking to localStorage:', error);
    }
  }

  /**
   * Get current usage statistics
   */
  static getUsageStats(): {
    monthly: { used: number; limit: number; remaining: number };
    daily: { used: number; limit: number; remaining: number };
    hourly: { used: number; limit: number; remaining: number };
  } {
    this.initializeUsageTracking();
    
    return {
      monthly: {
        used: this.monthlyUsage,
        limit: this.MAX_REQUESTS_PER_MONTH,
        remaining: Math.max(0, this.MAX_REQUESTS_PER_MONTH - this.monthlyUsage)
      },
      daily: {
        used: this.dailyUsage,
        limit: this.MAX_REQUESTS_PER_DAY,
        remaining: Math.max(0, this.MAX_REQUESTS_PER_DAY - this.dailyUsage)
      },
      hourly: {
        used: this.hourlyUsage,
        limit: this.MAX_REQUESTS_PER_HOUR,
        remaining: Math.max(0, this.MAX_REQUESTS_PER_HOUR - this.hourlyUsage)
      }
    };
  }

  /**
   * Increment usage counters (called when processing starts)
   */
  static incrementUsage(): void {
    this.initializeUsageTracking();
    this.monthlyUsage++;
    this.dailyUsage++;
    this.hourlyUsage++;
    this.saveUsageTracking();
  }

  /**
   * Check if we can make a request (without incrementing counters)
   */
  static canMakeRequest(): boolean {
    this.initializeUsageTracking();
    return this.monthlyUsage < this.MAX_REQUESTS_PER_MONTH &&
           this.dailyUsage < this.MAX_REQUESTS_PER_DAY &&
           this.hourlyUsage < this.MAX_REQUESTS_PER_HOUR;
  }

  /**
   * Reset usage counters (for testing or manual reset)
   */
  static resetUsageCounters(): void {
    this.monthlyUsage = 0;
    this.dailyUsage = 0;
    this.hourlyUsage = 0;
    this.requestCounts.clear();
    this.saveUsageTracking();
  }

  /**
   * Sleep utility
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Test Azure Computer Vision connectivity
   */
  static async testConnection(): Promise<boolean> {
    try {
      this.validateConfiguration();
      
      // Test with a simple image URL
      const testImageUrl = 'https://via.placeholder.com/150x150/000000/FFFFFF?text=Test';
      
      const response = await fetch(
        `${this.ENDPOINT}/vision/v3.2/analyze?visualFeatures=Tags&language=en`,
        {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': this.API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: testImageUrl }),
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Azure Computer Vision connection test failed:', error);
      return false;
    }
  }
}

/**
 * Custom error class for Azure Vision errors
 */
export class AzureVisionError extends Error {
  public readonly code: string;
  public readonly details?: unknown;

  constructor(error: AzureVisionErrorData) {
    super(error.message);
    this.name = 'AzureVisionError';
    this.code = error.code;
    this.details = error.details;
  }
}