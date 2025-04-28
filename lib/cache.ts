type CacheEntry<T> = {
  value: T
  expiry: number
}

/**
 * Simple in-memory cache implementation
 */
class MemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map()

  /**
   * Get a value from the cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    // Return null if entry doesn't exist or has expired
    if (!entry || entry.expiry < Date.now()) {
      if (entry) {
        this.cache.delete(key) // Clean up expired entry
      }
      return null
    }

    return entry.value
  }

  /**
   * Set a value in the cache with an optional TTL (time to live) in milliseconds
   */
  set<T>(key: string, value: T, ttl: number = 60 * 1000): void {
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl,
    })
  }

  /**
   * Delete a value from the cache
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get a value from the cache, or compute and cache it if not present
   */
  async getOrSet<T>(key: string, fn: () => Promise<T>, ttl: number = 60 * 1000): Promise<T> {
    const cached = this.get<T>(key)

    if (cached !== null) {
      return cached
    }

    const value = await fn()
    this.set(key, value, ttl)
    return value
  }
}

// Export a singleton instance
export const memoryCache = new MemoryCache()
