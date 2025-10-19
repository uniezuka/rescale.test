interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of items
  enablePersistence?: boolean; // Use localStorage
}

class CacheService {
  private cache = new Map<string, CacheItem<any>>();
  private options: Required<CacheOptions>;

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl || 5 * 60 * 1000, // 5 minutes default
      maxSize: options.maxSize || 100,
      enablePersistence: options.enablePersistence || false,
    };

    if (this.options.enablePersistence) {
      this.loadFromStorage();
    }
  }

  // Set cache item
  set<T>(key: string, data: T, customTtl?: number): void {
    const ttl = customTtl || this.options.ttl;
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl,
    };

    // Remove oldest items if cache is full
    if (this.cache.size >= this.options.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, item);

    if (this.options.enablePersistence) {
      this.saveToStorage();
    }
  }

  // Get cache item
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      if (this.options.enablePersistence) {
        this.saveToStorage();
      }
      return null;
    }

    return item.data as T;
  }

  // Check if key exists and is not expired
  has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      if (this.options.enablePersistence) {
        this.saveToStorage();
      }
      return false;
    }

    return true;
  }

  // Delete cache item
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    
    if (deleted && this.options.enablePersistence) {
      this.saveToStorage();
    }
    
    return deleted;
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
    
    if (this.options.enablePersistence) {
      localStorage.removeItem('ai-image-gallery-cache');
    }
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let expiredCount = 0;
    
    for (const [, item] of this.cache.entries()) {
      if (now > item.expiry) {
        expiredCount++;
      }
    }

    return {
      totalItems: this.cache.size,
      expiredItems: expiredCount,
      validItems: this.cache.size - expiredCount,
      maxSize: this.options.maxSize,
      utilization: (this.cache.size / this.options.maxSize) * 100,
    };
  }

  // Clean expired items
  cleanup(): number {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0 && this.options.enablePersistence) {
      this.saveToStorage();
    }

    return cleanedCount;
  }

  // Save to localStorage
  private saveToStorage(): void {
    try {
      const cacheData = Array.from(this.cache.entries());
      localStorage.setItem('ai-image-gallery-cache', JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to save cache to localStorage:', error);
    }
  }

  // Load from localStorage
  private loadFromStorage(): void {
    try {
      const cacheData = localStorage.getItem('ai-image-gallery-cache');
      if (cacheData) {
        const entries = JSON.parse(cacheData);
        this.cache = new Map(entries);
        
        // Clean expired items on load
        this.cleanup();
      }
    } catch (error) {
      console.warn('Failed to load cache from localStorage:', error);
      this.cache.clear();
    }
  }
}

// Export CacheService class
export { CacheService };

// Create singleton instances for different cache types
export const imageCache = new CacheService({
  ttl: 30 * 60 * 1000, // 30 minutes
  maxSize: 50,
  enablePersistence: true,
});

export const searchCache = new CacheService({
  ttl: 10 * 60 * 1000, // 10 minutes
  maxSize: 100,
  enablePersistence: true,
});

export const apiCache = new CacheService({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 200,
  enablePersistence: false,
});

// Hook for using cache in React components
export const useCache = <T>(cache: CacheService) => {
  const get = (key: string): T | null => cache.get<T>(key);
  const set = (key: string, data: T, ttl?: number): void => cache.set(key, data, ttl);
  const has = (key: string): boolean => cache.has(key);
  const remove = (key: string): boolean => cache.delete(key);
  const clear = (): void => cache.clear();
  const stats = () => cache.getStats();

  return {
    get,
    set,
    has,
    remove,
    clear,
    stats,
  };
};

// Utility functions for common cache operations
export const cacheUtils = {
  // Generate cache key for API requests
  generateApiKey: (endpoint: string, params: Record<string, any> = {}): string => {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    return `api:${endpoint}:${sortedParams}`;
  },

  // Generate cache key for search queries
  generateSearchKey: (query: string, filters: Record<string, any> = {}): string => {
    const filterString = Object.keys(filters)
      .sort()
      .map(key => `${key}=${filters[key]}`)
      .join('&');
    
    return `search:${query}:${filterString}`;
  },

  // Generate cache key for images
  generateImageKey: (imageId: string, size?: string): string => {
    return `image:${imageId}:${size || 'original'}`;
  },

  // Preload data into cache
  preloadData: async <T>(
    cache: CacheService,
    key: string,
    dataLoader: () => Promise<T>,
    ttl?: number
  ): Promise<T> => {
    // Check if data is already cached
    const cached = cache.get<T>(key);
    if (cached) {
      return cached;
    }

    // Load and cache data
    const data = await dataLoader();
    cache.set(key, data, ttl);
    return data;
  },
};
