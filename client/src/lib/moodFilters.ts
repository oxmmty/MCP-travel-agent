export interface MoodFilters {
  prioritize: string[];  // POI types to prioritize/show more of
  exclude: string[];     // POI types to hide/minimize
  accommodationTypes: string[];  // preferred accommodation types
  restaurantFilters: {
    priceLevel?: number[];  // [1,2] for budget, [3,4] for luxury
    cuisineTypes?: string[];
    exclude?: string[];
  };
  activityFilters: {
    timeOfDay?: string[];  // ['morning', 'afternoon', 'evening', 'night']
    intensity?: string;    // 'low' | 'medium' | 'high'
    indoor?: boolean;
    outdoor?: boolean;
  };
}

// Comprehensive mood-based filtering rules based on actual travel moods in system
export const MOOD_FILTERS: Record<string, MoodFilters> = {
  "Adventure Seeker": {
    prioritize: [
      'park', 'national_park', 'botanical_garden',
      'amusement_park', 'zoo', 'aquarium',
      'tourist_attraction', 'point_of_interest'
    ],
    exclude: [
      'art_gallery', 'museum', 'spa', 
      'beauty_salon', 'jewelry_store', 'shopping_mall'
    ],
    accommodationTypes: ['hostel', 'guesthouse', 'lodge'],
    restaurantFilters: {
      priceLevel: [1, 2], // Budget to mid-range
      exclude: ['fine_dining', 'luxury_restaurant'],
      cuisineTypes: ['local', 'street_food', 'casual_dining']
    },
    activityFilters: {
      timeOfDay: ['morning', 'afternoon'],
      intensity: 'high',
      outdoor: true,
      indoor: false
    }
  },

  "Culture Explorer": {
    prioritize: [
      'museum', 'art_gallery', 'historical_landmark',
      'church', 'tourist_attraction', 'university',
      'library', 'cultural_center'
    ],
    exclude: [
      'amusement_park', 'nightclub', 'bar',
      'casino', 'shopping_mall'
    ],
    accommodationTypes: ['boutique_hotel', 'historic_hotel', 'bed_and_breakfast'],
    restaurantFilters: {
      priceLevel: [2, 3],
      cuisineTypes: ['local', 'traditional', 'ethnic'],
      exclude: ['fast_food', 'chain_restaurant']
    },
    activityFilters: {
      timeOfDay: ['morning', 'afternoon'],
      intensity: 'medium',
      indoor: true,
      outdoor: false
    }
  },

  "Relaxation Retreat": {
    prioritize: [
      'spa', 'park', 'botanical_garden',
      'beach', 'natural_feature', 'wellness_center'
    ],
    exclude: [
      'amusement_park', 'nightclub', 'bar',
      'casino', 'tourist_attraction', 'shopping_mall'
    ],
    accommodationTypes: ['spa_resort', 'luxury_hotel', 'wellness_hotel'],
    restaurantFilters: {
      priceLevel: [3, 4],
      cuisineTypes: ['healthy', 'organic', 'vegetarian'],
      exclude: ['fast_food', 'street_food']
    },
    activityFilters: {
      timeOfDay: ['morning', 'afternoon'],
      intensity: 'low',
      indoor: true,
      outdoor: true
    }
  },

  "Foodie Journey": {
    prioritize: [
      'restaurant', 'food', 'meal_takeaway',
      'market', 'grocery_or_supermarket', 'bakery',
      'cafe', 'cooking_school'
    ],
    exclude: [
      'fast_food', 'chain_restaurant'
    ],
    accommodationTypes: ['boutique_hotel', 'central_hotel'],
    restaurantFilters: {
      priceLevel: [2, 3, 4], // Mid to high-end
      cuisineTypes: ['local', 'gourmet', 'specialty'],
      exclude: ['fast_food', 'chain_restaurant']
    },
    activityFilters: {
      timeOfDay: ['afternoon', 'evening'],
      intensity: 'medium',
      indoor: true,
      outdoor: false
    }
  },

  "Urban Explorer": {
    prioritize: [
      'shopping_mall', 'store', 'night_club',
      'bar', 'tourist_attraction', 'transit_station',
      'subway_station', 'rooftop_bar'
    ],
    exclude: [
      'park', 'natural_feature', 'church',
      'museum'
    ],
    accommodationTypes: ['city_hotel', 'design_hotel', 'central_hotel'],
    restaurantFilters: {
      priceLevel: [2, 3, 4],
      cuisineTypes: ['trendy', 'fusion', 'international'],
      exclude: ['traditional']
    },
    activityFilters: {
      timeOfDay: ['afternoon', 'evening', 'night'],
      intensity: 'high',
      indoor: true,
      outdoor: false
    }
  },

  "Nature Lover": {
    prioritize: [
      'park', 'national_park', 'botanical_garden',
      'natural_feature', 'hiking_area', 'beach',
      'lake', 'forest'
    ],
    exclude: [
      'shopping_mall', 'nightclub', 'casino',
      'amusement_park', 'urban_area'
    ],
    accommodationTypes: ['eco_lodge', 'cabin', 'camping'],
    restaurantFilters: {
      priceLevel: [1, 2],
      cuisineTypes: ['organic', 'local', 'farm_to_table'],
      exclude: ['fast_food', 'luxury_restaurant']
    },
    activityFilters: {
      timeOfDay: ['morning', 'afternoon'],
      intensity: 'medium',
      outdoor: true,
      indoor: false
    }
  },

  "Budget Backpacker": {
    prioritize: [
      'park', 'free_museum', 'public_transport',
      'market', 'street_food', 'hostel',
      'walking_tour'
    ],
    exclude: [
      'luxury_hotel', 'spa', 'fine_dining',
      'expensive_attraction', 'private_tour'
    ],
    accommodationTypes: ['hostel', 'guesthouse', 'budget_hotel'],
    restaurantFilters: {
      priceLevel: [1], // Budget only
      cuisineTypes: ['street_food', 'local', 'budget'],
      exclude: ['fine_dining', 'luxury_restaurant']
    },
    activityFilters: {
      timeOfDay: ['morning', 'afternoon', 'evening'],
      intensity: 'medium',
      indoor: false,
      outdoor: true
    }
  },

  "Romantic Getaway": {
    prioritize: [
      'romantic_restaurant', 'spa', 'sunset_point',
      'wine_bar', 'scenic_lookout', 'luxury_hotel',
      'couples_activity', 'fine_dining'
    ],
    exclude: [
      'amusement_park', 'crowded_attraction',
      'family_activity', 'budget_accommodation'
    ],
    accommodationTypes: ['luxury_hotel', 'boutique_hotel', 'romantic_resort'],
    restaurantFilters: {
      priceLevel: [3, 4], // High-end only
      cuisineTypes: ['fine_dining', 'romantic', 'wine_pairing'],
      exclude: ['fast_food', 'casual_dining', 'family_restaurant']
    },
    activityFilters: {
      timeOfDay: ['evening', 'night'],
      intensity: 'low',
      indoor: true,
      outdoor: true
    }
  }
};

