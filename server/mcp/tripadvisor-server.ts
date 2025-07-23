// TripAdvisor MCP Server
import { BaseMCPServer } from './base-server';
import { MCPToolCall, MCPToolResult } from './types';

export class TripAdvisorMCPServer extends BaseMCPServer {
  private apiKey: string;

  constructor() {
    super("tripadvisor-server", "1.0.0");
    this.apiKey = process.env.TRIPADVISOR_API_KEY || '';
  }

  async initialize(): Promise<void> {
    // Register TripAdvisor tools
    this.registerTool({
      name: "search_location",
      description: "Search for a location on TripAdvisor to get location ID and basic info",
      inputSchema: {
        type: "object",
        properties: {
          searchQuery: {
            type: "string",
            description: "The location name to search for (e.g., 'Paris', 'Tokyo', 'New York City')"
          },
          category: {
            type: "string",
            description: "Category filter: 'hotels', 'attractions', 'restaurants', or 'geos' (locations)",
            enum: ["hotels", "attractions", "restaurants", "geos"]
          }
        },
        required: ["searchQuery"]
      }
    });

    this.registerTool({
      name: "get_location_details",
      description: "Get detailed information about a specific TripAdvisor location",
      inputSchema: {
        type: "object",
        properties: {
          locationId: {
            type: "string",
            description: "TripAdvisor location ID"
          },
          language: {
            type: "string",
            description: "Language code (e.g., 'en', 'de', 'fr', 'es')",
            default: "en"
          }
        },
        required: ["locationId"]
      }
    });

    this.registerTool({
      name: "get_location_photos",
      description: "Get photos for a TripAdvisor location",
      inputSchema: {
        type: "object",
        properties: {
          locationId: {
            type: "string",
            description: "TripAdvisor location ID"
          },
          language: {
            type: "string",
            description: "Language code (e.g., 'en', 'de', 'fr', 'es')",
            default: "en"
          }
        },
        required: ["locationId"]
      }
    });

    this.registerTool({
      name: "get_location_reviews",
      description: "Get reviews for a TripAdvisor location",
      inputSchema: {
        type: "object",
        properties: {
          locationId: {
            type: "string",
            description: "TripAdvisor location ID"
          },
          language: {
            type: "string",
            description: "Language code (e.g., 'en', 'de', 'fr', 'es')",
            default: "en"
          },
          limit: {
            type: "number",
            description: "Number of reviews to retrieve (max 20)",
            default: 5
          }
        },
        required: ["locationId"]
      }
    });

    this.registerTool({
      name: "search_nearby",
      description: "Search for nearby attractions, hotels, or restaurants",
      inputSchema: {
        type: "object",
        properties: {
          latLng: {
            type: "string",
            description: "Latitude and longitude in format 'lat,lng' (e.g., '48.8566,2.3522')"
          },
          category: {
            type: "string",
            description: "Category to search: 'hotels', 'attractions', or 'restaurants'",
            enum: ["hotels", "attractions", "restaurants"]
          },
          radius: {
            type: "number",
            description: "Search radius in kilometers (max 25)",
            default: 5
          },
          language: {
            type: "string",
            description: "Language code (e.g., 'en', 'de', 'fr', 'es')",
            default: "en"
          }
        },
        required: ["latLng", "category"]
      }
    });
  }

