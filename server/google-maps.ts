import axios from "axios";
import { cacheService } from "./cache-service";

// New Places API (New) base URL
const PLACES_API_BASE_URL = "https://places.googleapis.com/v1/places";

// Intelligente Radius-Bestimmung basierend auf Ortstyp
export function getSearchRadius(placeName: string, searchType: 'hotels' | 'attractions'): number {
  const isRural = /village|dorf|klein|berg|tal|wald|land/i.test(placeName);
  const isLargeCity = /berlin|münchen|hamburg|köln|frankfurt|stuttgart|düsseldorf|dortmund|essen|leipzig|dresden|hannover|nürnberg|duisburg|bochum|wuppertal|bielefeld|bonn|münster|karlsruhe|mannheim|augsburg|wiesbaden|gelsenkirchen|mönchengladbach|braunschweig|chemnitz|kiel|aachen|halle|magdeburg|freiburg|krefeld|lübeck|oberhausen|erfurt|mainz|rostock|kassel|hagen|hamm|saarbrücken|mülheim|potsdam|ludwigshafen|oldenburg|leverkusen|osnabrück|solingen|heidelberg|herne|neuss|darmstadt|paderborn|regensburg|ingolstadt|würzburg|fürth|wolfsburg|offenbach|ulm|heilbronn|pforzheim|göttingen|bottrop|trier|recklinghausen|reutlingen|bremerhaven|koblenz|bergisch|jena|remscheid|erlangen|moers|siegen|hildesheim|salzgitter/i.test(placeName);
  
  if (searchType === 'hotels') {
    if (isRural) return 30000; // 30km für ländliche Gebiete
    if (isLargeCity) return 15000; // 15km für Großstädte
    return 20000; // 20km für mittelgroße Städte
  } else { // attractions
    if (isRural) return 50000; // 50km für ländliche Gebiete
    if (isLargeCity) return 25000; // 25km für Großstädte
    return 35000; // 35km für mittelgroße Städte
  }
}

export interface PlaceResult {
  name: string;
  placeId: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  rating?: number;
  priceLevel?: number;
  photos?: string[];
  types: string[];
  vicinity?: string;
  icon?: string; // Google Places icon URL
  iconBackgroundColor?: string; // Icon background color
}

export interface HotelResult extends PlaceResult {
  pricePerNight?: number;
}

export interface AttractionResult extends PlaceResult {
  category: string;
}

// Calculate straight-line distance between two coordinates using Haversine formula
export function calculateDistance(
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

// Format distance for display
export function formatDistance(distanceKm: number, language: string = 'de'): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return language === 'de' ? `${meters} m` : `${meters} m`;
  } else {
    return language === 'de' ? `${distanceKm.toFixed(1)} km` : `${distanceKm.toFixed(1)} km`;
  }
}

export async function searchDestination(query: string): Promise<PlaceResult | null> {
  try {
    // Check cache first (destinations cached for 30 days)
    const cachedDestination = await cacheService.getCachedDestination(query);
    if (cachedDestination) {
      console.log(`[Cache Hit] Found cached destination: ${query}`);
      return cachedDestination;
    }

    console.log(`[Google Places] Fetching destination: ${query}`);
    
    const response = await axios.post(
      `${PLACES_API_BASE_URL}:searchText`,
      {
        textQuery: query,
        pageSize: 1
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY!,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.photos,places.types'
        }
      }
    );

    // Track API usage
    await cacheService.trackApiUsage('google_places', 'search_text', 1, {
      query,
      resultCount: response.data.places?.length || 0
    });

    if (response.data.places && response.data.places.length > 0) {
      const place = response.data.places[0];
      
      const destination = {
        name: place.displayName?.text || query,
        placeId: place.id || '',
        address: place.formattedAddress || "",
        location: {
          lat: place.location?.latitude || 0,
          lng: place.location?.longitude || 0,
        },
        rating: place.rating,
        photos: place.photos?.slice(0, 3).map((photo: any) => {
          // New Places API photo format
          return `https://places.googleapis.com/v1/${photo.name}/media?key=${process.env.GOOGLE_MAPS_API_KEY}&maxHeightPx=800&maxWidthPx=800`;
        }) || [],
        types: place.types || [],
      };

      // Save to cache for future requests
      await cacheService.saveDestinationToCache(query, destination);
      
      return destination;
    }

    return null;
  } catch (error) {
    console.error("Error searching destination:", error);
    await cacheService.trackApiUsage('google_places', 'search_text', 1, {
      query,
      error: error.message
    });
    return null;
  }
}

