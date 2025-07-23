import axios from 'axios';

const TRIPADVISOR_API_KEY = process.env.TRIPADVISOR_API_KEY;
const TRIPADVISOR_BASE_URL = 'https://api.content.tripadvisor.com/api/v1';

interface TripAdvisorLocation {
  location_id: string;
  name: string;
  address_obj?: {
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    country?: string;
    postalcode?: string;
    address_string?: string;
  };
  latitude?: string;
  longitude?: string;
  rating?: string;
  num_reviews?: string;
  ranking_data?: {
    ranking: string;
    ranking_string: string;
  };
  price_level?: string;
  awards?: Array<{
    award_type: string;
    year: string;
    display_name: string;
  }>;
  cuisine?: Array<{
    name: string;
  }>;
  amenities?: Array<{
    name: string;
  }>;
}

interface TripAdvisorReview {
  id: string;
  rating: number;
  title: string;
  text: string;
  published_date: string;
  user?: {
    username: string;
    user_location?: {
      name: string;
    };
  };
}

interface TripAdvisorPhoto {
  id: string;
  caption?: string;
  images: {
    thumbnail?: {
      url: string;
    };
    small?: {
      url: string;
    };
    medium?: {
      url: string;
    };
    large?: {
      url: string;
    };
  };
}

export async function searchTripAdvisorLocation(query: string, lat?: number, lng?: number): Promise<TripAdvisorLocation | null> {
  if (!TRIPADVISOR_API_KEY) {
    console.log('TripAdvisor API key not available');
    return null;
  }

  try {
    const params: any = {
      key: TRIPADVISOR_API_KEY,
      searchQuery: query,
      category: 'attractions',
      language: 'en'
    };

    if (lat && lng) {
      params.latLong = `${lat},${lng}`;
    }

    const response = await axios.get(`${TRIPADVISOR_BASE_URL}/location/search`, { params });
    
    if (response.data?.data && response.data.data.length > 0) {
      return response.data.data[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error searching TripAdvisor location:', error);
    return null;
  }
}

export async function getTripAdvisorLocationDetails(locationId: string): Promise<TripAdvisorLocation | null> {
  if (!TRIPADVISOR_API_KEY) {
    return null;
  }

  try {
    const response = await axios.get(
      `${TRIPADVISOR_BASE_URL}/location/${locationId}/details`,
      {
        params: {
          key: TRIPADVISOR_API_KEY,
          language: 'en'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error fetching TripAdvisor location details:', error);
    return null;
  }
}

export async function getTripAdvisorReviews(locationId: string): Promise<TripAdvisorReview[]> {
  if (!TRIPADVISOR_API_KEY) {
    return [];
  }

  try {
    const response = await axios.get(
      `${TRIPADVISOR_BASE_URL}/location/${locationId}/reviews`,
      {
        params: {
          key: TRIPADVISOR_API_KEY,
          language: 'en'
        }
      }
    );

    return response.data?.data || [];
  } catch (error) {
    console.error('Error fetching TripAdvisor reviews:', error);
    return [];
  }
}

export async function getTripAdvisorPhotos(locationId: string): Promise<TripAdvisorPhoto[]> {
  if (!TRIPADVISOR_API_KEY) {
    return [];
  }

  try {
    const response = await axios.get(
      `${TRIPADVISOR_BASE_URL}/location/${locationId}/photos`,
      {
        params: {
          key: TRIPADVISOR_API_KEY,
          language: 'en'
        }
      }
    );

    return response.data?.data || [];
  } catch (error) {
    console.error('Error fetching TripAdvisor photos:', error);
    return [];
  }
}

export async function getTripAdvisorNearbyLocations(locationId: string): Promise<TripAdvisorLocation[]> {
  if (!TRIPADVISOR_API_KEY) {
    return [];
  }

  try {
    const response = await axios.get(
      `${TRIPADVISOR_BASE_URL}/location/${locationId}/nearby_search`,
      {
        params: {
          key: TRIPADVISOR_API_KEY,
          language: 'en',
          category: 'attractions'
        }
      }
    );

    return response.data?.data || [];
  } catch (error) {
    console.error('Error fetching TripAdvisor nearby locations:', error);
    return [];
  }
}

export function formatTripAdvisorData(location: TripAdvisorLocation, reviews: TripAdvisorReview[], photos: TripAdvisorPhoto[]): any {
  return {
    locationId: location.location_id,
    rating: location.rating ? parseFloat(location.rating) : undefined,
    numReviews: location.num_reviews ? parseInt(location.num_reviews) : undefined,
    reviews: reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      title: review.title,
      text: review.text,
      publishedDate: review.published_date,
      user: review.user ? {
        username: review.user.username,
        userLocation: review.user.user_location?.name
      } : undefined
    })),
    photos: photos.map(photo => ({
      id: photo.id,
      caption: photo.caption,
      images: {
        thumbnail: photo.images.thumbnail?.url,
        small: photo.images.small?.url,
        medium: photo.images.medium?.url,
        large: photo.images.large?.url
      }
    })),
    awards: location.awards?.map(award => award.display_name) || [],
    amenities: location.amenities?.map(amenity => amenity.name) || [],
    cuisine: location.cuisine?.map(cuisine => cuisine.name) || [],
    priceLevel: location.price_level,
    rankingData: location.ranking_data ? {
      ranking: parseInt(location.ranking_data.ranking),
      rankingString: location.ranking_data.ranking_string
    } : undefined,
    nearby: [] // Will be populated separately
  };
}