  async executeTool(call: MCPToolCall): Promise<MCPToolResult> {
    const tool = this.tools.get(call.name);
    if (!tool) {
      throw this.createError(-32601, `Tool not found: ${call.name}`);
    }

    this.validateToolArguments(tool, call.arguments);

    if (!this.apiKey) {
      return {
        content: [{
          type: "text",
          text: "TripAdvisor API key is not configured. Please set TRIPADVISOR_API_KEY environment variable."
        }],
        isError: true
      };
    }

    try {
      switch (call.name) {
        case "search_location":
          return await this.handleSearchLocation(call.arguments as { searchQuery: string; category?: string });
        
        case "get_location_details":
          return await this.handleGetLocationDetails(call.arguments as { locationId: string; language?: string });
        
        case "get_location_photos":
          return await this.handleGetLocationPhotos(call.arguments as { locationId: string; language?: string });
        
        case "get_location_reviews":
          return await this.handleGetLocationReviews(call.arguments as { locationId: string; language?: string; limit?: number });
        
        case "search_nearby":
          return await this.handleSearchNearby(call.arguments as { latLng: string; category: string; radius?: number; language?: string });

        default:
          throw this.createError(-32601, `Unknown tool: ${call.name}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        content: [{
          type: "text",
          text: `Error executing ${call.name}: ${errorMessage}`
        }],
        isError: true
      };
    }
  }

  private async makeApiRequest(endpoint: string, params: Record<string, string> = {}): Promise<any> {
    const url = new URL(`https://api.content.tripadvisor.com/api/v1/${endpoint}`);
    
    // Add API key and default parameters
    url.searchParams.append('key', this.apiKey);
    
    // Add custom parameters
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`TripAdvisor API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  private async handleSearchLocation(args: { searchQuery: string; category?: string }): Promise<MCPToolResult> {
    const params: Record<string, string> = {
      searchQuery: args.searchQuery,
      language: 'en'
    };

    if (args.category) {
      params.category = args.category;
    }

    const result = await this.makeApiRequest('location/search', params);

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          searchQuery: args.searchQuery,
          results: result.data?.map((location: any) => ({
            locationId: location.location_id,
            name: location.name,
            address: location.address_obj?.address_string || '',
            category: location.category?.name || '',
            subcategory: location.subcategory?.map((sc: any) => sc.name) || [],
            coordinates: location.latitude && location.longitude ? {
              lat: parseFloat(location.latitude),
              lng: parseFloat(location.longitude)
            } : null,
            rating: location.rating,
            numReviews: location.num_reviews,
            priceLevel: location.price_level,
            rankingData: location.ranking_data
          })) || []
        }, null, 2)
      }],
      isError: false
    };
  }

  private async handleGetLocationDetails(args: { locationId: string; language?: string }): Promise<MCPToolResult> {
    const params: Record<string, string> = {
      language: args.language || 'en'
    };

    const result = await this.makeApiRequest(`location/${args.locationId}/details`, params);

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          locationId: args.locationId,
          details: {
            name: result.name,
            description: result.description,
            address: result.address_obj?.address_string || '',
            phone: result.phone,
            website: result.website,
            email: result.email,
            coordinates: result.latitude && result.longitude ? {
              lat: parseFloat(result.latitude),
              lng: parseFloat(result.longitude)
            } : null,
            rating: result.rating,
            numReviews: result.num_reviews,
            priceLevel: result.price_level,
            rankingData: result.ranking_data,
            awards: result.awards || [],
            amenities: result.amenities || [],
            category: result.category?.name || '',
            subcategory: result.subcategory?.map((sc: any) => sc.name) || [],
            hours: result.hours,
            cuisine: result.cuisine?.map((c: any) => c.name) || []
          }
        }, null, 2)
      }],
      isError: false
    };
  }

  private async handleGetLocationPhotos(args: { locationId: string; language?: string }): Promise<MCPToolResult> {
    const params: Record<string, string> = {
      language: args.language || 'en'
    };

    const result = await this.makeApiRequest(`location/${args.locationId}/photos`, params);

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          locationId: args.locationId,
          photos: result.data?.map((photo: any) => ({
            id: photo.id,
            caption: photo.caption,
            publishedDate: photo.published_date,
            images: {
              thumbnail: photo.images?.thumbnail?.url,
              small: photo.images?.small?.url,
              medium: photo.images?.medium?.url,
              large: photo.images?.large?.url,
              original: photo.images?.original?.url
            },
            user: photo.user ? {
              username: photo.user.username,
              userLocation: photo.user.user_location?.name
            } : null
          })) || []
        }, null, 2)
      }],
      isError: false
    };
  }

  private async handleGetLocationReviews(args: { locationId: string; language?: string; limit?: number }): Promise<MCPToolResult> {
    const params: Record<string, string> = {
      language: args.language || 'en',
      limit: String(Math.min(args.limit || 5, 20))
    };

    const result = await this.makeApiRequest(`location/${args.locationId}/reviews`, params);

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          locationId: args.locationId,
          reviews: result.data?.map((review: any) => ({
            id: review.id,
            rating: review.rating,
            title: review.title,
            text: review.text,
            publishedDate: review.published_date,
            travelDate: review.travel_date,
            user: review.user ? {
              username: review.user.username,
              userLocation: review.user.user_location?.name,
              avatar: review.user.avatar?.large
            } : null,
            helpful: review.helpful_votes,
            language: review.language,
            subratings: review.subratings || {}
          })) || []
        }, null, 2)
      }],
      isError: false
    };
  }

  private async handleSearchNearby(args: { latLng: string; category: string; radius?: number; language?: string }): Promise<MCPToolResult> {
    const params: Record<string, string> = {
      latLng: args.latLng,
      category: args.category,
      radius: String(Math.min(args.radius || 5, 25)),
      radiusUnit: 'km',
      language: args.language || 'en'
    };

    const result = await this.makeApiRequest('location/nearby_search', params);

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          searchParams: {
            coordinates: args.latLng,
            category: args.category,
            radius: args.radius || 5
          },
          results: result.data?.map((location: any) => ({
            locationId: location.location_id,
            name: location.name,
            address: location.address_obj?.address_string || '',
            distance: location.distance,
            distanceString: location.distance_string,
            bearing: location.bearing,
            coordinates: location.latitude && location.longitude ? {
              lat: parseFloat(location.latitude),
              lng: parseFloat(location.longitude)
            } : null,
            rating: location.rating,
            numReviews: location.num_reviews,
            priceLevel: location.price_level,
            category: location.category?.name || '',
            subcategory: location.subcategory?.map((sc: any) => sc.name) || [],
            rankingData: location.ranking_data
          })) || []
        }, null, 2)
      }],
      isError: false
    };
  }
}