export async function findNearbyHotels(location: { lat: number; lng: number }, radius: number = 10000): Promise<HotelResult[]> {
  try {
    // Hotels are NOT cached (real-time pricing via LiteAPI)
    console.log(`[Google Places] Fetching hotels near ${location.lat},${location.lng} (no cache)`);
    
    const response = await axios.post(
      `${PLACES_API_BASE_URL}:searchNearby`,
      {
        includedTypes: ["lodging", "hotel"],
        maxResultCount: 20,
        locationRestriction: {
          circle: {
            center: {
              latitude: location.lat,
              longitude: location.lng
            },
            radius: radius
          }
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY!,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.priceLevel,places.photos,places.types,places.shortFormattedAddress'
        }
      }
    );

    // Track API usage for cost monitoring
    await cacheService.trackApiUsage('google_places', 'search_nearby', 1, {
      location,
      radius,
      category: 'hotels',
      resultCount: response.data.places?.length || 0
    });

    if (response.data.places) {
      return response.data.places.map((place: any) => {
        const iconInfo = getGooglePlacesIcon(place.types || []);
        return {
          name: place.displayName?.text || "Hotel",
          placeId: place.id || '',
          address: place.formattedAddress || place.shortFormattedAddress || "",
          location: {
            lat: place.location?.latitude || 0,
            lng: place.location?.longitude || 0,
          },
          rating: place.rating,
          priceLevel: place.priceLevel,
          pricePerNight: place.priceLevel ? place.priceLevel * 50 + 100 : 150, // Estimate based on price level
          photos: place.photos?.slice(0, 1).map((photo: any) => 
            `https://places.googleapis.com/v1/${photo.name}/media?key=${process.env.GOOGLE_MAPS_API_KEY}&maxHeightPx=400&maxWidthPx=400`
          ) || [],
          types: place.types || [],
          vicinity: place.shortFormattedAddress || place.formattedAddress || "",

          icon: iconInfo.icon,
          iconBackgroundColor: iconInfo.backgroundColor,
        };
      });
    }

    return [];
  } catch (error) {
    console.error("Error finding hotels:", error);
    await cacheService.trackApiUsage('google_places', 'search_nearby', 1, {
      location,
      radius,
      category: 'hotels',
      error: error.message
    });
    return [];
  }
}

export async function findNearbyRestaurants(location: { lat: number; lng: number }, radius: number = 5000): Promise<PlaceResult[]> {
  try {
    // Check cache first (restaurants cached for 3 hours)
    const cachedResults = await cacheService.getCachedPlaces(location, 'restaurants', radius);
    if (cachedResults.length > 0) {
      console.log(`[Cache Hit] Found ${cachedResults.length} cached restaurants`);
      return cachedResults;
    }

    console.log(`[Google Places] Fetching restaurants near ${location.lat},${location.lng}`);
    
    const response = await axios.post(
      `${PLACES_API_BASE_URL}:searchNearby`,
      {
        includedTypes: ["restaurant"],
        maxResultCount: 20,
        locationRestriction: {
          circle: {
            center: {
              latitude: location.lat,
              longitude: location.lng
            },
            radius: radius
          }
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY!,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.photos,places.types,places.shortFormattedAddress,places.priceLevel'
        }
      }
    );

    // Track API usage
    await cacheService.trackApiUsage('google_places', 'search_nearby', 1, {
      location,
      radius,
      category: 'restaurants',
      resultCount: response.data.places?.length || 0
    });

    if (response.data.places) {
      const restaurants = response.data.places.map((place: any) => {
        const iconInfo = getGooglePlacesIcon(place.types || []);
        return {
          name: place.displayName?.text || "Restaurant",
          id: place.id || '', // Frontend expects 'id' field for PlaceID
          placeId: place.id || '',
          address: place.formattedAddress || place.shortFormattedAddress || "",
          location: {
            lat: place.location?.latitude || 0,
            lng: place.location?.longitude || 0,
          },
          rating: place.rating || 4,
          priceLevel: place.priceLevel,
          photos: place.photos?.slice(0, 1).map((photo: any) => 
            `https://places.googleapis.com/v1/${photo.name}/media?key=${process.env.GOOGLE_MAPS_API_KEY}&maxHeightPx=400&maxWidthPx=400`
          ) || [],
          types: place.types || [],
          vicinity: place.shortFormattedAddress || place.formattedAddress || "",
          category: getRestaurantCategory(place.types || []),
          icon: iconInfo.icon,
          iconBackgroundColor: iconInfo.backgroundColor,
        };
      });

      // Save to cache for future requests
      await cacheService.savePlacesToCache(location, 'restaurants', restaurants, radius);
      
      return restaurants;
    }

    return [];
  } catch (error) {
    console.error("Error finding restaurants:", error);
    await cacheService.trackApiUsage('google_places', 'search_nearby', 1, {
      location,
      radius,
      category: 'restaurants',
      error: error.message
    });
    return [];
  }
}

