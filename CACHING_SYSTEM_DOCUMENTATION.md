# Intelligent Caching System für Travel API

## Überblick

Das Caching-System optimiert die Kosten der externen API-Aufrufe durch intelligente Zwischenspeicherung von Daten. Hotels werden über LiteAPI in Echtzeit abgerufen (keine Zwischenspeicherung), während andere POI-Daten (Attraktionen, Restaurants) effizient gecacht werden.

## Architektur-Strategie

### Multi-Level Cache System
```
Level 1: Redis/Memory Cache (1-6 Stunden TTL)
Level 2: PostgreSQL Database (Permanente Speicherung)
Level 3: External APIs (Google Places, TripAdvisor)
```

### Datentyp-spezifische Strategien

| Datentyp | Cache-Strategie | TTL | Begründung |
|----------|----------------|-----|------------|
| Hotels (LiteAPI) | Keine Zwischenspeicherung | - | Echtzeitpreise erforderlich |
| Restaurants | Intelligent gecacht | 3 Stunden | Öffnungszeiten ändern sich |
| Attraktionen | Lang gecacht | 24 Stunden | Statische Informationen |
| Reviews | Mittel gecacht | 6 Stunden | Neue Reviews kommen regelmäßig |
| Fotos | Lang gecacht | 7 Tage | Selten ändernde URLs |

## Technische Implementierung

### 1. Cache Service Architektur

```typescript
// server/cache-service.ts
export class CacheService {
  // Multi-level Cache mit Redis + PostgreSQL
  async get(key: string, type: 'places' | 'reviews' | 'photos'): Promise<any>
  async set(key: string, data: any, ttl: number): Promise<void>
  async invalidate(pattern: string): Promise<void>
  
  // Intelligente Cache-Strategien
  async getWithFallback(key: string, fetchFn: () => Promise<any>): Promise<any>
}
```

### 2. Database Schema für Cache

```sql
-- Cache-optimierte Tabellen
CREATE TABLE cached_places (
  id SERIAL PRIMARY KEY,
  place_id VARCHAR UNIQUE,           -- Google Places ID
  name VARCHAR NOT NULL,
  location_lat DECIMAL,
  location_lng DECIMAL,
  category VARCHAR,                  -- restaurant, attraction, etc.
  data JSONB,                       -- Vollständige API Response
  last_updated TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE cached_reviews (
  id SERIAL PRIMARY KEY,
  place_id VARCHAR,
  source VARCHAR,                   -- tripadvisor, google
  reviews JSONB,
  rating DECIMAL,
  review_count INTEGER,
  last_updated TIMESTAMP,
  expires_at TIMESTAMP
);

CREATE TABLE cached_photos (
  id SERIAL PRIMARY KEY,
  place_id VARCHAR,
  source VARCHAR,                   -- unsplash, google
  photos JSONB,
  last_updated TIMESTAMP,
  expires_at TIMESTAMP
);

-- Indexe für Performance
CREATE INDEX idx_cached_places_location ON cached_places USING GIST(
  ll_to_earth(location_lat, location_lng)
);
CREATE INDEX idx_cached_places_category ON cached_places(category);
CREATE INDEX idx_cached_places_expires ON cached_places(expires_at);
```

### 3. Intelligent Cache Keys

```typescript
// Cache-Schlüssel Struktur
const cacheKeys = {
  places: (lat: number, lng: number, radius: number, type: string) => 
    `places:${lat.toFixed(4)}:${lng.toFixed(4)}:${radius}:${type}`,
    
  reviews: (placeId: string, source: string) => 
    `reviews:${source}:${placeId}`,
    
  photos: (query: string, location: string) => 
    `photos:${location}:${encodeURIComponent(query)}`,
    
  hotelPrices: (location: string, checkin: string, checkout: string) =>
    `hotels:${location}:${checkin}:${checkout}` // Nur für Debugging, nicht gecacht
};
```

## Datentrennungskonzept

### Cache-Datenstrukturen

