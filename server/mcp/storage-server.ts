// Storage MCP Server for Travel Data
import { BaseMCPServer } from './base-server';
import { MCPToolCall, MCPToolResult } from './types';
import { storage } from '../storage';

export class StorageMCPServer extends BaseMCPServer {
  constructor() {
    super("storage-server", "1.0.0");
  }

  async initialize(): Promise<void> {
    // Register storage tools
    this.registerTool({
      name: "save_destination",
      description: "Save a destination to the database",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Destination name" },
          country: { type: "string", description: "Country name" },
          latitude: { type: "number", description: "Latitude coordinate" },
          longitude: { type: "number", description: "Longitude coordinate" },
          description: { type: "string", description: "Destination description" }
        },
        required: ["name", "country", "latitude", "longitude"]
      }
    });

    this.registerTool({
      name: "save_hotel",
      description: "Save a hotel to the database",
      inputSchema: {
        type: "object",
        properties: {
          destinationId: { type: "number", description: "ID of the destination" },
          name: { type: "string", description: "Hotel name" },
          address: { type: "string", description: "Hotel address" },
          latitude: { type: "number", description: "Latitude coordinate" },
          longitude: { type: "number", description: "Longitude coordinate" },
          rating: { type: "number", description: "Hotel rating" },
          pricePerNight: { type: "number", description: "Price per night" },
          imageUrl: { type: "string", description: "Hotel image URL" },
          description: { type: "string", description: "Hotel description" }
        },
        required: ["destinationId", "name", "address", "latitude", "longitude"]
      }
    });

    this.registerTool({
      name: "save_attraction",
      description: "Save an attraction to the database",
      inputSchema: {
        type: "object",
        properties: {
          destinationId: { type: "number", description: "ID of the destination" },
          name: { type: "string", description: "Attraction name" },
          address: { type: "string", description: "Attraction address" },
          latitude: { type: "number", description: "Latitude coordinate" },
          longitude: { type: "number", description: "Longitude coordinate" },
          rating: { type: "number", description: "Attraction rating" },
          category: { type: "string", description: "Attraction category" },
          imageUrl: { type: "string", description: "Attraction image URL" },
          description: { type: "string", description: "Attraction description" }
        },
        required: ["destinationId", "name", "address", "latitude", "longitude", "category"]
      }
    });

    this.registerTool({
      name: "add_to_favorites",
      description: "Add an item to user favorites",
      inputSchema: {
        type: "object",
        properties: {
          userId: { type: "number", description: "User ID" },
          itemId: { type: "string", description: "Item ID (hotel/attraction)" },
          itemType: { type: "string", description: "Type of item (hotel/attraction)" },
          itemName: { type: "string", description: "Name of the item" }
        },
        required: ["userId", "itemId", "itemType", "itemName"]
      }
    });

    this.registerTool({
      name: "add_to_itinerary",
      description: "Add an item to chat itinerary",
      inputSchema: {
        type: "object",
        properties: {
          chatId: { type: "number", description: "Chat ID" },
          day: { type: "number", description: "Day number" },
          time: { type: "string", description: "Time (e.g., '09:00')" },
          title: { type: "string", description: "Activity title" },
          description: { type: "string", description: "Activity description" },
          location: { type: "string", description: "Location address" },
          duration: { type: "string", description: "Duration (optional)" },
          cost: { type: "string", description: "Cost (optional)" }
        },
        required: ["chatId", "day", "time", "title", "description", "location"]
      }
    });

    this.registerTool({
      name: "get_destination_data",
      description: "Get complete destination data including hotels and attractions",
      inputSchema: {
        type: "object",
        properties: {
          destinationName: { type: "string", description: "Name of the destination" }
        },
        required: ["destinationName"]
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
        case "save_destination":
          return await this.handleSaveDestination(call.arguments);
        case "save_hotel":
          return await this.handleSaveHotel(call.arguments);
        case "save_attraction":
          return await this.handleSaveAttraction(call.arguments);
        case "add_to_favorites":
          return await this.handleAddToFavorites(call.arguments);
        case "add_to_itinerary":
          return await this.handleAddToItinerary(call.arguments);
        case "get_destination_data":
          return await this.handleGetDestinationData(call.arguments as { destinationName: string });
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

  private async handleSaveDestination(args: any): Promise<MCPToolResult> {
    const destination = await storage.createDestination({
      name: args.name,
      country: args.country,
      description: args.description || '',
      coordinates: { lat: args.latitude, lng: args.longitude }
    });

    return {
      content: [{
        type: "text",
        text: JSON.stringify({ success: true, destination }, null, 2)
      }],
      isError: false
    };
  }

  private async handleSaveHotel(args: any): Promise<MCPToolResult> {
    const hotel = await storage.createHotel({
      destinationId: args.destinationId,
      name: args.name,
      description: args.description || '',
      rating: args.rating || 0,
      pricePerNight: args.pricePerNight || 0,
      imageUrl: args.imageUrl,
      coordinates: { lat: args.latitude, lng: args.longitude, address: args.address }
    });

    return {
      content: [{
        type: "text",
        text: JSON.stringify({ success: true, hotel }, null, 2)
      }],
      isError: false
    };
  }

  private async handleSaveAttraction(args: any): Promise<MCPToolResult> {
    const attraction = await storage.createAttraction({
      destinationId: args.destinationId,
      name: args.name,
      address: args.address,
      latitude: args.latitude,
      longitude: args.longitude,
      rating: args.rating,
      category: args.category,
      imageUrl: args.imageUrl,
      description: args.description
    });

    return {
      content: [{
        type: "text",
        text: JSON.stringify({ success: true, attraction }, null, 2)
      }],
      isError: false
    };
  }

  private async handleAddToFavorites(args: any): Promise<MCPToolResult> {
    const favorite = await storage.createFavorite({
      userId: args.userId,
      itemId: args.itemId,
      itemType: args.itemType,
      itemName: args.itemName
    });

    return {
      content: [{
        type: "text",
        text: JSON.stringify({ success: true, favorite }, null, 2)
      }],
      isError: false
    };
  }

  private async handleAddToItinerary(args: any): Promise<MCPToolResult> {
    const item = await storage.createItineraryItem({
      chatId: args.chatId,
      day: args.day,
      time: args.time,
      title: args.title,
      description: args.description,
      location: args.location,
      duration: args.duration,
      cost: args.cost
    });

    return {
      content: [{
        type: "text",
        text: JSON.stringify({ success: true, item }, null, 2)
      }],
      isError: false
    };
  }

  private async handleGetDestinationData(args: { destinationName: string }): Promise<MCPToolResult> {
    const destination = await storage.getDestinationByName(args.destinationName);
    
    if (!destination) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ found: false, message: `Destination '${args.destinationName}' not found` })
        }],
        isError: false
      };
    }

    const hotels = await storage.getDestinationHotels(destination.id);
    const attractions = await storage.getDestinationAttractions(destination.id);

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          destination,
          hotels,
          attractions,
          summary: {
            hotelCount: hotels.length,
            attractionCount: attractions.length
          }
        }, null, 2)
      }],
      isError: false
    };
  }
}