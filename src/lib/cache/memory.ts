interface CacheEntry<T> {
  data: T;
  expiry: number;
}

/**
 * Simple in-memory cache with TTL support
 * For production, replace with Redis or similar
 */
class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  
  /**
   * Set cache entry with TTL in milliseconds
   */
  set<T>(key: string, data: T, ttlMs: number): void {
    const expiry = Date.now() + ttlMs;
    this.cache.set(key, { data, expiry });
  }
  
  /**
   * Get cache entry if not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    
    if (!entry) {
      return null;
    }
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  /**
   * Delete cache entry
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }
  
  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Get cache statistics
   */
  stats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
  
  /**
   * Cleanup expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
        removed++;
      }
    }
    
    return removed;
  }
}

// Singleton instance
export const memoryCache = new MemoryCache();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  memoryCache.cleanup();
}, 5 * 60 * 1000);

// Cache TTL constants
export const CACHE_TTL = {
  FILTERS: 10 * 60 * 1000, // 10 minutes for filter values
  PRODUCTS: 2 * 60 * 1000,  // 2 minutes for product lists
} as const;