export async function findNearbyAttractions(location: { lat: number; lng: number }, radius: number = 25000): Promise<AttractionResult[]> {
  try {
    // Check cache first (attractions cached for 30 days in development)
    const cachedResults = await cacheService.getCachedPlaces(location, 'attractions', radius);
    if (cachedResults.length > 0) {
      console.log(`[Cache Hit] Found ${cachedResults.length} cached attractions`);
      return cachedResults;
    }

    console.log(`[Google Places] Fetching attractions near ${location.lat},${location.lng}`);

    // Optimized search: Use one comprehensive search instead of 5 separate ones
    const allTypes = [
      "tourist_attraction", "museum", "art_gallery", "amusement_park", 
      "zoo", "aquarium", "church", "park", "historical_landmark",
      "place_of_worship", "botanical_garden", "national_park"
    ];

    const allAttractions: AttractionResult[] = [];
    const seenPlaceIds = new Set<string>();
    let totalApiCalls = 0;

    // Single comprehensive search with all types
    try {
      const response = await axios.post(
        `${PLACES_API_BASE_URL}:searchNearby`,
        {
          includedTypes: allTypes,
          maxResultCount: 20,
          locationRestriction: {
            circle: {
              center: {
                latitude: location.lat,
                longitude: location.lng
              },
              radius: radius
            }
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY!,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.photos,places.types,places.shortFormattedAddress'
          }
        }
      );

      totalApiCalls = 1; // Only one API call now!

      if (response.data.places) {
        const attractions = response.data.places
          .filter((place: any) => !seenPlaceIds.has(place.id))
          .map((place: any) => {
            seenPlaceIds.add(place.id);
            const iconInfo = getGooglePlacesIcon(place.types || []);
            return {
              name: place.displayName?.text || "Attraction",
              id: place.id || '', // Frontend expects 'id' field for PlaceID
              placeId: place.id || '',
              address: place.formattedAddress || place.shortFormattedAddress || "",
              location: {
                lat: place.location?.latitude || 0,
                lng: place.location?.longitude || 0,
              },
              rating: place.rating || 4,
              photos: place.photos?.slice(0, 1).map((photo: any) => 
                `https://places.googleapis.com/v1/${photo.name}/media?key=${process.env.GOOGLE_MAPS_API_KEY}&maxHeightPx=400&maxWidthPx=400`
              ) || [],
              types: place.types || [],
              vicinity: place.shortFormattedAddress || place.formattedAddress || "",
              category: getCategoryFromTypes(place.types || []),
              icon: iconInfo.icon,
              iconBackgroundColor: iconInfo.backgroundColor,
            };
          });
        
        allAttractions.push(...attractions);
      }
    } catch (searchError) {
      console.error("Error in optimized attractions search:", searchError);
      totalApiCalls = 1;
    }

    // Track API usage (now only 1 call instead of 5!)
    await cacheService.trackApiUsage('google_places', 'search_nearby', totalApiCalls, {
      location,
      radius,
      category: 'attractions',
      resultCount: allAttractions.length,
      searchOptimized: true,
      note: 'Optimized from 5 calls to 1 call'
    });

    // Save all attractions to cache
    if (allAttractions.length > 0) {
      await cacheService.savePlacesToCache(location, 'attractions', allAttractions, radius);
    }

    console.log(`[API Optimization] Attractions fetched with 1 API call instead of 5 (${allAttractions.length} results)`);
    return allAttractions;
  } catch (error) {
    console.error("Error finding attractions:", error);
    await cacheService.trackApiUsage('google_places', 'search_nearby', 1, {
      location,
      radius,
      category: 'attractions',
      error: error.message
    });
    return [];
  }
}