```typescript
// Globaler Cache (nur öffentliche Daten)
interface GlobalCacheData {
  placeId: string;
  businessInfo: PublicBusinessInfo;  // Öffentliche Geschäftsdaten
  location: Coordinates;
  category: string;
  averageRating: number;
  // KEINE persönlichen Daten
}

// User-spezifische Daten (getrennt gespeichert)
interface UserSpecificData {
  userId: string;
  favorites: string[];              // Place IDs
  searchHistory: SearchQuery[];     // Mit manueller Verwaltung
  preferences: UserPreferences;
}
```

### Einfache Cache-Verwaltung

```typescript
export class CacheManager {
  // Manuelle Cache-Bereinigung
  async clearExpiredCache(): Promise<void>
  
  // User-Daten Löschung (bei Bedarf)
  async deleteUserData(userId: string): Promise<void>
  
  // Cache-Statistiken
  async getCacheStats(): Promise<CacheStats>
}
```

## API Integration Patterns

### 1. Google Places API mit Cache

```typescript
// server/google-places-cached.ts
export class GooglePlacesCachedService {
  async searchNearby(params: {
    lat: number;
    lng: number;
    radius: number;
    type: string;
  }): Promise<Place[]> {
    const cacheKey = cacheKeys.places(params.lat, params.lng, params.radius, params.type);
    
    // 1. Versuche Cache
    const cached = await this.cache.get(cacheKey);
    if (cached && !this.isExpired(cached)) {
      return cached.data;
    }
    
    // 2. Fetch von API
    const apiData = await this.googlePlacesAPI.searchNearby(params);
    
    // 3. Cache mit intelligenter TTL
    const ttl = this.calculateTTL(params.type);
    await this.cache.set(cacheKey, apiData, ttl);
    
    return apiData;
  }
  
  private calculateTTL(type: string): number {
    switch (type) {
      case 'restaurant': return 3 * 60 * 60; // 3 Stunden
      case 'tourist_attraction': return 24 * 60 * 60; // 24 Stunden
      case 'lodging': return 1 * 60 * 60; // 1 Stunde (falls nicht LiteAPI)
      default: return 6 * 60 * 60; // 6 Stunden Standard
    }
  }
}
```

### 2. LiteAPI Hotels (Kein Cache)

```typescript
// server/liteapi-realtime.ts
export class LiteAPIRealtimeService {
  // NIEMALS gecacht - immer Echtzeit
  async searchHotels(params: HotelSearchParams): Promise<Hotel[]> {
    // Direkt an LiteAPI - kein Cache
    return await this.liteAPI.search(params);
  }
  
  async getHotelPrices(hotelId: string, dates: DateRange): Promise<PriceInfo> {
    // Echtzeitpreise - kein Cache
    return await this.liteAPI.getPricing(hotelId, dates);
  }
}
```

## Performance Optimierungen

### 1. Geografische Cache-Optimierung

```typescript
// Intelligente geografische Gruppierung
export class GeoCache {
  // Cache-Treffer durch geografische Nähe
  async findNearbyCache(lat: number, lng: number, radius: number): Promise<CachedData[]> {
    const query = `
      SELECT * FROM cached_places 
      WHERE earth_distance(
        ll_to_earth(location_lat, location_lng),
        ll_to_earth($1, $2)
      ) <= $3
      AND expires_at > NOW()
    `;
    
    return await this.db.query(query, [lat, lng, radius]);
  }
}
```

### 2. Batch-Loading Strategie

```typescript
// Mehrere API-Aufrufe in einem Request
export class BatchAPIService {
  async loadLocationData(location: Coordinates): Promise<LocationData> {
    const [places, reviews, photos] = await Promise.all([
      this.placesService.searchNearby(location),
      this.reviewsService.getAreaReviews(location),
      this.photoService.getLocationPhotos(location)
    ]);
    
    return this.combineLocationData(places, reviews, photos);
  }
}
```

## Monitoring & Analytics

### 1. Cache-Performance Metriken

