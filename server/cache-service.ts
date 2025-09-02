import { eq, and, sql, lt, gte } from "drizzle-orm";
import { db } from "./db";
import { 
  cachedPlaces, 
  cachedReviews, 
  cachedPhotos, 
  apiUsageTracking,
  InsertCachedPlace,
  InsertCachedReview,
  InsertCachedPhoto,
  InsertApiUsageTracking,
  CachedPlace,
  CachedReview,
  CachedPhoto
} from "@shared/schema";

// Cache TTL configurations based on data type (in hours)
// export const CACHE_TTL = {
//   hotels: 0, // No caching for hotels (LiteAPI real-time pricing)
//   restaurants: 720, // 30 days (development phase - minimize API calls)
//   attractions: 720, // 30 days (development phase - minimize API calls)
//   reviews: 720, // 30 days (development phase - minimize API calls)
//   photos: 720, // 30 days (development phase - minimize API calls)
// } as const;

// API cost estimates (in USD per 1000 requests) - Updated for Places API (New)
export const API_COSTS = {
  google_places_search_nearby: 2.83, // Places API Nearby Search Pro (bis 100k requests)
  google_places_text_search: 2.83, // Places API Text Search Pro (bis 100k requests) 
  google_places_details: 1.70, // Places API Place Details Pro (bis 100k requests)
  google_places_photos: 0.70, // Photos von Place Details (falls separat abgerufen)
  tripadvisor_api: 50,
  unsplash_api: 0, // Free tier
} as const;

export class CacheService {
  private static instance: CacheService;
  private memoryCache = new Map<string, { data: any; expiresAt: number }>();

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  private constructor() {
    // Clean up expired memory cache every 5 minutes
    setInterval(() => this.cleanupMemoryCache(), 5 * 60 * 1000);
  }

  /**
   * Generate cache key for place data
   */
  private generatePlaceKey(location: { lat: number; lng: number }, category: string, radius: number): string {
    // Round coordinates to reduce cache fragmentation
    const lat = Math.round(location.lat * 1000) / 1000;
    const lng = Math.round(location.lng * 1000) / 1000;
    return `place:${lat},${lng}:${category}:${radius}`;
  }

  /**
   * Generate cache key for destination searches
   */
  private generateDestinationKey(query: string): string {
    return `destination:${query.toLowerCase().trim()}`;
  }

  /**
   * Get cached destination from search query
   */
  async getCachedDestination(query: string): Promise<any | null> {
    const cacheKey = this.generateDestinationKey(query);
    
    // Try memory cache first
    const memoryResult = this.memoryCache.get(cacheKey);
    if (memoryResult && Date.now() < memoryResult.expiresAt) {
      console.log(`[Cache] Memory hit for destination: ${query}`);
      return memoryResult.data;
    }

    // Try database cache for destinations (using cached_places with special category)
    try {
      const cachedResults = await db
        .select()
        .from(cachedPlaces)
        .where(
          and(
            eq(cachedPlaces.category, 'destination'),
            eq(cachedPlaces.name, query.toLowerCase().trim()),
            gte(cachedPlaces.expiresAt, new Date())
          )
        )
        .limit(1);

      if (cachedResults.length > 0) {
        const destination = cachedResults[0].data;
        console.log(`[Cache] Database hit for destination: ${query}`);
        
        // Store in memory cache
        this.memoryCache.set(cacheKey, {
          data: destination,
          expiresAt: Date.now() + (1 * 60 * 60 * 1000) // 1 hour in memory
        });
        
        return destination;
      }
    } catch (error) {
      console.error("[Cache] Database error for destination:", error);
    }

    return null;
  }

  /**
   * Get cached place by placeId (language-independent)
   */
  async getCachedPlaceByPlaceId(placeId: string): Promise<any | null> {
    if (!placeId) return null;
    
    try {
      const cachedResults = await db
        .select()
        .from(cachedPlaces)
        .where(
          and(
            eq(cachedPlaces.placeId, placeId),
            gte(cachedPlaces.expiresAt, new Date())
          )
        )
        .limit(1);

      if (cachedResults.length > 0) {
        const place = cachedResults[0].data;
        console.log(`[Cache] Found cached place by PlaceID: ${placeId}`);
        return place;
      }
    } catch (error) {
      console.error("[Cache] Database error for place by PlaceID:", error);
    }

    return null;
  }

