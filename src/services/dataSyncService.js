// src/services/dataSyncService.js

import { collection, query, onSnapshot, doc, getDoc, orderBy, where, limit, startAfter, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

// Performance monitoring
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      fetchTimes: [],
      cacheHits: 0,
      cacheMisses: 0,
      memoryUsage: 0,
      lastCleanup: Date.now(),
    };
    this.startTime = Date.now();
  }

  recordFetchTime(duration) {
    this.metrics.fetchTimes.push(duration);
    // Keep only last 100 measurements
    if (this.metrics.fetchTimes.length > 100) {
      this.metrics.fetchTimes.shift();
    }
  }

  recordCacheHit() {
    this.metrics.cacheHits++;
  }

  recordCacheMiss() {
    this.metrics.cacheMisses++;
  }

  getAverageFetchTime() {
    if (this.metrics.fetchTimes.length === 0) return 0;
    return this.metrics.fetchTimes.reduce((a, b) => a + b, 0) / this.metrics.fetchTimes.length;
  }

  getCacheHitRate() {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses;
    return total > 0 ? this.metrics.cacheHits / total : 0;
  }

  logPerformance() {
    console.log('[PerformanceMonitor]', {
      averageFetchTime: this.getAverageFetchTime().toFixed(2) + 'ms',
      cacheHitRate: (this.getCacheHitRate() * 100).toFixed(1) + '%',
      uptime: Date.now() - this.startTime,
      memoryUsage: this.metrics.memoryUsage,
    });
  }
}

// Optimized cache with LRU eviction
class OptimizedCache {
  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
    this.cache = new Map();
    this.accessOrder = [];
  }

  get(key) {
    if (this.cache.has(key)) {
      // Move to end of access order (most recently used)
      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
      this.accessOrder.push(key);
      return this.cache.get(key);
    }
    return null;
  }

  set(key, value, ttl = 5 * 60 * 1000) { // 5 minutes default TTL
    // Remove oldest items if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.accessOrder.shift();
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl,
    });

    // Add to access order
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }

  has(key) {
    const item = this.cache.get(key);
    if (!item) return false;

    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.delete(key);
      return false;
    }

    return true;
  }

  delete(key) {
    this.cache.delete(key);
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  clear() {
    this.cache.clear();
    this.accessOrder = [];
  }

  size() {
    return this.cache.size;
  }

  // Clean expired items
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.delete(key);
      }
    }
  }
}

// Batch operations for better performance
class BatchProcessor {
  constructor() {
    this.batch = [];
    this.batchSize = 10;
    this.batchTimeout = 100; // ms
    this.timer = null;
  }

  add(operation) {
    this.batch.push(operation);
    
    if (this.batch.length >= this.batchSize) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.batchTimeout);
    }
  }

  flush() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.batch.length > 0) {
      const operations = [...this.batch];
      this.batch = [];
      
      // Process batch operations
      this.processBatch(operations);
    }
  }

  async processBatch(operations) {
    // Group operations by type for efficiency
    const grouped = operations.reduce((acc, op) => {
      if (!acc[op.type]) acc[op.type] = [];
      acc[op.type].push(op);
      return acc;
    }, {});

    // Process each group
    for (const [type, ops] of Object.entries(grouped)) {
      await this.processOperationGroup(type, ops);
    }
  }

  async processOperationGroup(type, operations) {
    // Implement specific batch processing logic here
    console.log(`[BatchProcessor] Processing ${operations.length} ${type} operations`);
  }
}

// Optimized data fetcher with pagination and caching
class OptimizedDataFetcher {
  constructor() {
    this.cache = new OptimizedCache(500);
    this.performanceMonitor = new PerformanceMonitor();
    this.batchProcessor = new BatchProcessor();
    this.activeListeners = new Map();
    this.debounceTimers = new Map();
  }

