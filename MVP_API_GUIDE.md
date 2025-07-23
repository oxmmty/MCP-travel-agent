# MVP API Integration Guide

## Overview

Clean, production-ready API integration reference for MVP development with final technology stack.

## Core API Stack

### 1. Google Places API (Primary Data Source)
```typescript
// Location search, POI data, hotel/restaurant information
interface GooglePlacesService {
  searchDestinations(query: string): Promise<PlaceResult[]>;
  findNearbyHotels(location: LatLng, radius: number): Promise<HotelResult[]>;
  findNearbyRestaurants(location: LatLng, radius: number): Promise<PlaceResult[]>;
  findNearbyAttractions(location: LatLng, radius: number): Promise<AttractionResult[]>;
  getPlaceDetails(placeId: string): Promise<PlaceDetails>;
}

// Required API Key: GOOGLE_MAPS_API_KEY
// Endpoints: Places API, Geocoding API, Places Details API
```

### 2. Mapbox (Visualization Only)
```typescript
// Map rendering and visualization
interface MapboxService {
  renderMap(container: string, style: string): MapboxGL.Map;
  addMarkers(locations: Location[]): void;
  addRouting(waypoints: LatLng[]): void;
  enableOfflineSupport(): void;
}

// Required Token: VITE_MAPBOX_ACCESS_TOKEN
// Usage: Map display, custom styling, offline maps
```

### 3. LiteAPI (Hotel Booking - In Development)
```typescript
// Hotel booking integration (partial implementation)
interface LiteAPIService {
  searchHotels(location: LatLng, dates: DateRange): Promise<Hotel[]>; // ✅ Working
  prebookHotel(offerId: string, guestDetails: Guest[]): Promise<PreBooking>; // ✅ Working
  confirmBooking(prebookId: string, paymentData: Payment): Promise<Booking>; // ❌ Not complete
}

// Required Keys: LITEAPI_PUBLIC_KEY, LITEAPI_PRIVATE_KEY
// Status: Search and Prebook functional, final booking needs completion
```

### 4. Unsplash (Visual Content)
```typescript
// Professional destination photography
interface UnsplashService {
  searchPhotos(destination: string): Promise<UnsplashPhoto[]>;
  getRandomPhoto(query: string): Promise<UnsplashPhoto>;
  trackDownload(photoId: string): Promise<void>;
}

// Required Key: UNSPLASH_ACCESS_KEY
// Attribution required for all images
```

### 5. OpenAI (AI Planning)
```typescript
// Travel planning intelligence
interface OpenAIService {
  generateItinerary(destination: string, preferences: string[]): Promise<Itinerary>;
  analyzeDestination(query: string): Promise<DestinationAnalysis>;
  translateContent(text: string, language: string): Promise<string>;
}

// Required Key: OPENAI_API_KEY
// Model: GPT-4 for travel planning
```

## Database Integration (Supabase)

### Authentication
```typescript
// Built-in user management
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Auth providers: Email, Google, Magic Links
// Row Level Security enabled
```

### Core Tables
```sql
-- Essential MVP schema
profiles          -- User management
trips             -- Trip planning
trip_items        -- Hotels, attractions, restaurants
hotel_bookings    -- LiteAPI bookings
chat_sessions     -- AI conversations
chat_messages     -- Conversation history
```

## Environment Variables

### Production Requirements
```bash
# Database
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# External APIs
GOOGLE_MAPS_API_KEY=...
VITE_MAPBOX_ACCESS_TOKEN=...
OPENAI_API_KEY=...
UNSPLASH_ACCESS_KEY=...

# Monetization
LITEAPI_PUBLIC_KEY=...
LITEAPI_PRIVATE_KEY=...
```

## Rate Limits & Costs

### Google Places API
- Free tier: $200/month credit
- Searches: $32/1000 requests
- Details: $17/1000 requests

### Mapbox
- Free tier: 50,000 map loads/month
- Vector tiles: $5/1000 requests

### LiteAPI
- No usage fees
- Commission: 8-15% per booking

### Unsplash
- Free tier: 50 requests/hour
- Commercial use allowed with attribution

### OpenAI
- GPT-4: $30/1M input tokens
- GPT-4: $60/1M output tokens

## Error Handling

### Standard Error Response
```typescript
interface APIError {
  code: string;
  message: string;
  details?: any;
  retryAfter?: number;
}

// Consistent error handling across all APIs
```

### Fallback Strategies
- Google Places: Cached results for common destinations
- Mapbox: Graceful degradation to basic map tiles
- LiteAPI: Alternative booking providers
- Unsplash: Default destination images
- OpenAI: Simplified responses on failures

## Mobile Considerations

### React Native Support
```typescript
// All APIs support React Native integration
// Mapbox: react-native-mapbox-gl
// HTTP: axios (universal)
// Supabase: Full React Native support
```

### Offline Functionality
- Mapbox: Offline map tiles
- Cached destination data
- Local SQLite for temporary storage

This guide provides the foundation for clean MVP development with production-ready API integrations.