```typescript
// server/cache-metrics.ts
export class CacheMetrics {
  // Cache Hit/Miss Tracking
  async trackCacheHit(key: string, type: string): Promise<void>
  async trackCacheMiss(key: string, type: string): Promise<void>
  
  // Kostenoptimierung Analytics
  async calculateAPISavings(): Promise<CostSavings>
  async generateCacheReport(): Promise<CacheReport>
}

interface CacheReport {
  hitRate: number;              // Cache-Trefferquote
  apiCallsSaved: number;        // Gesparte API-Aufrufe
  costSavings: number;          // Gesparte Kosten in EUR
  topCachedItems: CachedItem[]; // Meistgenutzte Cache-Einträge
}
```

### 2. Einfache Cache-Verwaltung

```typescript
export class CacheInvalidation {
  // Manuelle Cache-Bereinigung
  async clearExpiredCache(): Promise<void>
  
  // Spezifische Cache-Invalidierung
  async invalidatePlace(placeId: string): Promise<void>
  
  // Geografische Cache-Bereinigung
  async clearAreaCache(bounds: GeographicBounds): Promise<void>
}
```

## Implementierungsreihenfolge

### Phase 1: Grundlegender Cache (1-2 Tage)
1. ✅ Cache-Service Grundstruktur
2. ✅ PostgreSQL Cache-Tabellen
3. ✅ Einfache TTL-basierte Invalidierung

### Phase 2: Intelligente Features (2-3 Tage)
4. 🔄 Geografische Cache-Optimierung
5. 🔄 Multi-level Cache (Redis + PostgreSQL)
6. 🔄 Batch-Loading für bessere Performance

### Phase 3: Production-Ready (1-2 Tage)
7. 🔄 Performance-Monitoring und Metriken
8. 🔄 Manuelle Cache-Verwaltung
9. 🔄 Cache-Optimierungen

## Verwendung im Code

```typescript
// Beispiel: Restaurant-Suche mit Cache
app.get('/api/places/restaurants', async (req, res) => {
  const { lat, lng, radius } = req.query;
  
  // Mit automatischem Cache
  const restaurants = await cacheService.getWithFallback(
    cacheKeys.places(lat, lng, radius, 'restaurant'),
    () => googlePlacesAPI.searchRestaurants({ lat, lng, radius })
  );
  
  res.json(restaurants);
});

// Beispiel: Hotels ohne Cache (LiteAPI)
app.get('/api/hotels', async (req, res) => {
  const { location, checkin, checkout } = req.query;
  
  // Immer Echtzeit - kein Cache
  const hotels = await liteAPI.searchHotels({
    location, checkin, checkout
  });
  
  res.json(hotels);
});
```

## Konfiguration

```env
# Cache-Konfiguration
REDIS_URL=redis://localhost:6379
CACHE_DEFAULT_TTL=3600          # 1 Stunde Standard
CACHE_MAX_SIZE=1000000          # 1GB Cache-Limit
CACHE_CLEANUP_INTERVAL=3600     # Bereinigung jede Stunde

# API Rate Limiting
GOOGLE_PLACES_RATE_LIMIT=1000   # Aufrufe pro Stunde
TRIPADVISOR_RATE_LIMIT=500      # Aufrufe pro Stunde
```

## Testing Strategie

```typescript
// Cache-Tests
describe('Cache Service', () => {
  test('should cache restaurant data for 3 hours', async () => {
    const restaurants = await cacheService.getRestaurants(testLocation);
    // Verifikation der TTL und Datenintegrität
  });
  
  test('should never cache hotel prices', async () => {
    const hotels = await hotelService.searchHotels(testParams);
    // Verifikation dass kein Cache verwendet wird
  });
});
```

## Nächste Schritte für morgen

1. **Cache-Service vervollständigen** - Die grundlegende CacheService-Klasse implementieren
2. **Database Schema anwenden** - Cache-Tabellen in PostgreSQL erstellen
3. **Google Places Integration** - Cache-Layer für Places API hinzufügen
4. **Performance-Tests** - Cache-Hit-Rate und API-Einsparungen messen
5. **GDPR-Compliance** - Datenbereinigung und Privacy-Features implementieren

Die grundlegende Struktur ist bereits vorbereitet in `server/cache-service.ts`. Der nächste Schritt wäre die Vervollständigung der CacheService-Implementierung und Integration in die bestehenden API-Routen.