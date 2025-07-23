// Google Maps MCP Server
import { BaseMCPServer } from './base-server';
import { MCPToolCall, MCPToolResult } from './types';
import { 
  searchDestination, 
  findNearbyHotels, 
  findNearbyAttractions, 
  findNearbyRestaurants,
  getPlaceDetails 
} from '../google-maps';

export class GoogleMapsMCPServer extends BaseMCPServer {
  constructor() {
    super("google-maps-server", "1.0.0");
  }

  async initialize(): Promise<void> {
    // Register all Google Maps tools
    this.registerTool({
      name: "search_destination",
      description: "Search for a destination location using Google Maps",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The destination name or address to search for"
          }
        },
        required: ["query"]
      }
    });

    this.registerTool({
      name: "find_nearby_hotels",
      description: "Find hotels near a specific location",
      inputSchema: {
        type: "object",
        properties: {
          lat: {
            type: "number",
            description: "Latitude of the location"
          },
          lng: {
            type: "number", 
            description: "Longitude of the location"
          },
          radius: {
            type: "number",
            description: "Search radius in meters (default: 10000)"
          }
        },
        required: ["lat", "lng"]
      }
    });

    this.registerTool({
      name: "find_nearby_attractions",
      description: "Find tourist attractions near a specific location",
      inputSchema: {
        type: "object",
        properties: {
          lat: {
            type: "number",
            description: "Latitude of the location"
          },
          lng: {
            type: "number",
            description: "Longitude of the location"
          },
          radius: {
            type: "number",
            description: "Search radius in meters (default: 25000)"
          }
        },
        required: ["lat", "lng"]
      }
    });

    this.registerTool({
      name: "find_nearby_restaurants",
      description: "Find restaurants near a specific location",
      inputSchema: {
        type: "object",
        properties: {
          lat: {
            type: "number",
            description: "Latitude of the location"
          },
          lng: {
            type: "number",
            description: "Longitude of the location"
          },
          radius: {
            type: "number",
            description: "Search radius in meters (default: 5000)"
          }
        },
        required: ["lat", "lng"]
      }
    });

    this.registerTool({
      name: "get_place_details",
      description: "Get detailed information about a specific place",
      inputSchema: {
        type: "object",
        properties: {
          placeId: {
            type: "string",
            description: "Google Places ID of the location"
          }
        },
        required: ["placeId"]
      }
    });
  }

  async executeTool(call: MCPToolCall): Promise<MCPToolResult> {
    const tool = this.tools.get(call.name);
    if (!tool) {
      throw this.createError(-32601, `Tool not found: ${call.name}`);
    }

    this.validateToolArguments(tool, call.arguments);

    try {
      switch (call.name) {
        case "search_destination":
          return await this.handleSearchDestination(call.arguments as { query: string });
        
        case "find_nearby_hotels":
          return await this.handleFindNearbyHotels(call.arguments as { lat: number; lng: number; radius?: number });
        
        case "find_nearby_attractions":
          return await this.handleFindNearbyAttractions(call.arguments as { lat: number; lng: number; radius?: number });
        
        case "find_nearby_restaurants":
          return await this.handleFindNearbyRestaurants(call.arguments as { lat: number; lng: number; radius?: number });
        
        case "get_place_details":
          return await this.handleGetPlaceDetails(call.arguments as { placeId: string });

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

  private async handleSearchDestination(args: { query: string }): Promise<MCPToolResult> {
    const result = await searchDestination(args.query);
    
    if (!result) {
      return {
        content: [{
          type: "text",
          text: `No destination found for query: ${args.query}`
        }],
        isError: false
      };
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          name: result.name,
          placeId: result.placeId,
          address: result.address,
          location: result.location,
          rating: result.rating,
          types: result.types
        }, null, 2)
      }],
      isError: false
    };
  }

  private async handleFindNearbyHotels(args: { lat: number; lng: number; radius?: number }): Promise<MCPToolResult> {
    const hotels = await findNearbyHotels(
      { lat: args.lat, lng: args.lng }, 
      args.radius || 10000
    );

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          count: hotels.length,
          hotels: hotels.map(hotel => ({
            name: hotel.name,
            placeId: hotel.placeId,
            address: hotel.address,
            location: hotel.location,
            rating: hotel.rating,
            priceLevel: hotel.priceLevel,
            pricePerNight: hotel.pricePerNight
          }))
        }, null, 2)
      }],
      isError: false
    };
  }

  private async handleFindNearbyAttractions(args: { lat: number; lng: number; radius?: number }): Promise<MCPToolResult> {
    const attractions = await findNearbyAttractions(
      { lat: args.lat, lng: args.lng }, 
      args.radius || 25000
    );

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          count: attractions.length,
          attractions: attractions.map(attraction => ({
            name: attraction.name,
            placeId: attraction.placeId,
            address: attraction.address,
            location: attraction.location,
            rating: attraction.rating,
            category: attraction.category,
            types: attraction.types
          }))
        }, null, 2)
      }],
      isError: false
    };
  }

  private async handleFindNearbyRestaurants(args: { lat: number; lng: number; radius?: number }): Promise<MCPToolResult> {
    const restaurants = await findNearbyRestaurants(
      { lat: args.lat, lng: args.lng }, 
      args.radius || 5000
    );

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          count: restaurants.length,
          restaurants: restaurants.map(restaurant => ({
            name: restaurant.name,
            placeId: restaurant.placeId,
            address: restaurant.address,
            location: restaurant.location,
            rating: restaurant.rating,
            priceLevel: restaurant.priceLevel,
            types: restaurant.types
          }))
        }, null, 2)
      }],
      isError: false
    };
  }

  private async handleGetPlaceDetails(args: { placeId: string }): Promise<MCPToolResult> {
    const details = await getPlaceDetails(args.placeId);

    return {
      content: [{
        type: "text",
        text: JSON.stringify(details, null, 2)
      }],
      isError: false
    };
  }
}