  /**
   * Save destination to cache
   */
  async saveDestinationToCache(query: string, destination: any): Promise<void> {
    const cacheKey = this.generateDestinationKey(query);
    const ttlHours = 720; // 30 days for destinations
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

    try {
      const insertData: InsertCachedPlace = {
        placeId: destination.placeId || `destination_${query.toLowerCase().replace(/\s+/g, '_')}`,
        name: query.toLowerCase().trim(),
        locationLat: destination.location?.lat?.toString() || '0',
        locationLng: destination.location?.lng?.toString() || '0',
        category: 'destination',
        data: destination,
        expiresAt,
      };

      await db.insert(cachedPlaces).values(insertData).onConflictDoUpdate({
        target: cachedPlaces.placeId,
        set: {
          data: insertData.data,
          lastUpdated: sql`NOW()`,
          expiresAt: insertData.expiresAt,
          searchCount: sql`${cachedPlaces.searchCount} + 1`,
        },
      });

      // Also save to memory cache
      this.memoryCache.set(cacheKey, {
        data: destination,
        expiresAt: Date.now() + (1 * 60 * 60 * 1000) // 1 hour in memory
      });

      console.log(`[Cache] Saved destination to cache: ${query}`);
    } catch (error) {
      console.error("[Cache] Error saving destination to cache:", error);
    }
  }

  /**
   * Get cached places from memory first, then database
   */
  async getCachedPlaces(
    location: { lat: number; lng: number }, 
    category: string, 
    radius: number = 5000
  ): Promise<any[]> {
    const cacheKey = this.generatePlaceKey(location, category, radius);
    
    // Try memory cache first
    const memoryResult = this.memoryCache.get(cacheKey);
    if (memoryResult && Date.now() < memoryResult.expiresAt) {
      console.log(`[Cache] Memory hit for ${category} near ${location.lat},${location.lng}`);
      return memoryResult.data;
    }

    // Try database cache
    try {
      const radiusInDegrees = radius / 111000; // Approximate conversion to degrees
      const now = new Date();

      const cachedResults = await db
        .select()
        .from(cachedPlaces)
        .where(
          and(
            eq(cachedPlaces.category, category),
            gte(cachedPlaces.expiresAt, now),
            // Simple bounding box check (more efficient than actual distance calculation)
            gte(cachedPlaces.locationLat, (location.lat - radiusInDegrees).toString()),
            lt(cachedPlaces.locationLat, (location.lat + radiusInDegrees).toString()),
            gte(cachedPlaces.locationLng, (location.lng - radiusInDegrees).toString()),
            lt(cachedPlaces.locationLng, (location.lng + radiusInDegrees).toString())
          )
        );

      if (cachedResults.length > 0) {
        console.log(`[Cache] Database hit for ${category} near ${location.lat},${location.lng}: ${cachedResults.length} results`);
        
        // Store in memory cache for faster future access
        const data = cachedResults.map(place => place.data);
        this.memoryCache.set(cacheKey, {
          data,
          expiresAt: Date.now() + (1 * 60 * 60 * 1000) // 1 hour in memory
        });
        
        // Update search count for popularity tracking
        await Promise.all(
          cachedResults.map(place =>
            db.update(cachedPlaces)
              .set({ searchCount: sql`${cachedPlaces.searchCount} + 1` })
              .where(eq(cachedPlaces.id, place.id))
          )
        );

        return data;
      }
    } catch (error) {
      console.error("[Cache] Database error:", error);
    }

    return [];
  }

  /**
   * Save places to cache with appropriate TTL
   */
  async savePlacesToCache(
    location: { lat: number; lng: number },
    category: string,
    places: any[],
    radius: number = 5000
  ): Promise<void> {
    if (category === 'hotels') {
      // Don't cache hotels (real-time pricing via LiteAPI)
      return;
    }

    const ttlHours = CACHE_TTL[category as keyof typeof CACHE_TTL] || 24;
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
    const cacheKey = this.generatePlaceKey(location, category, radius);

    try {
      // Save to database
      const insertPromises = places.map(async (place) => {
        const insertData: InsertCachedPlace = {
          placeId: place.placeId || place.id || `${category}_${Math.random()}`,
          name: place.name,
          locationLat: place.location?.lat?.toString() || location.lat.toString(),
          locationLng: place.location?.lng?.toString() || location.lng.toString(),
          category,
          data: place,
          expiresAt,
        };

        try {
          await db.insert(cachedPlaces).values(insertData).onConflictDoUpdate({
            target: cachedPlaces.placeId,
            set: {
              data: insertData.data,
              lastUpdated: sql`NOW()`,
              expiresAt: insertData.expiresAt,
              searchCount: sql`${cachedPlaces.searchCount} + 1`,
            },
          });
        } catch (insertError) {
          console.warn(`[Cache] Failed to insert place ${place.name}:`, insertError);
        }
      });

      await Promise.all(insertPromises);

      // Also save to memory cache
      this.memoryCache.set(cacheKey, {
        data: places,
        expiresAt: Date.now() + (1 * 60 * 60 * 1000) // 1 hour in memory
      });

      console.log(`[Cache] Saved ${places.length} ${category} places to cache`);
    } catch (error) {
      console.error("[Cache] Error saving places to cache:", error);
    }
  }

