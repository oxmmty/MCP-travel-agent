import { searchDestination } from '../google-places.js';

interface LocationResult {
  placeId: string;
  name: string;
  type: 'hotel' | 'restaurant' | 'attraction' | 'destination';
  coordinates?: { lat: number; lng: number };
  cached: boolean;
  data?: any;
}

interface DatabaseStorage {
  getCachedLocation(name: string): Promise<any>;
  saveLocationToCache(location: any): Promise<void>;
}

export class ChatLocationResolver {
  constructor(private storage: DatabaseStorage) {}

  /**
   * Resolves locations mentioned in chat messages
   * 1. Check our database/cache first
   * 2. Use Google Places API if not found
   * 3. Return standardized LocationResult
   */
  async resolveLocations(extractedNames: string[], destinationContext: string): Promise<LocationResult[]> {
    console.log('[ChatLocationResolver] Resolving locations:', extractedNames);
    
    const results: LocationResult[] = [];
    
    for (const locationName of extractedNames) {
      try {
        // 1. First check our database/cache (like map search does)
        const cachedLocation = await this.checkCache(locationName);
        
        if (cachedLocation) {
          console.log('[ChatLocationResolver] Found in cache:', locationName);
          results.push({
            placeId: cachedLocation.placeId || cachedLocation.id,
            name: cachedLocation.name,
            type: this.determineType(cachedLocation),
            coordinates: cachedLocation.coordinates || cachedLocation.location,
            cached: true,
            data: cachedLocation
          });
        } else {
          // 2. Not in cache - use Google Places API
          console.log('[ChatLocationResolver] Fetching from Google Places:', locationName);
          const googleResult = await this.fetchFromGooglePlaces(locationName, destinationContext);
          
          if (googleResult) {
            // Save to cache for future use
            await this.saveToCache(googleResult);
            
            results.push({
              placeId: googleResult.placeId,
              name: googleResult.name,
              type: googleResult.type,
              coordinates: googleResult.coordinates,
              cached: false,
              data: googleResult
            });
          }
        }
      } catch (error) {
        console.warn('[ChatLocationResolver] Error resolving location:', locationName, error);
      }
    }
    
    return results;
  }

  /**
   * Check our database/cache first (same approach as map)
   */
  private async checkCache(locationName: string): Promise<any> {
    try {
      // Use existing destination cache/database lookup
      const cached = await this.storage.getCachedLocation(locationName);
      return cached;
    } catch (error) {
      console.warn('[ChatLocationResolver] Cache check failed:', error);
      return null;
    }
  }

  /**
   * Fetch from Google Places API when not in cache
   */
  private async fetchFromGooglePlaces(locationName: string, destinationContext: string): Promise<any> {
    try {
      // Use existing Google Places search function
      const searchQuery = destinationContext ? `${locationName} ${destinationContext}` : locationName;
      const result = await searchDestination(searchQuery);
      
      if (!result) return null;
      
      // Determine type based on Google Places types
      const type = this.classifyFromGoogleTypes(result.types || []);
      
      return {
        placeId: result.place_id,
        name: result.name,
        type: type,
        coordinates: result.location,
        address: result.address,
        rating: result.rating,
        photos: result.photos,
        types: result.types,
        source: 'google_places'
      };
    } catch (error) {
      console.error('[ChatLocationResolver] Google Places fetch failed:', error);
      return null;
    }
  }

  /**
   * Save location to cache/database for future use
   */
  private async saveToCache(location: any): Promise<void> {
    try {
      await this.storage.saveLocationToCache(location);
    } catch (error) {
      console.warn('[ChatLocationResolver] Cache save failed:', error);
    }
  }

  /**
   * Determine location type from existing data structure - now includes destinations like MindTrip
   */
  private determineType(location: any): 'hotel' | 'restaurant' | 'attraction' | 'destination' {
    // If already has type field
    if (location.type) return location.type;
    
    // MindTrip Logic: Check if this is a city/town/region (destination) first
    if (location.types) {
      const destinationTypes = [
        'locality', 'sublocality', 'administrative_area_level_1', 'administrative_area_level_2', 
        'administrative_area_level_3', 'political', 'postal_town', 'colloquial_area'
      ];
      
      const hasDestinationType = location.types.some((type: string) => destinationTypes.includes(type));
      const hasEstablishment = location.types.includes('establishment');
      
      // If it's a administrative area but NOT an establishment = destination (like MindTrip's Cochem pin)
      if (hasDestinationType && !hasEstablishment) {
        console.log(`[ChatLocationResolver] Classified as destination: "${location.name}"`);
        return 'destination';
      }
    }
    
    // Check name patterns for geographic features
    if (location.name) {
      const nameMatch = this.classifyFromNamePattern(location.name);
      if (nameMatch) return nameMatch;
    }
    
    // Check Google Places types for businesses
    if (location.types) {
      return this.classifyFromGoogleTypes(location.types);
    }
    
    // Check category field (from existing FAMOUS_ATTRACTIONS)
    if (location.category) {
      const category = location.category.toLowerCase();
      if (category.includes('hotel') || category.includes('unterkunft')) return 'hotel';
      if (category.includes('restaurant') || category.includes('café')) return 'restaurant';
    }
    
    // Default to attraction
    return 'attraction';
  }