// Map Google Places API types to our internal categories
export const GOOGLE_PLACES_TYPE_MAP: Record<string, string> = {
  // Attractions
  'tourist_attraction': 'attraction',
  'museum': 'museum',
  'art_gallery': 'art_gallery', 
  'church': 'church',
  'historical_landmark': 'historical_landmark',
  'amusement_park': 'amusement_park',
  'zoo': 'zoo',
  'aquarium': 'aquarium',
  
  // Nature & Parks
  'park': 'park',
  'national_park': 'park',
  'botanical_garden': 'park',
  
  // Food & Drink
  'restaurant': 'restaurant',
  'food': 'restaurant',
  'meal_takeaway': 'restaurant',
  'cafe': 'cafe',
  'bar': 'bar',
  
  // Shopping
  'shopping_mall': 'shopping',
  'store': 'shopping',
  
  // Accommodation  
  'lodging': 'hotel',
  
  // Transport
  'transit_station': 'transport',
  'subway_station': 'transport'
};

export function getMoodFilters(moodName: string): MoodFilters | null {
  return MOOD_FILTERS[moodName] || null;
}

export function shouldShowPOI(poiType: string, moodFilters: MoodFilters): boolean {
  // Convert Google Places type to our internal type
  const internalType = GOOGLE_PLACES_TYPE_MAP[poiType] || poiType;
  
  // Exclude if in exclude list
  if (moodFilters.exclude.includes(internalType) || moodFilters.exclude.includes(poiType)) {
    return false;
  }
  
  // Prioritize if in prioritize list  
  if (moodFilters.prioritize.includes(internalType) || moodFilters.prioritize.includes(poiType)) {
    return true;
  }
  
  // Default: show POI if not specifically excluded
  return true;
}

export function filterRestaurantByMood(restaurant: any, moodFilters: MoodFilters): boolean {
  const { restaurantFilters } = moodFilters;
  
  // Check price level
  if (restaurantFilters.priceLevel && restaurant.priceLevel) {
    if (!restaurantFilters.priceLevel.includes(restaurant.priceLevel)) {
      return false;
    }
  }
  
  // Check excluded types
  if (restaurantFilters.exclude) {
    for (const excludeType of restaurantFilters.exclude) {
      if (restaurant.types?.includes(excludeType) || 
          restaurant.categories?.includes(excludeType)) {
        return false;
      }
    }
  }
  
  return true;
}

export function getMapMarkersWithMoodFilter(markers: any[], moodName: string): any[] {
  const moodFilters = getMoodFilters(moodName);
  if (!moodFilters) return markers;
  
  return markers.filter(marker => {
    // Filter by POI type
    if (!shouldShowPOI(marker.type, moodFilters)) {
      return false;
    }
    
    // Additional filtering for restaurants
    if (marker.type === 'restaurant') {
      return filterRestaurantByMood(marker, moodFilters);
    }
    
    return true;
  });
} 