  /**
   * Track API usage for cost monitoring
   */
  async trackApiUsage(
    provider: string,
    endpoint: string,
    requestCount: number = 1,
    metadata?: any
  ): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const costPerRequest = API_COSTS[`${provider}_${endpoint}` as keyof typeof API_COSTS] || 0;
      const costEstimate = (costPerRequest / 1000) * requestCount;

      const insertData: InsertApiUsageTracking = {
        provider,
        endpoint,
        requestCount,
        costEstimate: costEstimate.toString(),
        cacheHitRate: "0.0", // Will be calculated separately
        date: today,
        metadata,
      };

      await db.insert(apiUsageTracking).values(insertData).onConflictDoUpdate({
        target: [apiUsageTracking.provider, apiUsageTracking.endpoint, apiUsageTracking.date],
        set: {
          requestCount: sql`${apiUsageTracking.requestCount} + ${requestCount}`,
          costEstimate: sql`${apiUsageTracking.costEstimate} + ${costEstimate}`,
        },
      });

      console.log(`[API Tracking] ${provider}.${endpoint}: ${requestCount} requests, ~$${costEstimate.toFixed(4)}`);
    } catch (error) {
      console.error("[API Tracking] Error:", error);
    }
  }

  /**
   * Get cache statistics for monitoring
   */
  async getCacheStats(days: number = 7): Promise<{
    totalCachedPlaces: number;
    cacheHitRate: number;
    costSavings: number;
    apiUsage: any[];
  }> {
    try {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const [totalPlaces, apiUsage] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(cachedPlaces),
        db.select().from(apiUsageTracking).where(gte(apiUsageTracking.createdAt, since))
      ]);

      const totalCachedPlaces = totalPlaces[0]?.count || 0;
      const totalRequests = apiUsage.reduce((sum, usage) => sum + (usage.requestCount || 0), 0);
      const totalCost = apiUsage.reduce((sum, usage) => sum + parseFloat(usage.costEstimate || '0'), 0);

      // Estimate cache hit rate based on search counts vs API calls
      const avgSearchCount = totalCachedPlaces > 0 ? totalRequests / totalCachedPlaces : 0;
      const estimatedCacheHitRate = avgSearchCount > 1 ? (avgSearchCount - 1) / avgSearchCount : 0;

      return {
        totalCachedPlaces,
        cacheHitRate: Math.round(estimatedCacheHitRate * 100) / 100,
        costSavings: totalCost,
        apiUsage,
      };
    } catch (error) {
      console.error("[Cache Stats] Error:", error);
      return {
        totalCachedPlaces: 0,
        cacheHitRate: 0,
        costSavings: 0,
        apiUsage: [],
      };
    }
  }

  /**
   * Clear all cache data (for development/testing)
   */
  async clearAllCache(): Promise<void> {
    try {
      // Clear memory cache
      this.memoryCache.clear();
      
      // Clear database cache
      await Promise.all([
        db.delete(cachedPlaces),
        db.delete(cachedReviews), 
        db.delete(cachedPhotos)
      ]);
      
      console.log("[Cache] All cache data cleared");
    } catch (error) {
      console.error("[Cache] Error clearing all cache:", error);
      throw error;
    }
  }

  /**
   * Clean up expired cache entries
   */
  async cleanupExpiredCache(): Promise<void> {
    try {
      const now = new Date();
      
      const [deletedPlaces, deletedReviews, deletedPhotos] = await Promise.all([
        db.delete(cachedPlaces).where(lt(cachedPlaces.expiresAt, now)),
        db.delete(cachedReviews).where(lt(cachedReviews.expiresAt, now)),
        db.delete(cachedPhotos).where(lt(cachedPhotos.expiresAt, now)),
      ]);

      console.log(`[Cache Cleanup] Removed expired entries: ${deletedPlaces.rowCount || 0} places, ${deletedReviews.rowCount || 0} reviews, ${deletedPhotos.rowCount || 0} photos`);
    } catch (error) {
      console.error("[Cache Cleanup] Error:", error);
    }
  }

  /**
   * Clean up expired memory cache entries
   */
  private cleanupMemoryCache(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, value] of this.memoryCache.entries()) {
      if (now >= value.expiresAt) {
        this.memoryCache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`[Memory Cache] Cleaned ${cleaned} expired entries`);
    }
  }


}

// Export singleton instance
export const cacheService = CacheService.getInstance();

// Export helper functions for direct cache access
export async function getCachedDestination(query: string): Promise<any | null> {
  return await cacheService.getCachedDestination(query);
}

export async function getCachedPlaceByPlaceId(placeId: string): Promise<any | null> {
  return await cacheService.getCachedPlaceByPlaceId(placeId);
}

// Start automatic cleanup every 6 hours
setInterval(() => {
  cacheService.cleanupExpiredCache();
}, 6 * 60 * 60 * 1000);