function getCategoryFromTypes(types: string[]): string {
  // Museums and culture
  if (types.includes("museum")) return "museum";
  if (types.includes("art_gallery")) return "art_gallery";
  
  // Parks and nature
  if (types.includes("park") || types.includes("national_park") || types.includes("botanical_garden")) return "park";
  
  // Religious sites
  if (types.includes("church")) return "church";
  
  // Entertainment and activities
  if (types.includes("amusement_park")) return "amusement_park";
  if (types.includes("zoo")) return "zoo";
  if (types.includes("aquarium")) return "aquarium";
  
  // Historical landmarks
  if (types.includes("historical_landmark") || types.includes("historical_place")) return "historical_landmark";
  
  // Tourist attractions (general)
  if (types.includes("tourist_attraction")) return "tourist_attraction";
  
  return "attraction";
}

function getRestaurantCategory(types: string[]): string {
  // Specific restaurant types
  if (types.includes("cafe") || types.includes("coffee_shop")) return "cafe";
  if (types.includes("bakery")) return "bakery";
  if (types.includes("bar") || types.includes("night_club")) return "bar";
  if (types.includes("fast_food") || types.includes("meal_takeaway")) return "fast_food";
  if (types.includes("ice_cream") || types.includes("dessert")) return "ice_cream";
  
  // General restaurant
  if (types.includes("restaurant") || types.includes("food") || types.includes("meal_delivery")) return "restaurant";
  
  return "restaurant";
}



// Google Places Icon mapping based on place types
// Reference: https://developers.google.com/maps/documentation/places/web-service/icons
export function getGooglePlacesIcon(types: string[]): { icon: string; backgroundColor: string } {
  // Hotels and lodging
  if (types.includes("lodging") || types.includes("hotel")) {
    return {
      icon: "https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/lodging-71.png",
      backgroundColor: "#4285F4"
    };
  }
  
  // Restaurants and food
  if (types.includes("restaurant") || types.includes("food") || types.includes("meal_takeaway")) {
    return {
      icon: "https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/restaurant-71.png",
      backgroundColor: "#FF9800"
    };
  }
  
  // Cafes and coffee
  if (types.includes("cafe") || types.includes("coffee_shop") || types.includes("bakery")) {
    return {
      icon: "https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/cafe-71.png",
      backgroundColor: "#795548"
    };
  }
  
  // Museums and cultural sites (highest priority)
  if (types.includes("museum")) {
    return {
      icon: "https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/museum-71.png",
      backgroundColor: "#673AB7"
    };
  }
  
  // Art galleries
  if (types.includes("art_gallery")) {
    return {
      icon: "https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/art_gallery-71.png",
      backgroundColor: "#E91E63"
    };
  }
  
  // Churches and religious sites (before tourist_attraction)
  if (types.includes("church") || types.includes("place_of_worship")) {
    return {
      icon: "https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/worship-71.png",
      backgroundColor: "#8BC34A"
    };
  }
  
  // Entertainment venues
  if (types.includes("amusement_park") || types.includes("zoo") || types.includes("aquarium")) {
    return {
      icon: "https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/amusement-71.png",
      backgroundColor: "#FF5722"
    };
  }
  
  // Specific landmark types
  if (types.includes("historical_landmark") || types.includes("establishment")) {
    return {
      icon: "https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/landmark-71.png",
      backgroundColor: "#795548"
    };
  }
  
  // Generic tourist attractions (lowest priority)
  if (types.includes("tourist_attraction")) {
    return {
      icon: "https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/tourist_attraction-71.png",
      backgroundColor: "#9C27B0"
    };
  }
  
  // Parks and nature
  if (types.includes("park") || types.includes("national_park") || types.includes("botanical_garden")) {
    return {
      icon: "https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/park-71.png",
      backgroundColor: "#4CAF50"
    };
  }
  
  // Shopping
  if (types.includes("shopping_mall") || types.includes("department_store") || types.includes("clothing_store") || types.includes("shoe_store")) {
    return {
      icon: "https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/shopping-71.png",
      backgroundColor: "#E91E63"
    };
  }
  
  // Transport
  if (types.includes("transit_station") || types.includes("bus_station") || types.includes("subway_station") || types.includes("train_station")) {
    return {
      icon: "https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/transit-71.png",
      backgroundColor: "#607D8B"
    };
  }
  
  // Airport
  if (types.includes("airport")) {
    return {
      icon: "https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/airport-71.png",
      backgroundColor: "#3F51B5"
    };
  }
  
  // Bars and nightlife
  if (types.includes("bar") || types.includes("night_club")) {
    return {
      icon: "https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/bar-71.png",
      backgroundColor: "#FF9800"
    };
  }
  
  // Gas stations
  if (types.includes("gas_station")) {
    return {
      icon: "https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/gas_station-71.png",
      backgroundColor: "#607D8B"
    };
  }
  
  // Banks
  if (types.includes("bank") || types.includes("atm")) {
    return {
      icon: "https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/bank-71.png",
      backgroundColor: "#2196F3"
    };
  }
  
  // Default for generic places
  return {
    icon: "https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/geocode-71.png",
    backgroundColor: "#757575"
  };
}