  // Debounced function to prevent excessive API calls
  debounce(key, fn, delay = 300) {
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key));
    }
    
    const timer = setTimeout(() => {
      fn();
      this.debounceTimers.delete(key);
    }, delay);
    
    this.debounceTimers.set(key, timer);
  }

  // Optimized user profile fetching with caching
  async fetchUserProfile(userId, forceRefresh = false) {
    const cacheKey = `user_${userId}`;
    
    if (!forceRefresh && this.cache.has(cacheKey)) {
      this.performanceMonitor.recordCacheHit();
      return this.cache.get(cacheKey).value;
    }

    this.performanceMonitor.recordCacheMiss();
    const startTime = Date.now();

    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.exists() ? userDoc.data() : null;
      
      // Cache with longer TTL for user profiles (30 minutes)
      this.cache.set(cacheKey, userData, 30 * 60 * 1000);
      
      const fetchTime = Date.now() - startTime;
      this.performanceMonitor.recordFetchTime(fetchTime);
      
      return userData;
    } catch (error) {
      console.error('[OptimizedDataFetcher] Error fetching user profile:', error);
      throw error;
    }
  }

  // Optimized posts fetching with pagination
  async fetchPosts(page = 1, pageSize = 20, filters = {}) {
    const cacheKey = `posts_${page}_${JSON.stringify(filters)}`;
    
    if (this.cache.has(cacheKey)) {
      this.performanceMonitor.recordCacheHit();
      return this.cache.get(cacheKey).value;
    }

    this.performanceMonitor.recordCacheMiss();
    const startTime = Date.now();

    try {
      let postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(pageSize));
      
      // Apply filters
      if (filters.userId) {
        postsQuery = query(postsQuery, where('userId', '==', filters.userId));
      }
      
      if (filters.school) {
        postsQuery = query(postsQuery, where('school', '==', filters.school));
      }

      const querySnapshot = await getDocs(postsQuery);
      const posts = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        posts.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toMillis ? data.timestamp.toMillis() : data.timestamp,
        });
      });

      // Cache with shorter TTL for posts (2 minutes)
      this.cache.set(cacheKey, posts, 2 * 60 * 1000);
      
      const fetchTime = Date.now() - startTime;
      this.performanceMonitor.recordFetchTime(fetchTime);
      
      return posts;
    } catch (error) {
      console.error('[OptimizedDataFetcher] Error fetching posts:', error);
      throw error;
    }
  }

  // Optimized real-time listener with connection management
  createOptimizedListener(collectionPath, options = {}) {
    const {
      orderByField = 'createdAt',
      orderDirection = 'desc',
      limitCount = 50,
      filters = {},
      onData,
      onError,
    } = options;

    const listenerKey = `${collectionPath}_${JSON.stringify(options)}`;
    
    // Clean up existing listener
    if (this.activeListeners.has(listenerKey)) {
      this.activeListeners.get(listenerKey)();
      this.activeListeners.delete(listenerKey);
    }

    try {
      let q = query(collection(db, collectionPath), orderBy(orderByField, orderDirection), limit(limitCount));
      
      // Apply filters
      Object.entries(filters).forEach(([field, value]) => {
        q = query(q, where(field, '==', value));
      });

      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const data = [];
          querySnapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() });
          });
          
          // Batch process the data updates
          this.batchProcessor.add({
            type: 'data_update',
            collection: collectionPath,
            data,
            timestamp: Date.now(),
          });
          
          if (onData) onData(data);
        },
        (error) => {
          console.error(`[OptimizedDataFetcher] Listener error for ${collectionPath}:`, error);
          if (onError) onError(error);
        }
      );

      this.activeListeners.set(listenerKey, unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error(`[OptimizedDataFetcher] Error creating listener for ${collectionPath}:`, error);
      throw error;
    }
  }

  // Memory management and cleanup
  cleanup() {
    // Clean up expired cache entries
    this.cache.cleanup();
    
    // Clear debounce timers
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
    
    // Flush any pending batch operations
    this.batchProcessor.flush();
    
    // Log performance metrics
    this.performanceMonitor.logPerformance();
    
    // Update memory usage metric
    this.performanceMonitor.metrics.memoryUsage = this.cache.size();
    this.performanceMonitor.metrics.lastCleanup = Date.now();
  }

  // Cleanup all listeners
  cleanupListeners() {
    this.activeListeners.forEach(unsubscribe => unsubscribe());
    this.activeListeners.clear();
  }

  // Get performance metrics
  getPerformanceMetrics() {
    return {
      ...this.performanceMonitor.metrics,
      averageFetchTime: this.performanceMonitor.getAverageFetchTime(),
      cacheHitRate: this.performanceMonitor.getCacheHitRate(),
      cacheSize: this.cache.size(),
      activeListeners: this.activeListeners.size,
    };
  }
}

// Singleton instance
const dataFetcher = new OptimizedDataFetcher();

// Auto-cleanup every 5 minutes
setInterval(() => {
  dataFetcher.cleanup();
}, 5 * 60 * 1000);

// Cleanup on app background/foreground (if available)
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // App going to background - cleanup
      dataFetcher.cleanup();
    }
  });
}

export default dataFetcher;
export { PerformanceMonitor, OptimizedCache, BatchProcessor };