import { CacheService, imageCache, searchCache, apiCache } from '../cacheService';

describe('CacheService', () => {
  let cache: CacheService;

  beforeEach(() => {
    cache = new CacheService({
      ttl: 1000, // 1 second for testing
      maxSize: 3,
      enablePersistence: false,
    });
    (window.localStorage.getItem as jest.Mock).mockClear();
    (window.localStorage.setItem as jest.Mock).mockClear();
  });

  afterEach(() => {
    cache.clear();
  });

  describe('Basic Operations', () => {
    it('sets and gets cache items', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('returns null for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeNull();
    });

    it('checks if key exists', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('deletes cache items', () => {
      cache.set('key1', 'value1');
      expect(cache.delete('key1')).toBe(true);
      expect(cache.get('key1')).toBeNull();
      expect(cache.delete('nonexistent')).toBe(false);
    });

    it('clears all cache items', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
    });
  });

  describe('TTL (Time To Live)', () => {
    it('expires items after TTL', async () => {
      cache.set('key1', 'value1', 100); // 100ms TTL
      
      expect(cache.get('key1')).toBe('value1');
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(cache.get('key1')).toBeNull();
    });

    it('does not expire items before TTL', async () => {
      cache.set('key1', 'value1', 1000); // 1 second TTL
      
      // Wait less than TTL
      await new Promise(resolve => setTimeout(resolve, 500));
      
      expect(cache.get('key1')).toBe('value1');
    });
  });

  describe('Max Size', () => {
    it('removes oldest items when max size is reached', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      cache.set('key4', 'value4'); // Should remove key1
      
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key3')).toBe('value3');
      expect(cache.get('key4')).toBe('value4');
    });
  });

  describe('Persistence', () => {
    it('saves to localStorage when persistence is enabled', () => {
      const persistentCache = new CacheService({
        enablePersistence: true,
      });
      
      persistentCache.set('key1', 'value1');
      
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'ai-image-gallery-cache',
        expect.any(String)
      );
    });

    it('loads from localStorage on initialization', () => {
      const mockData = [['key1', { data: 'value1', timestamp: Date.now(), expiry: Date.now() + 1000 }]];
      (window.localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(mockData));
      
      const persistentCache = new CacheService({
        enablePersistence: true,
      });
      
      expect(persistentCache.get('key1')).toBe('value1');
    });
  });

  describe('Statistics', () => {
    it('provides cache statistics', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      const stats = cache.getStats();
      
      expect(stats.totalItems).toBe(2);
      expect(stats.validItems).toBe(2);
      expect(stats.expiredItems).toBe(0);
      expect(stats.maxSize).toBe(3);
      expect(stats.utilization).toBeCloseTo(66.67, 1);
    });
  });

  describe('Cleanup', () => {
    it('cleans up expired items', async () => {
      cache.set('key1', 'value1', 100);
      cache.set('key2', 'value2', 1000);
      
      // Wait for key1 to expire
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const cleanedCount = cache.cleanup();
      
      expect(cleanedCount).toBe(1);
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBe('value2');
    });
  });
});

describe('Cache Instances', () => {
  beforeEach(() => {
    imageCache.clear();
    searchCache.clear();
    apiCache.clear();
  });

  it('creates image cache with correct configuration', () => {
    imageCache.set('test-image', 'image-data');
    expect(imageCache.get('test-image')).toBe('image-data');
    
    const stats = imageCache.getStats();
    expect(stats.maxSize).toBe(50);
  });

  it('creates search cache with correct configuration', () => {
    searchCache.set('test-search', 'search-results');
    expect(searchCache.get('test-search')).toBe('search-results');
    
    const stats = searchCache.getStats();
    expect(stats.maxSize).toBe(100);
  });

  it('creates API cache with correct configuration', () => {
    apiCache.set('test-api', 'api-response');
    expect(apiCache.get('test-api')).toBe('api-response');
    
    const stats = apiCache.getStats();
    expect(stats.maxSize).toBe(200);
  });
});