export async function findNearbyShopping(location: { lat: number; lng: number }, radius: number = 10000): Promise<PlaceResult[]> {
  try {
    // Check cache first (shopping cached for 30 days)
    const cachedResults = await cacheService.getCachedPlaces(location, 'shopping', radius);
    if (cachedResults.length > 0) {
      console.log(`[Cache Hit] Found ${cachedResults.length} cached shopping places`);
      return cachedResults;
    }

    console.log(`[Google Places] Fetching shopping near ${location.lat},${location.lng}`);
    
    const response = await axios.post(
      `${PLACES_API_BASE_URL}:searchNearby`,
      {
        includedTypes: ["shopping_mall", "department_store", "clothing_store", "shoe_store", "jewelry_store", "electronics_store"],
        maxResultCount: 20,
        locationRestriction: {
          circle: {
            center: {
              latitude: location.lat,
              longitude: location.lng
            },
            radius: radius
          }
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY!,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.photos,places.types,places.shortFormattedAddress'
        }
      }
    );

    // Track API usage
    await cacheService.trackApiUsage('google_places', 'search_nearby', 1, {
      location,
      radius,
      category: 'shopping',
      resultCount: response.data.places?.length || 0
    });

    if (response.data.places) {
      const shopping = response.data.places.map((place: any) => {
        const iconInfo = getGooglePlacesIcon(place.types || []);
        return {
          name: place.displayName?.text || "Shopping",
          placeId: place.id || '',
          address: place.formattedAddress || place.shortFormattedAddress || "",
          location: {
            lat: place.location?.latitude || 0,
            lng: place.location?.longitude || 0,
          },
          rating: place.rating || 4,
          photos: place.photos?.slice(0, 1).map((photo: any) => 
            `https://places.googleapis.com/v1/${photo.name}/media?key=${process.env.GOOGLE_MAPS_API_KEY}&maxHeightPx=400&maxWidthPx=400`
          ) || [],
          types: place.types || [],
          vicinity: place.shortFormattedAddress || place.formattedAddress || "",
          icon: iconInfo.icon,
          iconBackgroundColor: iconInfo.backgroundColor,
        };
      });

      // Save to cache for future requests
      await cacheService.savePlacesToCache(location, 'shopping', shopping, radius);
      
      return shopping;
    }

    return [];
  } catch (error) {
    console.error("Error finding shopping:", error);
    await cacheService.trackApiUsage('google_places', 'search_nearby', 1, {
      location,
      radius,
      category: 'shopping',
      error: error.message
    });
    return [];
  }
}