  /**
   * Classify location based on name patterns for geographic features
   * This helps catch geographic features that Google might misclassify
   */
  private classifyFromNamePattern(name: string): 'attraction' | 'destination' | null {
    const lowerName = name.toLowerCase();
    
    // Geographic features that should NEVER be hotels or restaurants
    const geographicPatterns = [
      'valley', 'tal', 'river', 'fluss', 'mosel', 'rhein', 'elbe', 'donau',
      'mountain', 'berg', 'hill', 'hügel', 'forest', 'wald',
      'lake', 'see', 'coast', 'küste', 'bay', 'bucht',
      'promenade', 'promenad', 'ufer', 'embankment', 'waterfront',
      'market square', 'marktplatz', 'hauptplatz', 'stadtplatz'
    ];
    
    if (geographicPatterns.some(pattern => lowerName.includes(pattern))) {
      console.log(`[ChatLocationResolver] Name pattern override: "${name}" -> attraction (geographic feature)`);
      return 'attraction';
    }
    
    // Check for city/town patterns that should be destinations (like MindTrip)
    const cityPatterns = [
      'stadt', 'city', 'town', 'village', 'dorf', 'gemeinde', 'ort'
    ];
    
    if (cityPatterns.some(pattern => lowerName.includes(pattern))) {
      console.log(`[ChatLocationResolver] Name pattern override: "${name}" -> destination (city/town)`);
      return 'destination';
    }
    
    return null;
  }

  /**
   * Classify location based on Google Places types - respecting Google's official classifications
   */
  private classifyFromGoogleTypes(types: string[]): 'hotel' | 'restaurant' | 'attraction' | 'destination' {
    console.log('[ChatLocationResolver] Classifying with Google types:', types);
    
    // Priority 1: Business establishments with clear categories
    const hotelTypes = ['lodging', 'travel_agency', 'rv_park'];
    if (types.some(type => hotelTypes.includes(type))) {
      console.log('[ChatLocationResolver] Classified as hotel based on:', types.filter(t => hotelTypes.includes(t)));
      return 'hotel';
    }
    
    const restaurantTypes = ['restaurant', 'food', 'meal_takeaway', 'cafe', 'bar', 'bakery', 'meal_delivery'];
    if (types.some(type => restaurantTypes.includes(type))) {
      console.log('[ChatLocationResolver] Classified as restaurant based on:', types.filter(t => restaurantTypes.includes(t)));
      return 'restaurant';
    }
    
    // Priority 2: Geographic/Administrative areas should NOT be hotels
    // These are places, not businesses
    const placeTypes = [
      'natural_feature', 'park', 'sublocality', 'locality', 
      'administrative_area_level_1', 'administrative_area_level_2', 'administrative_area_level_3',
      'country', 'political', 'route', 'street_address', 'postal_code'
    ];
    
    const hasPlaceType = types.some(type => placeTypes.includes(type));
    const hasEstablishment = types.includes('establishment');
    
    // If it's a place/administrative area but NOT a business establishment, it's an attraction
    if (hasPlaceType && !hasEstablishment) {
      console.log('[ChatLocationResolver] Classified as attraction (place/administrative):', types.filter(t => placeTypes.includes(t)));
      return 'attraction';
    }
    
    // Priority 3: Tourism and attractions
    const attractionTypes = ['tourist_attraction', 'museum', 'amusement_park', 'zoo', 'church', 'place_of_worship'];
    if (types.some(type => attractionTypes.includes(type))) {
      console.log('[ChatLocationResolver] Classified as attraction based on:', types.filter(t => attractionTypes.includes(t)));
      return 'attraction';
    }
    
    // Fallback: Most things should be attractions unless clearly a business
    console.log('[ChatLocationResolver] Default classification as attraction for types:', types);
    return 'attraction';
  }
}