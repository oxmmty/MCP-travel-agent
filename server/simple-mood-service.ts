import { db } from "./db";
import { travelMoods, chats } from "@shared/schema";
import { eq } from "drizzle-orm";

// Default travel moods with map filtering configurations
export const defaultTravelMoods = [
  {
    name: "Adventure Seeker",
    description: "For thrill-seekers who want action-packed experiences and outdoor adventures",
    icon: "🏔️",
    color: "#ef4444",
    keywords: ["adventure", "hiking", "extreme sports", "outdoor", "adrenaline", "climbing"],
    preferences: {
      activityLevel: "high",
      pacePreference: "fast",
      groupSize: "small",
      budgetRange: "moderate"
    },
    mapFilters: {
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
      priceLevel: [1, 2]
    }
  },
  {
    name: "Culture Explorer",
    description: "Deep dive into local culture, history, and authentic experiences",
    icon: "🏛️",
    color: "#8b5cf6",
    keywords: ["culture", "museums", "history", "art", "local traditions", "heritage"],
    preferences: {
      activityLevel: "moderate",
      pacePreference: "slow",
      groupSize: "medium",
      budgetRange: "moderate"
    },
    mapFilters: {
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
      priceLevel: [2, 3]
    }
  },
  {
    name: "Relaxation Retreat",
    description: "Peaceful getaway focused on wellness, spa, and rejuvenation",
    icon: "🧘‍♀️",
    color: "#10b981",
    keywords: ["relaxation", "spa", "wellness", "peaceful", "meditation", "rejuvenation"],
    preferences: {
      activityLevel: "low",
      pacePreference: "very_slow",
      groupSize: "small",
      budgetRange: "high"
    },
    mapFilters: {
      prioritize: [
        'spa', 'park', 'botanical_garden',
        'beach', 'natural_feature', 'wellness_center'
      ],
      exclude: [
        'amusement_park', 'nightclub', 'bar',
        'casino', 'tourist_attraction', 'shopping_mall'
      ],
      accommodationTypes: ['spa_resort', 'luxury_hotel', 'wellness_hotel'],
      priceLevel: [3, 4]
    }
  },
  {
    name: "Foodie Journey",
    description: "Culinary adventures with focus on local cuisine and food experiences",
    icon: "🍜",
    color: "#f59e0b",
    keywords: ["food", "cuisine", "restaurants", "cooking", "local dishes", "culinary"],
    preferences: {
      activityLevel: "moderate",
      pacePreference: "moderate",
      groupSize: "medium",
      budgetRange: "moderate"
    },
    mapFilters: {
      prioritize: [
        'restaurant', 'food', 'meal_takeaway',
        'market', 'grocery_or_supermarket', 'bakery',
        'cafe', 'cooking_school'
      ],
      exclude: [
        'fast_food', 'chain_restaurant'
      ],
      accommodationTypes: ['boutique_hotel', 'central_hotel'],
      priceLevel: [2, 3, 4]
    }
  },
  {
    name: "Urban Explorer",
    description: "City adventures with nightlife, shopping, and metropolitan experiences",
    icon: "🏙️",
    color: "#3b82f6",
    keywords: ["city", "urban", "nightlife", "shopping", "metropolitan", "modern"],
    preferences: {
      activityLevel: "high",
      pacePreference: "fast",
      groupSize: "large",
      budgetRange: "moderate"
    },
    mapFilters: {
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
      priceLevel: [2, 3, 4]
    }
  },
  {
    name: "Nature Lover",
    description: "Connect with nature through parks, wildlife, and scenic landscapes",
    icon: "🌿",
    color: "#059669",
    keywords: ["nature", "wildlife", "parks", "scenic", "landscapes", "outdoors"],
    preferences: {
      activityLevel: "moderate",
      pacePreference: "slow",
      groupSize: "small",
      budgetRange: "low"
    },
    mapFilters: {
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
      priceLevel: [1, 2]
    }
  },
  {
    name: "Budget Backpacker",
    description: "Cost-effective travel with hostels and free/cheap activities",
    icon: "🎒",
    color: "#6b7280",
    keywords: ["budget", "backpacking", "hostels", "cheap", "free activities", "student"],
    preferences: {
      activityLevel: "high",
      pacePreference: "fast",
      groupSize: "medium",
      budgetRange: "very_low"
    },
    mapFilters: {
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
      priceLevel: [1]
    }
  },
  {
    name: "Romantic Getaway",
    description: "Intimate experiences perfect for couples and romantic moments",
    icon: "💕",
    color: "#ec4899",
    keywords: ["romantic", "couples", "intimate", "sunset", "wine", "luxury"],
    preferences: {
      activityLevel: "low",
      pacePreference: "slow",
      groupSize: "couple",
      budgetRange: "high"
    },
    mapFilters: {
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
      priceLevel: [3, 4]
    }
  }
];

export async function initializeTravelMoods() {
  try {
    // Check if moods already exist
    const existingMoods = await db.select().from(travelMoods);
    
    if (existingMoods.length === 0) {
      // Insert default moods
      await db.insert(travelMoods).values(defaultTravelMoods);
      console.log('✅ Default travel moods initialized');
    } else {
      console.log('✅ Travel moods already exist');
    }
  } catch (error) {
    console.error('❌ Error initializing travel moods:', error);
  }
}

export async function getTravelMoods() {
  return await db.select().from(travelMoods);
}

export async function setChatMood(chatId: number, moodId: number) {
  try {
    await db
      .update(chats)
      .set({ 
        travelMoodId: moodId,
        moodSelectedAt: new Date()
      })
      .where(eq(chats.id, chatId));
    
    return { success: true, chatId, moodId };
  } catch (error) {
    console.error('Error setting chat mood:', error);
    throw new Error('Failed to set chat mood');
  }
}

export async function getChatMood(chatId: number) {
  try {
    const chat = await db
      .select({
        id: chats.id,
        travelMoodId: chats.travelMoodId,
        moodSelectedAt: chats.moodSelectedAt
      })
      .from(chats)
      .where(eq(chats.id, chatId))
      .limit(1);

    if (chat.length === 0 || !chat[0].travelMoodId) {
      return null;
    }

    // Get the full mood data
    const mood = await db
      .select()
      .from(travelMoods)
      .where(eq(travelMoods.id, chat[0].travelMoodId))
      .limit(1);

    if (mood.length === 0) {
      return null;
    }

    return {
      chatId,
      mood: mood[0],
      selectedAt: chat[0].moodSelectedAt
    };
  } catch (error) {
    console.error('Error getting chat mood:', error);
    return null;
  }
} 