export async function findNearbyParks(location: { lat: number; lng: number }, radius: number = 15000): Promise<PlaceResult[]> {
  try {
    // Check cache first (parks cached for 30 days)
    const cachedResults = await cacheService.getCachedPlaces(location, 'parks', radius);
    if (cachedResults.length > 0) {
      console.log(`[Cache Hit] Found ${cachedResults.length} cached parks`);
      return cachedResults;
    }

    console.log(`[Google Places] Fetching parks near ${location.lat},${location.lng}`);
    
    const response = await axios.post(
      `${PLACES_API_BASE_URL}:searchNearby`,
      {
        includedTypes: ["park", "national_park", "rv_park", "botanical_garden"],
        maxResultCount: 20,
        locationRestriction: {
          circle: {
            center: {
              latitude: location.lat,
              longitude: location.lng
            },
            radius: radius
          }
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY!,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.photos,places.types,places.shortFormattedAddress'
        }
      }
    );

    // Track API usage
    await cacheService.trackApiUsage('google_places', 'search_nearby', 1, {
      location,
      radius,
      category: 'parks',
      resultCount: response.data.places?.length || 0
    });

    if (response.data.places) {
      const parks = response.data.places.map((place: any) => {
        const iconInfo = getGooglePlacesIcon(place.types || []);
        return {
          name: place.displayName?.text || "Park",
          placeId: place.id || '',
          address: place.formattedAddress || place.shortFormattedAddress || "",
          location: {
            lat: place.location?.latitude || 0,
            lng: place.location?.longitude || 0,
          },
          rating: place.rating || 4,
          photos: place.photos?.slice(0, 1).map((photo: any) => 
            `https://places.googleapis.com/v1/${photo.name}/media?key=${process.env.GOOGLE_MAPS_API_KEY}&maxHeightPx=400&maxWidthPx=400`
          ) || [],
          types: place.types || [],
          vicinity: place.shortFormattedAddress || place.formattedAddress || "",
          icon: iconInfo.icon,
          iconBackgroundColor: iconInfo.backgroundColor,
        };
      });

      // Save to cache for future requests
      await cacheService.savePlacesToCache(location, 'parks', parks, radius);
      
      return parks;
    }

    return [];
  } catch (error) {
    console.error("Error finding parks:", error);
    await cacheService.trackApiUsage('google_places', 'search_nearby', 1, {
      location,
      radius,
      category: 'parks',
      error: error.message
    });
    return [];
  }
}

export async function findNearbyCafes(location: { lat: number; lng: number }, radius: number = 8000): Promise<PlaceResult[]> {
  try {
    // Check cache first (cafes cached for 30 days)
    const cachedResults = await cacheService.getCachedPlaces(location, 'cafes', radius);
    if (cachedResults.length > 0) {
      console.log(`[Cache Hit] Found ${cachedResults.length} cached cafes`);
      return cachedResults;
    }

    console.log(`[Google Places] Fetching cafes near ${location.lat},${location.lng}`);
    
    const response = await axios.post(
      `${PLACES_API_BASE_URL}:searchNearby`,
      {
        includedTypes: ["cafe", "coffee_shop", "bakery"],
        maxResultCount: 20,
        locationRestriction: {
          circle: {
            center: {
              latitude: location.lat,
              longitude: location.lng
            },
            radius: radius
          }
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY!,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.photos,places.types,places.shortFormattedAddress'
        }
      }
    );

    // Track API usage
    await cacheService.trackApiUsage('google_places', 'search_nearby', 1, {
      location,
      radius,
      category: 'cafes',
      resultCount: response.data.places?.length || 0
    });

    if (response.data.places) {
      const cafes = response.data.places.map((place: any) => {
        const iconInfo = getGooglePlacesIcon(place.types || []);
        return {
          name: place.displayName?.text || "Café",
          placeId: place.id || '',
          address: place.formattedAddress || place.shortFormattedAddress || "",
          location: {
            lat: place.location?.latitude || 0,
            lng: place.location?.longitude || 0,
          },
          rating: place.rating || 4,
          photos: place.photos?.slice(0, 1).map((photo: any) => 
            `https://places.googleapis.com/v1/${photo.name}/media?key=${process.env.GOOGLE_MAPS_API_KEY}&maxHeightPx=400&maxWidthPx=400`
          ) || [],
          types: place.types || [],
          vicinity: place.shortFormattedAddress || place.formattedAddress || "",
          icon: iconInfo.icon,
          iconBackgroundColor: iconInfo.backgroundColor,
        };
      });

      // Save to cache for future requests
      await cacheService.savePlacesToCache(location, 'cafes', cafes, radius);
      
      return cafes;
    }

    return [];
  } catch (error) {
    console.error("Error finding cafes:", error);
    await cacheService.trackApiUsage('google_places', 'search_nearby', 1, {
      location,
      radius,
      category: 'cafes',
      error: error.message
    });
    return [];
  }
}

export async function findNearbyTransport(location: { lat: number; lng: number }, radius: number = 5000): Promise<PlaceResult[]> {
  try {
    // Check cache first (transport cached for 30 days)
    const cachedResults = await cacheService.getCachedPlaces(location, 'transport', radius);
    if (cachedResults.length > 0) {
      console.log(`[Cache Hit] Found ${cachedResults.length} cached transport options`);
      return cachedResults;
    }

    console.log(`[Google Places] Fetching transport near ${location.lat},${location.lng}`);
    
    const response = await axios.post(
      `${PLACES_API_BASE_URL}:searchNearby`,
      {
        includedTypes: ["transit_station", "bus_station", "subway_station", "train_station", "airport"],
        maxResultCount: 20,
        locationRestriction: {
          circle: {
            center: {
              latitude: location.lat,
              longitude: location.lng
            },
            radius: radius
          }
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY!,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.photos,places.types,places.shortFormattedAddress'
        }
      }
    );

    // Track API usage
    await cacheService.trackApiUsage('google_places', 'search_nearby', 1, {
      location,
      radius,
      category: 'transport',
      resultCount: response.data.places?.length || 0
    });

    if (response.data.places) {
      const transport = response.data.places.map((place: any) => {
        const iconInfo = getGooglePlacesIcon(place.types || []);
        return {
          name: place.displayName?.text || "Transport",
          placeId: place.id || '',
          address: place.formattedAddress || place.shortFormattedAddress || "",
          location: {
            lat: place.location?.latitude || 0,
            lng: place.location?.longitude || 0,
          },
          rating: place.rating || 4,
          photos: place.photos?.slice(0, 1).map((photo: any) => 
            `https://places.googleapis.com/v1/${photo.name}/media?key=${process.env.GOOGLE_MAPS_API_KEY}&maxHeightPx=400&maxWidthPx=400`
          ) || [],
          types: place.types || [],
          vicinity: place.shortFormattedAddress || place.formattedAddress || "",
          icon: iconInfo.icon,
          iconBackgroundColor: iconInfo.backgroundColor,
        };
      });

      // Save to cache for future requests
      await cacheService.savePlacesToCache(location, 'transport', transport, radius);
      
      return transport;
    }

    return [];
  } catch (error) {
    console.error("Error finding transport:", error);
    await cacheService.trackApiUsage('google_places', 'search_nearby', 1, {
      location,
      radius,
      category: 'transport',
      error: error.message
    });
    return [];
  }
}

export async function getPlaceDetails(placeId: string): Promise<any> {
  try {
    const response = await axios.get(
      `${PLACES_API_BASE_URL}/${placeId}`,
      {
        headers: {
          'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY!,
          'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,rating,photos,currentOpeningHours,websiteUri,internationalPhoneNumber'
        }
      }
    );

    // Transform the response to match the expected format
    const place = response.data;
    return {
      name: place.displayName?.text,
      formatted_address: place.formattedAddress,
      geometry: {
        location: {
          lat: place.location?.latitude,
          lng: place.location?.longitude
        }
      },
      rating: place.rating,
      photos: place.photos?.map((photo: any) => ({
        photo_reference: photo.name,
        url: `https://places.googleapis.com/v1/${photo.name}/media?key=${process.env.GOOGLE_MAPS_API_KEY}&maxHeightPx=800&maxWidthPx=800`
      })),
      opening_hours: place.currentOpeningHours,
      website: place.websiteUri,
      international_phone_number: place.internationalPhoneNumber
    };
  } catch (error) {
    console.error("Error getting place details:", error);
    return null;
  }
}

// Search for famous landmarks and attractions by name
export async function searchFamousAttraction(attractionName: string, nearLocation?: { lat: number; lng: number }): Promise<AttractionResult | null> {
  try {
    const requestBody: any = {
      textQuery: attractionName,
      pageSize: 1
    };

    // Add location bias if provided
    if (nearLocation) {
      requestBody.locationBias = {
        circle: {
          center: {
            latitude: nearLocation.lat,
            longitude: nearLocation.lng
          },
          radius: 5000
        }
      };
    }

    const response = await axios.post(
      `${PLACES_API_BASE_URL}:searchText`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY!,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.photos,places.types'
        }
      }
    );

    if (response.data.places && response.data.places.length > 0) {
      const place = response.data.places[0];
      
      return {
        name: place.displayName?.text || attractionName,
        placeId: place.id || '',
        address: place.formattedAddress || '',
        location: {
          lat: place.location?.latitude || nearLocation?.lat || 0,
          lng: place.location?.longitude || nearLocation?.lng || 0,
        },
        rating: place.rating,
        photos: place.photos?.map((photo: any) => 
          `https://places.googleapis.com/v1/${photo.name}/media?key=${process.env.GOOGLE_MAPS_API_KEY}&maxHeightPx=400&maxWidthPx=400`
        ) || [],
        types: place.types || [],
        category: getCategoryFromTypes(place.types || [])
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error searching famous attraction:", error);
    return null;
  }
}