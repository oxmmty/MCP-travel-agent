import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertMessageSchema } from "@shared/schema";
import { getChatCompletion, analyzeDestinationContext, extractTravelRecommendations } from "./openai";
import { getChatCompletionWithMCP } from "./mcp/openai-mcp";
import { findNearbyAttractions, findNearbyRestaurants, findNearbyShopping, findNearbyParks, findNearbyCafes, findNearbyTransport, searchDestination, getPlaceDetails, searchFamousAttraction, calculateDistance, formatDistance } from "./google-maps";
import { searchLiteAPIHotels } from "./liteapi-hotels";
import { searchTripAdvisorLocation, getTripAdvisorLocationDetails, getTripAdvisorReviews, getTripAdvisorPhotos, getTripAdvisorNearbyLocations, formatTripAdvisorData } from "./tripadvisor";
import { insertFavoriteSchema, insertItineraryItemSchema } from "@shared/schema";
import { registerLiteApiRoutes } from "./liteapi-routes";
import { registerSimpleLiteApiRoutes } from "./liteapi-simple";
import { registerTestHotelRoutes } from "./test-hotel-booking";
import { registerLiteApiCheckoutRoutes } from "./liteapi-checkout";
import { registerSocialMediaRoutes } from "./social-media-routes";
import { registerUnsplashRoutes } from "./unsplash-routes";
import { initializeTravelMoods, getTravelMoods, setChatMood, getChatMood } from "./simple-mood-service";
import authRoutes from "./auth-routes";
import { authenticateToken } from "./auth-routes";
import { cacheService, getCachedDestination, getCachedPlaceByPlaceId } from "./cache-service";


// Helper function to check if chat has existing destination context
async function checkExistingDestinationContext(chatId: number) {
  try {
    const messages = await storage.getChatMessages(chatId);
    
    // Look for the most recent message with destination metadata
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message.metadata && message.metadata.destinationRequested) {
        return {
          destination: message.metadata.destinationRequested,
          country: message.metadata.country
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error checking existing destination context:", error);
    return null;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Register authentication routes
  app.use('/api/auth', authRoutes);

  // Register Social Media routes for TikTok and Instagram integration
  registerSocialMediaRoutes(app);
  
  // Register Unsplash routes for travel photography
  registerUnsplashRoutes(app);
  
  // Initialize travel moods on startup
  await initializeTravelMoods();
  
  // Register working LiteAPI routes for hotel booking monetization
  registerSimpleLiteApiRoutes(app);
  registerLiteApiCheckoutRoutes(app);
  
  // Register official LiteAPI implementation
  const { registerOfficialLiteApiRoutes } = await import('./liteapi-official.js');
  registerOfficialLiteApiRoutes(app);
  
  // Register sandbox test routes
  const { registerSandboxTestRoutes } = await import('./test-liteapi-sandbox.js');
  registerSandboxTestRoutes(app);

  // Register cache management and monitoring routes
  registerCacheRoutes(app);

  // LiteAPI Map Widget endpoint
  app.get('/api/liteapi/map-widget-url', (req: Request, res: Response) => {
    const {
      latitude,
      longitude,
      checkin,
      checkout,
      adults = 2,
      radius = 10,
      currency = 'EUR',
      language = 'de'
    } = req.query;

    // Generate LiteAPI Map Widget URL based on official documentation
    const widgetUrl = `https://widget.liteapi.travel/map?` + new URLSearchParams({
      api_key: process.env.LITEAPI_PUBLIC_KEY || '',
      latitude: latitude as string,
      longitude: longitude as string,
      ...(checkin && { checkin: checkin as string }),
      ...(checkout && { checkout: checkout as string }),
      adults: adults as string,
      radius: radius as string,
      currency: currency as string,
      language: language as string,
      theme: 'light'
    }).toString();

    res.json({
      success: true,
      widgetUrl,
      iframeUrl: widgetUrl + '&embed=true'
    });
  });
  
  // Direct LiteAPI booking implementation (corrected)
  app.post('/api/liteapi/book-direct', async (req: Request, res: Response) => {
    try {
      const {
        offerId,
        checkin,
        checkout, 
        adults,
        hotelId,
        firstName,
        lastName,
        email,
        phone,
        environment = 'sandbox'
      } = req.body;

      console.log('📦 Direct LiteAPI Book Request:', {
        offerId: offerId?.substring(0, 20) + '...',
        checkin,
        checkout,
        adults,
        hotelId,
        guestName: `${firstName} ${lastName}`
      });

      // Use the same API keys as the working implementation
      const apiKey = environment === 'sandbox' 
        ? process.env.LITEAPI_SANDBOX_API_KEY 
        : process.env.LITEAPI_PROD_API_KEY;
      
      // Fallback to private key if sandbox/prod keys not available
      const effectiveApiKey = apiKey || process.env.LITEAPI_PRIVATE_KEY;

      if (!effectiveApiKey) {
        return res.status(400).json({ 
          error: `Missing ${environment} API key` 
        });
      }

      // Step 1: Prebook the rate
      const prebookResponse = await fetch('https://api.liteapi.travel/v3.0/rates/prebook', {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          offerId: offerId,
          checkin: checkin,
          checkout: checkout,
          occupancies: [{ adults: adults }],
          guestNationality: 'DE'
        })
      });

      if (!prebookResponse.ok) {
        const errorData = await prebookResponse.text();
        console.error('❌ Prebook failed:', prebookResponse.status, errorData);
        return res.status(400).json({
          error: 'Prebook failed',
          status: prebookResponse.status,
          details: errorData
        });
      }

      const prebookData = await prebookResponse.json();
      console.log('✅ Prebook success, prebookId:', prebookData.data?.prebookId);

      if (!prebookData.data?.prebookId) {
        return res.status(400).json({
          error: 'Prebook failed - no prebookId received',
          details: prebookData
        });
      }

      // Step 2: Complete the booking
      const bookingResponse = await fetch(`https://api.liteapi.travel/v3.0/rates/book/${prebookData.data.prebookId}`, {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transactionId: `TX-DIRECT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          guests: [
            {
              firstName: firstName,
              lastName: lastName,
              email: email,
              phone: phone || '+49123456789',
              occupancyNumber: 1
            }
          ]
        })
      });

      const bookingStatus = bookingResponse.status;
      console.log('📋 Direct booking response status:', bookingStatus);

      if (bookingStatus === 200) {
        const bookingData = {
          bookingId: `DIRECT-${Date.now()}`,
          confirmationNumber: `CONF-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
          status: 'confirmed',
          totalPrice: prebookData.data.price || 0,
          currency: prebookData.data.currency || 'EUR',
          commission: prebookData.data.commission || 0
        };

        // Save booking to database
        const { db } = await import('./db.js');
        const { hotelBookings } = await import('../shared/schema.js');
        
        const savedBooking = await db.insert(hotelBookings).values({
          liteApiBookingId: bookingData.bookingId,
          liteApiHotelId: hotelId,
          confirmationNumber: bookingData.confirmationNumber,
          status: bookingData.status,
          hotelName: 'Munich Hotel',
          hotelAddress: 'Munich, Germany',
          checkInDate: checkin,
          checkOutDate: checkout,
          totalPrice: bookingData.totalPrice.toString(),
          currency: bookingData.currency,
          commission: bookingData.commission.toString(),
          commissionPercentage: '5.66',
          guestDetails: {
            firstName,
            lastName,
            email,
            phone: phone || '+49123456789',
            nationality: 'DE'
          },
          roomDetails: {
            adults: adults,
            children: 0,
            roomType: 'Standard Room'
          },
          paymentMethod: 'credit_card',
          paymentStatus: 'confirmed',
          metadata: {
            directAPI: true,
            prebookId: prebookData.data.prebookId
          }
        }).returning();

        console.log('💾 Direct booking saved to database:', savedBooking[0]?.id);

        res.json({
          success: true,
          booking: bookingData,
          method: 'direct_api',
          guestName: `${firstName} ${lastName}`,
          prebookId: prebookData.data.prebookId
        });

      } else {
        const errorData = await bookingResponse.text();
        console.error('❌ Direct booking failed:', bookingStatus, errorData);
        res.status(400).json({
          error: 'Direct booking failed',
          status: bookingStatus,
          details: errorData
        });
      }

    } catch (error: any) {
      console.error('❌ Direct LiteAPI booking error:', error);
      res.status(500).json({
        error: 'Direct booking failed',
        message: error.message
      });
    }
  });

  // Get user by ID
  app.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Don't return password in response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Get user chats
  app.get("/api/chats", authenticateToken, async (req, res) => {
    try {
      const user = (req as any).user;
      const chats = await storage.getUserChats(user.id);
      res.json(chats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch chats" });
    }
  });

  // Create new chat
  app.post("/api/chats", authenticateToken, async (req, res) => {
    try {
      const { title, language = "en" } = req.body;
      const user = (req as any).user;

      const chat = await storage.createChat({
        userId: user.id,
        title: title || "New Trip",
        language
      });

      res.json(chat);
    } catch (error) {
      res.status(500).json({ error: "Failed to create chat" });
    }
  });

  // Get specific chat details
  app.get("/api/chats/:chatId", authenticateToken, async (req, res) => {
    try {
      const chatId = parseInt(req.params.chatId);
      if (isNaN(chatId)) {
        return res.status(400).json({ error: "Invalid chat ID" });
      }

      const user = (req as any).user;
      const chat = await storage.getChat(chatId);
      if (!chat) {
        return res.status(404).json({ error: "Chat not found" });
      }

      // Ensure user owns this chat
      if (chat.userId !== user.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      res.json(chat);
    } catch (error) {
      console.error("Error fetching chat:", error);
      res.status(500).json({ error: "Failed to fetch chat" });
    }
  });

  // Get chat messages
  app.get("/api/chats/:chatId/messages", authenticateToken, async (req, res) => {
    try {
      const chatId = parseInt(req.params.chatId);
      if (isNaN(chatId)) {
        return res.status(400).json({ error: "Invalid chat ID" });
      }

      const user = (req as any).user;
      const chat = await storage.getChat(chatId);
      if (!chat) {
        return res.status(404).json({ error: "Chat not found" });
      }

      // Ensure user owns this chat
      if (chat.userId !== user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const messages = await storage.getChatMessages(chatId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Load destination data asynchronously (called separately from chat)
  app.post("/api/destinations/load-data", authenticateToken, async (req, res) => {
    try {
      const { destinationName, language = "en" } = req.body;
      
      if (!destinationName) {
        return res.status(400).json({ error: "Destination name is required" });
      }

      const startTime = Date.now();
      console.log(`[LoadData] Loading full data for: ${destinationName}`);
      
      // Import Google Maps functions
      const { searchDestination, findNearbyHotels, findNearbyAttractions, getSearchRadius } = await import("./google-maps");
      
      // Check if we already have data for this destination
      const user = (req as any).user;
      let destination = await storage.getDestinationByName(destinationName, user?.id);
      
      if (destination) {
        // If destination exists, check if we already have hotels and attractions
        const [existingHotels, existingAttractions] = await Promise.all([
          storage.getDestinationHotels(destination.id, user?.id),
          storage.getDestinationAttractions(destination.id, user?.id)
        ]);
        
        if (existingHotels.length > 0 && existingAttractions.length > 0) {
          console.log(`[LoadData] Using cached data: ${existingHotels.length} hotels, ${existingAttractions.length} attractions`);
          return res.json({
            destination,
            hotels: existingHotels,
            attractions: existingAttractions,
            itinerary: null,
            showItineraryInChat: false
          });
        }
      }
      
      // If no cached data, fetch from Google Maps
      const destinationInfo = await searchDestination(destinationName);
      
      if (!destinationInfo) {
        return res.status(404).json({ error: "Destination not found" });
      }

      // Create destination if it doesn't exist
      if (!destination) {
        destination = await storage.createDestination({
          name: destinationInfo.name,
          country: "Unknown",
          description: `${destinationInfo.name} - ${destinationInfo.address}`,
          imageUrl: destinationInfo.photos?.[0] || null,
          coordinates: destinationInfo.location,
          userId: user?.id
        });
      }
      
      // Get nearby POIs with intelligent radius
      const hotelRadius = getSearchRadius(destination.name, 'hotels');
      const attractionRadius = getSearchRadius(destination.name, 'attractions');
      
      const [hotels, attractions] = await Promise.all([
        findNearbyHotels(destinationInfo.location, hotelRadius),
        findNearbyAttractions(destinationInfo.location, attractionRadius)
      ]);
      
      // Limit results for better performance
      const limitedHotels = hotels.slice(0, 15); // Max 15 hotels
      const limitedAttractions = attractions.slice(0, 25); // Max 25 attractions
      
      // Store hotels and attractions in parallel for maximum speed
      const hotelPromises = limitedHotels.map(hotel => 
        storage.createHotel({
          destinationId: destination.id,
          name: hotel.name,
          description: hotel.vicinity || `Hotel in ${destination.name}`,
          pricePerNight: hotel.pricePerNight || 120,
          rating: Math.round(parseFloat(hotel.rating) || 4),
          imageUrl: hotel.photos?.[0] || null,
          coordinates: hotel.location,
          userId: user?.id
        })
      );
      
      const attractionPromises = limitedAttractions.map(attraction => 
        storage.createAttraction({
          destinationId: destination.id,
          name: attraction.name,
          description: attraction.vicinity || `Attraction in ${destination.name}`,
          category: attraction.category || 'attraction',
          rating: Math.round(parseFloat(attraction.rating) || 4),
          imageUrl: attraction.photos?.[0] || null,
          coordinates: attraction.location,
          userId: user?.id
        })
      );
      
      // Execute all database operations in parallel
      const [storedHotels, storedAttractions] = await Promise.all([
        Promise.all(hotelPromises),
        Promise.all(attractionPromises)
      ]);
      
      const fullMetadata = {
        destination,
        hotels: storedHotels,
        attractions: storedAttractions,
        itinerary: null,
        showItineraryInChat: false
      };
      
      const endTime = Date.now();
      console.log(`[LoadData] Loaded ${storedHotels.length} hotels and ${storedAttractions.length} attractions in ${endTime - startTime}ms`);
      res.json(fullMetadata);
      
    } catch (error) {
      console.error("Error loading destination data:", error);
      res.status(500).json({ error: "Failed to load destination data" });
    }
  });

  // Send message and get AI response
  app.post("/api/chats/:chatId/messages", authenticateToken, async (req, res) => {
    try {
      const chatId = parseInt(req.params.chatId);
      if (isNaN(chatId)) {
        return res.status(400).json({ error: "Invalid chat ID" });
      }

      const user = (req as any).user;
      
      // Ensure user owns this chat
      const chat = await storage.getChat(chatId);
      if (!chat || chat.userId !== user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const { content, language = "en" } = req.body;
      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: "Message content is required" });
      }

      // Save user message
      const userMessage = await storage.createMessage({
        chatId,
        role: "user",
        content: content.trim()
      });

      // Get chat history for context
      const messages = await storage.getChatMessages(chatId);

      // Get AI response using MCP (Model Context Protocol)
      const aiResponse = await getChatCompletionWithMCP(messages, language);

      // Basic destination context analysis (no external API calls for initial response)
      let metadata = null;
      const destinationContext = await analyzeDestinationContext(content, language);
      
      if (destinationContext && destinationContext.hasDestination && destinationContext.destination) {
        console.log(`[Routes] Found destination in message: ${destinationContext.destination}`);
        
        // For initial response: only set basic metadata flag
        // External API calls will be triggered separately when user requests more details
        metadata = {
          destinationRequested: destinationContext.destination,
          country: destinationContext.country || null,
          needsMapData: true, // Flag to trigger async data loading
          showItineraryInChat: false
        };
      }

      // Check if AI response contains travel recommendations for existing destinations
      let enhancedMetadata = metadata;
      const existingChatContext = await checkExistingDestinationContext(chatId);
      
      if (existingChatContext && existingChatContext.destination) {
        console.log(`[Routes] Checking AI response for recommendations for destination: ${existingChatContext.destination}`);
        
        const recommendations = await extractTravelRecommendations(aiResponse, existingChatContext.destination, language);
        
        if (recommendations.hasRecommendations) {
          console.log(`[Routes] Found ${recommendations.recommendations.length} travel recommendations in AI response`);
          
          enhancedMetadata = {
            ...enhancedMetadata,
            travelRecommendations: recommendations.recommendations,
            destinationForRecommendations: existingChatContext.destination,
            needsMapUpdate: true
          };
        }
      }

      // Save AI message
      const aiMessage = await storage.createMessage({
        chatId,
        role: "assistant",
        content: aiResponse,
        metadata: enhancedMetadata
      });

      // Update chat title if this is the first exchange
      const allMessages = await storage.getChatMessages(chatId);
      if (allMessages.length === 2) {
        const title = content.length > 50 ? content.substring(0, 47) + "..." : content;
        await storage.updateChat(chatId, { title });
      }

      res.json({ userMessage, aiMessage });
    } catch (error) {
      console.error("Error in chat:", error);
      res.status(500).json({ error: "Failed to process message" });
    }
  });

  // Stream AI response for better UX
  app.post("/api/chats/:chatId/messages/stream", authenticateToken, async (req, res) => {
    try {
      const chatId = parseInt(req.params.chatId);
      if (isNaN(chatId)) {
        return res.status(400).json({ error: "Invalid chat ID" });
      }

      const user = (req as any).user;
      
      // Ensure user owns this chat
      const chat = await storage.getChat(chatId);
      if (!chat || chat.userId !== user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const { content, language = "en" } = req.body;
      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: "Message content is required" });
      }

      // Set up SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      // Save user message immediately
      const userMessage = await storage.createMessage({
        chatId,
        role: "user",
        content: content.trim()
      });

      // Send user message first
      res.write(`data: ${JSON.stringify({ 
        type: 'userMessage', 
        message: userMessage 
      })}\n\n`);

      // Get chat history for context
      const messages = await storage.getChatMessages(chatId);

      // Start parallel data processing
      const destinationContext = analyzeDestinationContext(content, language);
      
      let streamingResponse = "";
      let aiMessageId: number | null = null;

      // Stream AI response using the new streaming function
      const { getChatCompletionStream } = await import('./openai');
      
      const fullAiResponse = await getChatCompletionStream(messages, language, (chunk: string) => {
        streamingResponse += chunk;
        
        // Send each chunk to frontend immediately
        res.write(`data: ${JSON.stringify({ 
          type: 'aiChunk', 
          chunk,
          accumulated: streamingResponse 
        })}\n\n`);
      });

      // Basic destination context analysis (parallel with streaming)
      let metadata = null;
      const resolvedDestinationContext = await destinationContext;
      
      if (resolvedDestinationContext && resolvedDestinationContext.hasDestination && resolvedDestinationContext.destination) {
        console.log(`[StreamRoute] Found destination in message: ${resolvedDestinationContext.destination}`);
        
        metadata = {
          destinationRequested: resolvedDestinationContext.destination,
          country: resolvedDestinationContext.country || null,
          needsMapData: true,
          showItineraryInChat: false
        };

        // Send destination context immediately for map updates
        res.write(`data: ${JSON.stringify({ 
          type: 'destinationContext', 
          metadata 
        })}\n\n`);
      }

      // Check for travel recommendations
      let enhancedMetadata = metadata;
      const existingChatContext = await checkExistingDestinationContext(chatId);
      
      if (existingChatContext && existingChatContext.destination) {
        const { extractTravelRecommendations } = await import('./openai');
        const recommendations = await extractTravelRecommendations(fullAiResponse, existingChatContext.destination, language);
        
        if (recommendations.hasRecommendations) {
          enhancedMetadata = {
            ...enhancedMetadata,
            travelRecommendations: recommendations.recommendations,
            destinationForRecommendations: existingChatContext.destination,
            needsMapUpdate: true
          };

          // Send map update signal
          res.write(`data: ${JSON.stringify({ 
            type: 'mapUpdate', 
            metadata: enhancedMetadata 
          })}\n\n`);
        }
      }

      // Save complete AI message
      const aiMessage = await storage.createMessage({
        chatId,
        role: "assistant",
        content: fullAiResponse,
        metadata: enhancedMetadata
      });

      // Update chat title if first exchange
      const allMessages = await storage.getChatMessages(chatId);
      if (allMessages.length === 2) {
        const title = content.length > 50 ? content.substring(0, 47) + "..." : content;
        await storage.updateChat(chatId, { title });
      }

      // Send completion signal
      res.write(`data: ${JSON.stringify({ 
        type: 'complete', 
        aiMessage,
        userMessage 
      })}\n\n`);

      res.end();
    } catch (error) {
      console.error("Error in streaming chat:", error);
      res.write(`data: ${JSON.stringify({ 
        type: 'error', 
        error: "Failed to process message" 
      })}\n\n`);
      res.end();
    }
  });

  // Get destinations
  app.get("/api/destinations", async (req, res) => {
    try {
      const destinations = await storage.getDestinations();
      res.json(destinations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch destinations" });
    }
  });

  // Search hotels via LiteAPI - real booking capability with commission
  app.get("/api/destinations/search-hotels", async (req, res) => {
    try {
      const { lat, lng } = req.query;
      if (!lat || !lng) {
        return res.status(400).json({ error: "Latitude and longitude required" });
      }

      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);
      
      if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({ error: "Invalid coordinates" });
      }

      const hotels = await searchLiteAPIHotels({ lat: latitude, lng: longitude });
      console.log(`[LiteAPI Hotels] Found ${hotels.length} bookable hotels`);
      res.json(hotels);
    } catch (error) {
      console.error("Error searching hotels:", error);
      res.status(500).json({ error: "Failed to search hotels" });
    }
  });

  // Search attractions via Google Maps API
  app.get("/api/destinations/search-attractions", async (req, res) => {
    try {
      const { lat, lng } = req.query;
      if (!lat || !lng) {
        return res.status(400).json({ error: "Latitude and longitude required" });
      }

      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);
      
      if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({ error: "Invalid coordinates" });
      }

      const attractions = await findNearbyAttractions({ lat: latitude, lng: longitude });
      res.json(attractions);
    } catch (error) {
      console.error("Error searching attractions:", error);
      res.status(500).json({ error: "Failed to search attractions" });
    }
  });

  // Search restaurants via Google Maps API
  app.get("/api/destinations/search-restaurants", async (req, res) => {
    try {
      const { lat, lng } = req.query;
      if (!lat || !lng) {
        return res.status(400).json({ error: "Latitude and longitude required" });
      }

      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);
      
      if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({ error: "Invalid coordinates" });
      }

      const restaurants = await findNearbyRestaurants({ lat: latitude, lng: longitude });
      res.json(restaurants);
    } catch (error) {
      console.error("Error searching restaurants:", error);
      res.status(500).json({ error: "Failed to search restaurants" });
    }
  });

  // Search shopping via Google Maps API
  app.get("/api/destinations/search-shopping", async (req, res) => {
    try {
      const { lat, lng } = req.query;
      if (!lat || !lng) {
        return res.status(400).json({ error: "Latitude and longitude required" });
      }

      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);
      
      if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({ error: "Invalid coordinates" });
      }

      const shopping = await findNearbyShopping({ lat: latitude, lng: longitude });
      res.json(shopping);
    } catch (error) {
      console.error("Error searching shopping:", error);
      res.status(500).json({ error: "Failed to search shopping" });
    }
  });

  // Search parks via Google Maps API
  app.get("/api/destinations/search-parks", async (req, res) => {
    try {
      const { lat, lng } = req.query;
      if (!lat || !lng) {
        return res.status(400).json({ error: "Latitude and longitude required" });
      }

      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);
      
      if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({ error: "Invalid coordinates" });
      }

      const parks = await findNearbyParks({ lat: latitude, lng: longitude });
      res.json(parks);
    } catch (error) {
      console.error("Error searching parks:", error);
      res.status(500).json({ error: "Failed to search parks" });
    }
  });

  // Search cafes via Google Maps API
  app.get("/api/destinations/search-cafes", async (req, res) => {
    try {
      const { lat, lng } = req.query;
      if (!lat || !lng) {
        return res.status(400).json({ error: "Latitude and longitude required" });
      }

      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);
      
      if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({ error: "Invalid coordinates" });
      }

      const cafes = await findNearbyCafes({ lat: latitude, lng: longitude });
      res.json(cafes);
    } catch (error) {
      console.error("Error searching cafes:", error);
      res.status(500).json({ error: "Failed to search cafes" });
    }
  });

  // Search transport via Google Maps API
  app.get("/api/destinations/search-transport", async (req, res) => {
    try {
      const { lat, lng } = req.query;
      if (!lat || !lng) {
        return res.status(400).json({ error: "Latitude and longitude required" });
      }

      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);
      
      if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({ error: "Invalid coordinates" });
      }

      const transport = await findNearbyTransport({ lat: latitude, lng: longitude });
      res.json(transport);
    } catch (error) {
      console.error("Error searching transport:", error);
      res.status(500).json({ error: "Failed to search transport" });
    }
  });

  // Search for specific place for AI recommendations
  app.get("/api/destinations/search-place", async (req, res) => {
    try {
      const { name, destination } = req.query;
      if (!name) {
        return res.status(400).json({ error: "Place name required" });
      }

      console.log(`[Routes] Searching for place: ${name} near ${destination}`);
      
      // Use Google Places search to find the specific place
      const searchQuery = destination ? `${name} ${destination}` : name as string;
      const place = await searchDestination(searchQuery);
      
      if (place) {
        res.json({
          name: place.name,
          lat: place.location.lat,
          lng: place.location.lng,
          address: place.address,
          placeId: place.placeId
        });
      } else {
        res.status(404).json({ error: "Place not found" });
      }
    } catch (error) {
      console.error("Error searching for place:", error);
      res.status(500).json({ error: "Failed to search for place" });
    }
  });

  // Search for a specific place by query
  app.get("/api/destinations/search-place", async (req, res) => {
    try {
      const { query } = req.query;
      if (!query) {
        return res.status(400).json({ error: "Query parameter required" });
      }

      const place = await searchDestination(query as string);
      if (place) {
        // Get additional place details if available
        try {
          const placeDetails = await getPlaceDetails(place.placeId);
          res.json({
            ...place,
            ...placeDetails
          });
        } catch (detailsError) {
          // Return basic place info if details fetch fails
          res.json(place);
        }
      } else {
        res.status(404).json({ error: "Place not found" });
      }
    } catch (error) {
      console.error("Error searching place:", error);
      res.status(500).json({ error: "Failed to search place" });
    }
  });

  // City/locality search for authentic destination pins (like MindTrip)
  app.get('/api/destinations/search-city', async (req, res) => {
    try {
      const { query } = req.query;
      if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
      }

      console.log(`[City Search] Searching for authentic city pin: ${query}`);
      
      // Search specifically for localities and administrative areas using Google Places API
      const places = await searchDestination(query as string);
      
      if (places && places.length > 0) {
        // Find the best match - prefer locality over other types
        let bestMatch = places[0];
        
        // If we have multiple results, find the best city/locality match
        if (Array.isArray(places)) {
          bestMatch = places.find(place => 
            place.types?.includes('locality') || 
            place.types?.includes('sublocality') ||
            place.types?.includes('administrative_area_level_3')
          ) || places[0];
        }
        
        const result = {
          name: bestMatch.displayName?.text || bestMatch.name,
          placeId: bestMatch.id || bestMatch.placeId,
          location: bestMatch.location,
          rating: bestMatch.rating,
          photos: bestMatch.photos?.map((photo: any) => 
            `https://places.googleapis.com/v1/${photo.name}/media?maxHeightPx=400&maxWidthPx=400&key=${process.env.GOOGLE_MAPS_API_KEY}`
          ) || [],
          types: bestMatch.types,
          vicinity: bestMatch.formattedAddress || bestMatch.vicinity,
          address: bestMatch.formattedAddress,
          description: `${bestMatch.displayName?.text || bestMatch.name} - Stadt und Region`
        };

        console.log(`[City Search] Found authentic city: ${result.name} (${result.placeId})`);
        res.json(result);
      } else {
        console.log(`[City Search] No authentic city found for: ${query}`);
        res.status(404).json({ error: 'City not found' });
      }
    } catch (error) {
      console.error('Error searching city:', error);
      res.status(500).json({ error: 'Failed to search city' });
    }
  });

  // Get destination details with hotels and attractions (specific numeric ID routes)
  app.get("/api/destinations/:id(\\d+)", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid destination ID" });
      }

      const destination = await storage.getDestination(id);
      if (!destination) {
        return res.status(404).json({ error: "Destination not found" });
      }

      const hotels = await storage.getDestinationHotels(id);
      const attractions = await storage.getDestinationAttractions(id);

      res.json({
        destination,
        hotels,
        attractions
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch destination details" });
    }
  });

  // Search destinations (comes after specific ID route)
  app.get("/api/destinations/search/:query", async (req, res) => {
    try {
      const query = req.params.query.toLowerCase();
      const destinations = await storage.getDestinations();

      const filtered = destinations.filter(dest => 
        dest.name.toLowerCase().includes(query) ||
        dest.country.toLowerCase().includes(query) ||
        dest.description.toLowerCase().includes(query)
      );

      res.json(filtered);
    } catch (error) {
      res.status(500).json({ error: "Failed to search destinations" });
    }
  });

  // Hotel bookings API
  app.get("/api/bookings", async (req, res) => {
    try {
      const { db } = await import('./db.js');
      const { hotelBookings } = await import('../shared/schema.js');
      const { desc } = await import('drizzle-orm');
      
      const bookings = await db.select().from(hotelBookings).orderBy(desc(hotelBookings.createdAt));
      
      res.json(bookings);
    } catch (error: any) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });

  app.get("/api/bookings/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { db } = await import('./db.js');
      const { hotelBookings } = await import('../shared/schema.js');
      const { eq } = await import('drizzle-orm');
      
      const booking = await db.select().from(hotelBookings).where(eq(hotelBookings.id, parseInt(id))).limit(1);
      
      if (booking.length === 0) {
        return res.status(404).json({ error: "Booking not found" });
      }
      
      res.json(booking[0]);
    } catch (error: any) {
      console.error("Error fetching booking:", error);
      res.status(500).json({ error: "Failed to fetch booking" });
    }
  });

  // Favorites API routes
  app.get("/api/favorites", authenticateToken, async (req, res) => {
    try {
      const user = (req as any).user;
      const favorites = await storage.getUserFavorites(user.id);
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ error: "Failed to fetch favorites" });
    }
  });

  app.post("/api/favorites", authenticateToken, async (req, res) => {
    try {
      const user = (req as any).user;
      const validatedData = insertFavoriteSchema.parse({
        ...req.body,
        userId: user.id
      });
      
      // Check if favorite already exists
      const existingFavorite = await storage.getUserFavorites(user.id);
      const alreadyExists = existingFavorite.find(fav => fav.placeId === validatedData.placeId);
      
      if (alreadyExists) {
        return res.status(409).json({ 
          error: "Item already in favorites",
          favorite: alreadyExists 
        });
      }
      
      const favorite = await storage.createFavorite(validatedData);
      res.json(favorite);
    } catch (error) {
      console.error("Error creating favorite:", error);
      if (error instanceof Error && error.message.includes('unique_user_item_favorite')) {
        return res.status(409).json({ error: "Item already in favorites" });
      }
      res.status(500).json({ error: "Failed to create favorite" });
    }
  });

  app.delete("/api/favorites/:placeId", authenticateToken, async (req, res) => {
    try {
      const placeId = req.params.placeId;
      const user = (req as any).user;
      
      const success = await storage.deleteFavorite(user.id, placeId);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Favorite not found" });
      }
    } catch (error) {
      console.error("Error deleting favorite:", error);
      res.status(500).json({ error: "Failed to delete favorite" });
    }
  });

  // Trip Plans API routes
  app.get("/api/trip-plans/:chatId", authenticateToken, async (req, res) => {
    try {
      const chatId = parseInt(req.params.chatId);
      const user = (req as any).user;
      
      // Ensure user owns this chat
      const chat = await storage.getChat(chatId);
      if (!chat || chat.userId !== user.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const tripPlan = await storage.getChatTripPlan(chatId);
      if (tripPlan) {
        res.json(tripPlan);
      } else {
        res.status(404).json({ error: "Trip plan not found" });
      }
    } catch (error) {
      console.error("Error fetching trip plan:", error);
      res.status(500).json({ error: "Failed to fetch trip plan" });
    }
  });

  app.post("/api/trip-plans", authenticateToken, async (req, res) => {
    try {
      const user = (req as any).user;
      
      // Validate the request body
      const validatedData = insertTripPlanSchema.parse({
        ...req.body,
        userId: user.id,
      });
      
      const tripPlan = await storage.createTripPlan(validatedData);
      res.json(tripPlan);
    } catch (error) {
      console.error("Error creating trip plan:", error);
      res.status(500).json({ error: "Failed to create trip plan" });
    }
  });

  app.put("/api/trip-plans/:id", authenticateToken, async (req, res) => {
    try {
      const tripPlanId = parseInt(req.params.id);
      const user = (req as any).user;
      
      // Get existing trip plan to verify ownership
      const existingPlan = await storage.getTripPlan(tripPlanId);
      if (!existingPlan || existingPlan.userId !== user.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Validate the request body (partial update)
      const validatedData = insertTripPlanSchema.partial().parse(req.body);
      
      const tripPlan = await storage.updateTripPlan(tripPlanId, validatedData);
      res.json(tripPlan);
    } catch (error) {
      console.error("Error updating trip plan:", error);
      res.status(500).json({ error: "Failed to update trip plan" });
    }
  });

  // Trip Sharing Routes
  
  // Get or create sharing settings for a trip
  app.post("/api/trip-plans/:id/sharing", authenticateToken, async (req, res) => {
    try {
      const tripPlanId = parseInt(req.params.id);
      const user = (req as any).user;
      
      // Verify ownership
      const tripPlan = await storage.getTripPlan(tripPlanId);
      if (!tripPlan || tripPlan.userId !== user.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const { accessLevel = 'invite-only', allowAnonymousAccess = false, expiryDays = 30 } = req.body;
      
      // Check if sharing settings already exist
      let sharingSettings = await storage.getTripSharingSettings(tripPlanId);
      
      if (!sharingSettings) {
        const { generateAccessToken, getShareLinkExpiry } = await import('./trip-sharing-utils.js');
        
        // Create new sharing settings
        sharingSettings = await storage.createTripSharingSettings({
          tripPlanId,
          accessLevel,
          allowAnonymousAccess,
          accessToken: generateAccessToken(),
          expiresAt: getShareLinkExpiry(expiryDays)
        });
      } else {
        // Update existing settings
        sharingSettings = await storage.updateTripSharingSettings(sharingSettings.id, {
          accessLevel,
          allowAnonymousAccess,
          expiresAt: expiryDays ? getShareLinkExpiry(expiryDays) : sharingSettings.expiresAt
        });
      }
      
      res.json(sharingSettings);
    } catch (error) {
      console.error("Error managing sharing settings:", error);
      res.status(500).json({ error: "Failed to manage sharing settings" });
    }
  });
  
  // Get sharing settings for a trip
  app.get("/api/trip-plans/:id/sharing", authenticateToken, async (req, res) => {
    try {
      const tripPlanId = parseInt(req.params.id);
      const user = (req as any).user;
      
      // Verify ownership
      const tripPlan = await storage.getTripPlan(tripPlanId);
      if (!tripPlan || tripPlan.userId !== user.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const sharingSettings = await storage.getTripSharingSettings(tripPlanId);
      const invitations = await storage.getTripInvitations(tripPlanId);
      
      res.json({
        settings: sharingSettings,
        invitations
      });
    } catch (error) {
      console.error("Error fetching sharing info:", error);
      res.status(500).json({ error: "Failed to fetch sharing info" });
    }
  });
  
  // Send email invitation
  app.post("/api/trip-plans/:id/invite", authenticateToken, async (req, res) => {
    try {
      const tripPlanId = parseInt(req.params.id);
      const user = (req as any).user;
      const { email, accessLevel = 'viewer' } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      // Verify ownership
      const tripPlan = await storage.getTripPlan(tripPlanId);
      if (!tripPlan || tripPlan.userId !== user.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Get user info for inviter name
      const inviter = await storage.getUser(user.id);
      
      // Check if invitation already exists
      let invitation = await storage.getTripInvitationByEmail(tripPlanId, email);
      
      if (!invitation) {
        const { generateInvitationToken, getInvitationExpiry, sendTripInvitationEmail, formatInvitationUrl } = await import('./trip-sharing-utils.js');
        
        // Create new invitation
        invitation = await storage.createTripInvitation({
          tripPlanId,
          email,
          invitedByUserId: user.id,
          accessLevel,
          invitationToken: generateInvitationToken(),
          expiresAt: getInvitationExpiry()
        });
        
        // Format trip details for email
        const tripData = typeof tripPlan.generatedPlan === 'string' 
          ? JSON.parse(tripPlan.generatedPlan) 
          : tripPlan.generatedPlan;
          
        const destination = tripData?.destination || tripPlan.location || 'Unknown Destination';
        const dates = tripData?.travelDates || tripPlan.dates || 'Dates TBD';
        const title = tripData?.title || `Trip to ${destination}`;
        
        // Send email
        const emailResult = await sendTripInvitationEmail({
          to: email,
          inviterName: inviter?.name || 'A friend',
          tripTitle: title,
          tripDestination: destination,
          tripDates: dates,
          inviteLink: formatInvitationUrl(tripPlanId, invitation.invitationToken),
          previewImageUrl: tripData?.image
        });
        
        if (!emailResult.success) {
          // Still return the invitation but warn about email
          console.error('Failed to send invitation email:', emailResult.error);
        }
      }
      
      res.json(invitation);
    } catch (error) {
      console.error("Error sending invitation:", error);
      res.status(500).json({ error: "Failed to send invitation" });
    }
  });
  
  // Access trip via share link or invitation
  app.get("/api/trip-access/:tripPlanId", async (req, res) => {
    try {
      const tripPlanId = parseInt(req.params.tripPlanId);
      const { access: accessToken, invite: inviteToken } = req.query;
      const user = (req as any).user;
      
      let hasAccess = false;
      let accessLevel = 'viewer';
      let anonymousSessionToken = null;
      
      // Check if user is owner
      const tripPlan = await storage.getTripPlan(tripPlanId);
      if (!tripPlan) {
        return res.status(404).json({ error: "Trip not found" });
      }
      
      if (user && tripPlan.userId === user.id) {
        hasAccess = true;
        accessLevel = 'owner';
      }
      // Check invitation token
      else if (inviteToken) {
        const invitation = await storage.getTripInvitationByToken(inviteToken as string);
        if (invitation && invitation.tripPlanId === tripPlanId && invitation.status === 'pending') {
          // Accept invitation if user is logged in with matching email
          if (user && user.email === invitation.email) {
            await storage.updateTripInvitation(invitation.id, {
              status: 'accepted',
              acceptedAt: new Date()
            });
            hasAccess = true;
            accessLevel = invitation.accessLevel;
          } else {
            // For anonymous users or mismatched emails, create anonymous session
            const { generateSessionToken } = await import('./trip-sharing-utils.js');
            const session = await storage.createAnonymousSession({
              tripPlanId,
              sessionToken: generateSessionToken(),
              ipAddress: req.ip,
              userAgent: req.headers['user-agent'] || null,
              permissions: invitation.accessLevel
            });
            hasAccess = true;
            accessLevel = invitation.accessLevel;
            anonymousSessionToken = session.sessionToken;
          }
        }
      }
      // Check share link access token
      else if (accessToken) {
        const sharingSettings = await storage.getTripSharingSettingsByToken(accessToken as string);
        if (sharingSettings && sharingSettings.tripPlanId === tripPlanId) {
          if (!sharingSettings.expiresAt || new Date(sharingSettings.expiresAt) > new Date()) {
            if (sharingSettings.allowAnonymousAccess && !user) {
              // Create anonymous session
              const { generateSessionToken } = await import('./trip-sharing-utils.js');
              const session = await storage.createAnonymousSession({
                tripPlanId,
                sessionToken: generateSessionToken(),
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'] || null,
                permissions: 'view'
              });
              hasAccess = true;
              accessLevel = 'viewer';
              anonymousSessionToken = session.sessionToken;
            } else if (user) {
              hasAccess = true;
              accessLevel = 'viewer';
            }
          }
        }
      }
      
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Return trip data with access info
      res.json({
        tripPlan,
        access: {
          level: accessLevel,
          sessionToken: anonymousSessionToken
        }
      });
    } catch (error) {
      console.error("Error accessing trip:", error);
      res.status(500).json({ error: "Failed to access trip" });
    }
  });

  // =============================================================================
  // CHAT SHARING ROUTES - Independent of trip plans
  // =============================================================================
  
  // Get sharing settings and invitations for a chat
  app.get("/api/chats/:id/sharing", authenticateToken, async (req, res) => {
    try {
      const chatId = parseInt(req.params.id);
      const user = (req as any).user;
      
      // Verify ownership
      const chat = await storage.getChat(chatId);
      if (!chat || chat.userId !== user.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const settings = await storage.getChatSharingSettings(chatId);
      const invitations = await storage.getChatInvitations(chatId);
      
      res.json({
        settings,
        invitations
      });
    } catch (error) {
      console.error("Error fetching chat sharing data:", error);
      res.status(500).json({ error: "Failed to fetch sharing data" });
    }
  });
  
  // Create or update sharing settings for a chat
  app.post("/api/chats/:id/sharing", authenticateToken, async (req, res) => {
    try {
      const chatId = parseInt(req.params.id);
      const user = (req as any).user;
      
      // Verify ownership
      const chat = await storage.getChat(chatId);
      if (!chat || chat.userId !== user.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const { accessLevel = 'invite-only', allowAnonymousAccess = false, expiryDays = 30 } = req.body;
      
      // Check if sharing settings already exist
      let sharingSettings = await storage.getChatSharingSettings(chatId);
      
      if (!sharingSettings) {
        const { generateAccessToken, getShareLinkExpiry } = await import('./chat-sharing-utils.js');
        
        // Create new sharing settings
        sharingSettings = await storage.createChatSharingSettings({
          chatId,
          accessLevel,
          allowAnonymousAccess,
          accessToken: generateAccessToken(),
          expiresAt: getShareLinkExpiry(expiryDays)
        });
      } else {
        const { getShareLinkExpiry } = await import('./chat-sharing-utils.js');
        // Update existing settings
        sharingSettings = await storage.updateChatSharingSettings(sharingSettings.id, {
          accessLevel,
          allowAnonymousAccess,
          expiresAt: expiryDays ? getShareLinkExpiry(expiryDays) : sharingSettings.expiresAt
        });
      }
      
      res.json(sharingSettings);
    } catch (error) {
      console.error("Error managing chat sharing settings:", error);
      res.status(500).json({ error: "Failed to manage sharing settings" });
    }
  });
  
  // Send email invitation to join a chat
  app.post("/api/chats/:id/invite", authenticateToken, async (req, res) => {
    try {
      const chatId = parseInt(req.params.id);
      const user = (req as any).user;
      const { email, accessLevel = 'viewer' } = req.body;
      
      // Verify ownership
      const chat = await storage.getChat(chatId);
      if (!chat || chat.userId !== user.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Check if user is already invited
      let invitation = await storage.getChatInvitationByEmail(chatId, email);
      
      if (!invitation) {
        const { generateInvitationToken, getInvitationExpiry, sendChatInvitationEmail, generateChatShareLink } = await import('./chat-sharing-utils.js');
        
        // Create new invitation
        invitation = await storage.createChatInvitation({
          chatId,
          email,
          invitedByUserId: user.id,
          accessLevel,
          invitationToken: generateInvitationToken(),
          expiresAt: getInvitationExpiry()
        });
        
        // Get recent messages for chat preview
        const messages = await storage.getChatMessages(chatId);
        const recentMessages = messages.slice(-3);
        const chatPreview = recentMessages.length > 0 
          ? recentMessages.map(m => `${m.role}: ${m.content.substring(0, 100)}`).join(' • ')
          : 'Join the conversation and start planning together!';
        
        // Send email
        const emailResult = await sendChatInvitationEmail({
          to: email,
          inviterName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email,
          chatTitle: chat.title,
          chatPreview,
          inviteLink: generateChatShareLink(invitation.invitationToken)
        });
        
        if (!emailResult.success) {
          console.error('Failed to send chat invitation email:', emailResult.error);
        }
      }
      
      res.json(invitation);
    } catch (error) {
      console.error("Error sending chat invitation:", error);
      res.status(500).json({ error: "Failed to send invitation" });
    }
  });
  
  // Access chat via share link or invitation
  app.get("/api/chat-access/:chatId", async (req, res) => {
    try {
      const chatId = parseInt(req.params.chatId);
      const { access: accessToken, invite: inviteToken } = req.query;
      const user = (req as any).user;
      
      let hasAccess = false;
      let accessLevel = 'viewer';
      let anonymousSessionToken = null;
      
      // Check if chat exists
      const chat = await storage.getChat(chatId);
      if (!chat) {
        return res.status(404).json({ error: "Chat not found" });
      }
      
      // Check if user is owner
      if (user && chat.userId === user.id) {
        hasAccess = true;
        accessLevel = 'owner';
      }
      // Check invitation token
      else if (inviteToken) {
        const invitation = await storage.getChatInvitationByToken(inviteToken as string);
        if (invitation && invitation.chatId === chatId && invitation.status === 'pending') {
          // Accept invitation if user is logged in with matching email
          if (user && user.email === invitation.email) {
            await storage.updateChatInvitation(invitation.id, {
              status: 'accepted',
              acceptedAt: new Date()
            });
            hasAccess = true;
            accessLevel = invitation.accessLevel;
          } else {
            // For anonymous users or mismatched emails, create anonymous session
            const { generateSessionToken } = await import('./chat-sharing-utils.js');
            const session = await storage.createAnonymousChatSession({
              chatId,
              sessionToken: generateSessionToken(),
              ipAddress: req.ip,
              userAgent: req.headers['user-agent'] || null,
              permissions: invitation.accessLevel
            });
            hasAccess = true;
            accessLevel = invitation.accessLevel;
            anonymousSessionToken = session.sessionToken;
          }
        }
      }
      // Check share link access token
      else if (accessToken) {
        const sharingSettings = await storage.getChatSharingSettingsByToken(accessToken as string);
        if (sharingSettings && sharingSettings.chatId === chatId) {
          if (!sharingSettings.expiresAt || new Date(sharingSettings.expiresAt) > new Date()) {
            if (sharingSettings.allowAnonymousAccess && !user) {
              // Create anonymous session
              const { generateSessionToken } = await import('./chat-sharing-utils.js');
              const session = await storage.createAnonymousChatSession({
                chatId,
                sessionToken: generateSessionToken(),
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'] || null,
                permissions: 'view'
              });
              hasAccess = true;
              accessLevel = 'viewer';
              anonymousSessionToken = session.sessionToken;
            } else if (user) {
              hasAccess = true;
              accessLevel = 'viewer';
            }
          }
        }
      }
      
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Return chat data with access info
      const messages = accessLevel === 'owner' || accessLevel === 'editor' 
        ? await storage.getChatMessages(chatId)
        : await storage.getChatMessages(chatId); // For now, viewers can see all messages
      
      res.json({
        chat,
        messages,
        access: {
          level: accessLevel,
          sessionToken: anonymousSessionToken
        }
      });
    } catch (error) {
      console.error("Error accessing chat:", error);
      res.status(500).json({ error: "Failed to access chat" });
    }
  });

  // =============================================================================
  // PLATFORM INVITATIONS - General invites to join the platform
  // =============================================================================
  
  // Send platform invitation email
  app.post("/api/platform/invite", authenticateToken, async (req, res) => {
    try {
      const user = (req as any).user;
      const { email } = req.body;
      
      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: "Valid email address required" });
      }
      
      // Import email utility functions
      const { sendPlatformInvitationEmail } = await import('./chat-sharing-utils.js');
      
      // Send platform invitation email
      const emailResult = await sendPlatformInvitationEmail({
        to: email,
        inviterName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email,
        inviteLink: `${process.env.REPLIT_DOMAIN || 'http://localhost:5000'}/register?ref=${user.id}`
      });
      
      if (!emailResult.success) {
        console.error('Failed to send platform invitation email:', emailResult.error);
        return res.status(500).json({ error: "Failed to send invitation email" });
      }
      
      res.json({ 
        success: true, 
        message: "Platform invitation sent successfully",
        email: email
      });
    } catch (error) {
      console.error("Error sending platform invitation:", error);
      res.status(500).json({ error: "Failed to send platform invitation" });
    }
  });

  // Debug route to see trip plan structure
  app.get("/api/debug/trip-plan/:chatId", authenticateToken, async (req, res) => {
    try {
      const chatId = parseInt(req.params.chatId);
      const user = (req as any).user;
      
      // Ensure user owns this chat
      const chat = await storage.getChat(chatId);
      if (!chat || chat.userId !== user.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const tripPlan = await storage.getChatTripPlan(chatId);
      res.json({
        exists: !!tripPlan,
        hasGeneratedPlan: !!(tripPlan && tripPlan.generatedPlan),
        planKeys: tripPlan?.generatedPlan ? Object.keys(tripPlan.generatedPlan) : [],
        fullPlan: tripPlan
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Itinerary API routes
  app.get("/api/chats/:chatId/itinerary", authenticateToken, async (req, res) => {
    try {
      const chatId = parseInt(req.params.chatId);
      const user = (req as any).user;
      
      // Ensure user owns this chat
      const chat = await storage.getChat(chatId);
      if (!chat || chat.userId !== user.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      let items = await storage.getChatItineraryItems(chatId);
      const language = chat?.language || 'en';
      
      // Language-specific fallback labels
      const labels: Record<string, {
        hotel: string;
        attraction: string;
        restaurant: string;
        night: string;
        free: string;
        duration: string;
        location: string;
      }> = {
        en: {
          hotel: 'Hotel',
          attraction: 'Attraction', 
          restaurant: 'Restaurant',
          night: '/night',
          free: 'Free',
          duration: 'Duration',
          location: 'Location'
        },
        de: {
          hotel: 'Hotel',
          attraction: 'Sehenswürdigkeit',
          restaurant: 'Restaurant', 
          night: '/Nacht',
          free: 'Kostenlos',
          duration: 'Dauer',
          location: 'Ort'
        }
      };
      
      const currentLabels = labels[language] || labels.en;
      
      // If no saved items, extract from generated trip plan
      if (items.length === 0) {
        const tripPlan = await storage.getChatTripPlan(chatId);
        if (tripPlan && tripPlan.generatedPlan) {
          const plan = tripPlan.generatedPlan;
          const extractedItems: any[] = [];
          
          // Create items from any available plan data
          if (typeof plan === 'object') {
            const planObj = plan as any;
            
            // Try different plan structures
            if (planObj.destination) {
              const dest = planObj.destination;
              
              // Hotels
              if (dest.accommodations?.hotels) {
                dest.accommodations.hotels.forEach((hotel: any, index: number) => {
                  extractedItems.push({
                    id: extractedItems.length + 1,
                    chatId: chatId,
                    day: 1,
                    order: index,
                    itemType: 'hotel',
                    itemName: hotel.name || currentLabels.hotel,
                    itemData: {
                      description: hotel.description || '',
                      location: hotel.address || hotel.vicinity,
                      cost: hotel.pricePerNight ? `€${hotel.pricePerNight}${currentLabels.night}` : null,
                      rating: hotel.rating,
                      coordinates: hotel.location || hotel.coordinates
                    }
                  });
                });
              }
              
              // Attractions
              if (dest.attractions?.places) {
                dest.attractions.places.forEach((attraction: any, index: number) => {
                  extractedItems.push({
                    id: extractedItems.length + 1,
                    chatId: chatId,
                    day: Math.ceil((index + 1) / 3),
                    order: index % 3,
                    itemType: 'attraction',
                    itemName: attraction.name || currentLabels.attraction,
                    itemData: {
                      description: attraction.description || '',
                      location: attraction.address || attraction.vicinity,
                      rating: attraction.rating,
                      coordinates: attraction.location || attraction.coordinates
                    }
                  });
                });
              }
              
              // Restaurants
              if (dest.dining?.restaurants) {
                dest.dining.restaurants.forEach((restaurant: any, index: number) => {
                  extractedItems.push({
                    id: extractedItems.length + 1,
                    chatId: chatId,
                    day: Math.ceil((index + 1) / 2),
                    order: index % 2 + 10,
                    itemType: 'restaurant',
                    itemName: restaurant.name || currentLabels.restaurant,
                    itemData: {
                      description: restaurant.description || '',
                      location: restaurant.address || restaurant.vicinity,
                      rating: restaurant.rating,
                      cost: restaurant.priceLevel ? `€${'€'.repeat(restaurant.priceLevel)}` : null,
                      coordinates: restaurant.location || restaurant.coordinates
                    }
                  });
                });
              }
            }
          }
          
          if (extractedItems.length > 0) {
            return res.json(extractedItems);
          }
        }
      }
      
      res.json(items);
    } catch (error) {
      console.error("Error fetching itinerary items:", error);
      res.status(500).json({ error: "Failed to fetch itinerary items" });
    }
  });

  app.post("/api/chats/:chatId/itinerary", authenticateToken, async (req, res) => {
    try {
      const chatId = parseInt(req.params.chatId);
      const user = (req as any).user;
      
      // Ensure user owns this chat
      const chat = await storage.getChat(chatId);
      if (!chat || chat.userId !== user.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const validatedData = insertItineraryItemSchema.parse({
        ...req.body,
        chatId
      });
      
      const item = await storage.createItineraryItem(validatedData);
      res.json(item);
    } catch (error) {
      console.error("Error creating itinerary item:", error);
      res.status(500).json({ error: "Failed to create itinerary item" });
    }
  });

  app.delete("/api/itinerary/:itemId", authenticateToken, async (req, res) => {
    try {
      const itemId = parseInt(req.params.itemId);
      const user = (req as any).user;
      
      // Get the item to check ownership
      const item = await storage.getItineraryItem(itemId);
      if (!item) {
        return res.status(404).json({ error: "Itinerary item not found" });
      }
      
      // Check chat ownership
      const chat = await storage.getChat(item.chatId);
      if (!chat || chat.userId !== user.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const success = await storage.deleteItineraryItem(itemId);
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Itinerary item not found" });
      }
    } catch (error) {
      console.error("Error deleting itinerary item:", error);
      res.status(500).json({ error: "Failed to delete itinerary item" });
    }
  });

  // Calculate distance between two coordinates
  app.post("/api/calculate-distance", async (req, res) => {
    try {
      const { lat1, lng1, lat2, lng2, language = 'de' } = req.body;
      
      if (!lat1 || !lng1 || !lat2 || !lng2) {
        return res.status(400).json({ error: "Missing coordinates" });
      }
      
      const distanceKm = calculateDistance(lat1, lng1, lat2, lng2);
      const formattedDistance = formatDistance(distanceKm, language);
      
      res.json({
        distanceKm,
        formattedDistance
      });
    } catch (error) {
      console.error("Error calculating distance:", error);
      res.status(500).json({ error: "Failed to calculate distance" });
    }
  });

  // Geocode location names to coordinates for chat items
  app.get("/api/destinations/geocode", async (req, res) => {
    try {
      const { query } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: "Query parameter is required" });
      }
      
      console.log(`[Geocoding] Resolving coordinates for: ${query}`);
      
      // Use the existing searchDestination function which returns coordinates
      const destination = await searchDestination(query);
      
      if (destination && destination.location) {
        res.json({
          results: [{
            geometry: {
              location: destination.location
            },
            formatted_address: destination.address,
            name: destination.name
          }]
        });
      } else {
        res.json({
          results: [],
          status: "ZERO_RESULTS"
        });
      }
    } catch (error) {
      console.error("Error geocoding location:", error);
      res.status(500).json({ error: "Failed to geocode location" });
    }
  });




  // Chat Location Resolution - unified approach like map search
  app.post("/api/chat/resolve-locations", async (req, res) => {
    try {
      const { extractedNames, destinationContext } = req.body;
      
      if (!extractedNames || !Array.isArray(extractedNames)) {
        return res.status(400).json({ error: "extractedNames array is required" });
      }
      
      console.log('[ChatLocationAPI] Resolving locations:', extractedNames);
      
      // Use same caching approach as destination search
      const resolvedLocations = [];
      
      for (const locationName of extractedNames) {
        try {
          // 1. Check cache first (like map does) - using existing cache service
          const cached = await getCachedDestination(locationName);
          
          if (cached) {
            console.log('[Cache Hit] Found cached location:', locationName);
            resolvedLocations.push({
              placeId: cached.placeId || cached.place_id,
              name: cached.name,
              type: cached.category || 'attraction',
              coordinates: cached.location,
              address: cached.address,
              rating: cached.rating,
              photos: cached.photos,
              cached: true
            });
            continue;
          }
          
          // 2. Search Google Places API (like map search)
          const searchQuery = destinationContext ? `${locationName} ${destinationContext}` : locationName;
          const googleResult = await searchDestination(searchQuery);
          
          if (googleResult) {
            // Classify based on Google Places types with improved geographic feature detection
            const classifyType = (types: string[], name: string = '') => {
              const lowerName = name.toLowerCase();
              
              // Priority 1: Geographic features by name should NEVER be hotels
              const geographicPatterns = [
                'valley', 'tal', 'river', 'fluss', 'mosel', 'rhein', 'elbe', 'donau',
                'mountain', 'berg', 'hill', 'hügel', 'forest', 'wald',
                'lake', 'see', 'coast', 'küste', 'bay', 'bucht',
                'promenade', 'promenad', 'ufer', 'embankment', 'waterfront',
                'market square', 'marktplatz', 'hauptplatz', 'stadtplatz'
              ];
              
              if (geographicPatterns.some(pattern => lowerName.includes(pattern))) {
                console.log(`[Route Classification] Geographic feature detected: "${name}" -> attraction`);
                return 'attraction';
              }
              
              // Priority 2: Administrative/political areas (places, not businesses)
              const placeTypes = [
                'natural_feature', 'park', 'sublocality', 'locality', 
                'administrative_area_level_1', 'administrative_area_level_2', 'administrative_area_level_3',
                'country', 'political', 'route'
              ];
              
              const hasPlaceType = types.some(type => placeTypes.includes(type));
              const hasEstablishment = types.includes('establishment');
              
              if (hasPlaceType && !hasEstablishment) {
                console.log(`[Route Classification] Administrative area detected: "${name}" -> attraction`);
                return 'attraction';
              }
              
              // Priority 3: Business establishments
              const hotelTypes = ['lodging']; // Removed campground/rv_park
              const restaurantTypes = ['restaurant', 'food', 'meal_takeaway', 'cafe', 'bar', 'bakery'];
              
              if (types.some(type => hotelTypes.includes(type))) return 'hotel';
              if (types.some(type => restaurantTypes.includes(type))) return 'restaurant';
              
              // Default: attraction
              return 'attraction';
            };
            
            const resolvedLocation = {
              placeId: googleResult.placeId,
              name: googleResult.name,
              type: classifyType(googleResult.types || [], googleResult.name),
              coordinates: googleResult.location,
              address: googleResult.address,
              rating: googleResult.rating,
              photos: googleResult.photos,
              types: googleResult.types,
              cached: false
            };
            
            // Cache for future use using existing cache service
            await cacheService.saveDestinationToCache(locationName, resolvedLocation);
            console.log('[Cache] Saved location to cache:', locationName);
            
            resolvedLocations.push(resolvedLocation);
          }
        } catch (error) {
          console.warn('[ChatLocationAPI] Error resolving location:', locationName, error);
        }
      }
      
      res.json({ 
        resolved: resolvedLocations,
        total: extractedNames.length,
        found: resolvedLocations.length
      });
      
    } catch (error) {
      console.error("Error resolving chat locations:", error);
      res.status(500).json({ error: "Failed to resolve locations" });
    }
  });

  // Get enhanced location details with TripAdvisor data
  app.get("/api/locations/:locationName/details", async (req, res) => {
    try {
      const locationName = req.params.locationName;
      const { lat, lng, placeId, address, rating, photos } = req.query;

      if (!locationName) {
        return res.status(400).json({ error: "Location name is required" });
      }

      let response: any = {
        name: locationName,
        type: 'attraction',
        location: {}
      };

      // If coordinates are provided in query (from cached data), use them without API call
      if (lat && lng) {
        response.location.coordinates = {
          lat: parseFloat(lat as string),
          lng: parseFloat(lng as string)
        };
        
        // Check cache first by PlaceID (language-independent), then by destination name
        let cachedPlace = null;
        if (placeId) {
          cachedPlace = await getCachedPlaceByPlaceId(placeId as string);
        }
        
        if (!cachedPlace) {
          cachedPlace = await getCachedDestination(locationName);
        }
        
        if (cachedPlace) {
          console.log(`[Cache] Using cached place data for location details: ${locationName} (PlaceID: ${placeId || 'none'})`);
          response = {
            ...response,
            id: placeId || cachedPlace.placeId,
            location: {
              ...response.location,
              address: address || cachedPlace.address,
              coordinates: cachedPlace.location
            },
            rating: rating ? parseFloat(rating as string) : cachedPlace.rating,
            images: photos ? JSON.parse(decodeURIComponent(photos as string)) : cachedPlace.photos || []
          };
        } else {
          // Only fallback to API if no cached data available
          try {
            const googleData = await searchDestination(locationName);
            if (googleData) {
              response = {
                ...response,
                id: googleData.placeId,
                location: {
                  ...response.location,
                  address: googleData.address,
                  coordinates: googleData.location
                },
                rating: googleData.rating,
                images: googleData.photos || []
              };
            }
          } catch (error) {
            console.log('Google Maps data not available for:', locationName);
          }
        }
      } else {
        // No coordinates provided - need to search for location
        try {
          const googleData = await searchDestination(locationName);
          if (googleData) {
            response = {
              ...response,
              id: googleData.placeId,
              location: {
                ...response.location,
                address: googleData.address,
                coordinates: googleData.location
              },
              rating: googleData.rating,
              images: googleData.photos || []
            };
          }
        } catch (error) {
          console.log('Google Maps data not available for:', locationName);
        }
      }

      // Get TripAdvisor data for enhanced details
      try {
        const tripAdvisorData = await searchTripAdvisorLocation(locationName, 
          response.location.coordinates?.lat, 
          response.location.coordinates?.lng
        );
        
        if (tripAdvisorData) {
          // Get reviews
          const reviews = await getTripAdvisorReviews(tripAdvisorData.location_id);
          
          // Get photos
          const photos = await getTripAdvisorPhotos(tripAdvisorData.location_id);
          
          response.tripAdvisor = {
            locationId: tripAdvisorData.location_id,
            rating: tripAdvisorData.rating ? parseFloat(tripAdvisorData.rating) : null,
            numReviews: tripAdvisorData.num_reviews ? parseInt(tripAdvisorData.num_reviews) : null,
            rankingData: tripAdvisorData.ranking_data,
            priceLevel: tripAdvisorData.price_level,
            awards: tripAdvisorData.awards,
            cuisine: tripAdvisorData.cuisine,
            amenities: tripAdvisorData.amenities,
            reviews: reviews || [],
            photos: photos || []
          };
          
          // Enhance description with TripAdvisor details
          if (tripAdvisorData.ranking_data?.ranking_string) {
            response.description = (response.description || '') + 
              (response.description ? '\n\n' : '') +
              tripAdvisorData.ranking_data.ranking_string;
          }
        }
      } catch (error) {
        console.log('TripAdvisor data not available for:', locationName, error.message);
      }

      res.json(response);
    } catch (error) {
      console.error("Error fetching location details:", error);
      res.status(500).json({ error: "Failed to fetch location details" });
    }
  });

  // Agent API endpoints
  app.post('/api/agents/plan-trip', async (req, res) => {
    try {
      const { travelOrchestrator } = await import('./agents/orchestrator');
      const { itineraryLogger } = await import('./itinerary-logger.js');
      
      const request = {
        destination: req.body.destination,
        chatId: req.body.chatId,
        userId: req.body.userId || 1,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        duration: req.body.duration,
        budget: req.body.budget,
        preferences: req.body.preferences || [],
        language: req.body.language || 'en'
      };

      // Start detailed logging
      const generationId = itineraryLogger.startGeneration(request.chatId);
      
      try {
        const result = await travelOrchestrator.planTrip(request);
        itineraryLogger.completeGeneration(request.chatId);
        res.json(result);
      } catch (error) {
        itineraryLogger.errorGeneration(request.chatId, error instanceof Error ? error.message : 'Trip planning failed');
        throw error;
      }
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Trip planning failed' 
      });
    }
  });

  // Get current generation status
  app.get("/api/chats/:chatId/generation-status", async (req, res) => {
    try {
      const chatId = parseInt(req.params.chatId);
      if (isNaN(chatId)) {
        return res.status(400).json({ error: "Invalid chat ID" });
      }

      const { itineraryLogger } = await import('./itinerary-logger.js');
      const status = itineraryLogger.getCurrentStatus(chatId);
      const logs = itineraryLogger.getGenerationLogs(chatId);

      res.json({ status, logs });
    } catch (error) {
      console.error("[GenerationStatus] Error:", error);
      res.status(500).json({ error: "Failed to get generation status" });
    }
  });

  app.get('/api/agents/status', async (req, res) => {
    try {
      const { travelOrchestrator } = await import('./agents/orchestrator');
      const status = await travelOrchestrator.getAgentStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get agent status' });
    }
  });

  app.get('/api/agents/chat', async (req, res) => {
    try {
      const chatId = parseInt(req.query.chatId as string) || 1;
      const { travelOrchestrator } = await import('./agents/orchestrator');
      const chatActivity = await travelOrchestrator.getChatAgentActivity(chatId);
      res.json(chatActivity);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get chat activity' });
    }
  });

  // Solver validation endpoints
  app.post('/api/solver/validate', async (req, res) => {
    try {
      const { SolverAgent } = await import('./agents/solver-agent');
      const solverAgent = new SolverAgent(999);
      
      const result = await solverAgent.execute({
        type: 'constraint_validation',
        data: req.body,
        chatId: req.body.chatId || 1,
        context: req.body.context
      });
      
      res.json(result);
    } catch (error) {
      console.error('Solver validation failed:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Solver validation failed'
      });
    }
  });

  app.get('/api/solver/results/:chatId', async (req, res) => {
    try {
      const chatId = parseInt(req.params.chatId);
      const results = await storage.getChatSolverResults(chatId);
      res.json(results);
    } catch (error) {
      console.error('Failed to get solver results:', error);
      res.status(500).json({ error: 'Failed to get solver results' });
    }
  });

  // Distance calculation API endpoint
  app.post('/api/calculate-distance', async (req, res) => {
    try {
      const { lat1, lng1, lat2, lng2, language = 'de' } = req.body;
      
      if (!lat1 || !lng1 || !lat2 || !lng2) {
        return res.status(400).json({ error: 'Missing coordinates' });
      }

      const distanceKm = calculateDistance(
        parseFloat(lat1),
        parseFloat(lng1),
        parseFloat(lat2),
        parseFloat(lng2)
      );
      
      const formattedDistance = formatDistance(distanceKm, language);
      
      res.json({
        distanceKm,
        formattedDistance
      });
    } catch (error) {
      console.error('Distance calculation error:', error);
      res.status(500).json({ error: 'Failed to calculate distance' });
    }
  });

  // Trip Plan API endpoints
  app.get('/api/trip-plans/:chatId', async (req, res) => {
    try {
      const chatId = parseInt(req.params.chatId);
      const tripPlan = await storage.getChatTripPlan(chatId);
      res.json(tripPlan);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch trip plan' });
    }
  });

  app.get('/api/itinerary-items/:chatId', async (req, res) => {
    try {
      const chatId = parseInt(req.params.chatId);
      const items = await storage.getChatItineraryItems(chatId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch itinerary items' });
    }
  });

  app.post('/api/itinerary-items', async (req, res) => {
    try {
      const item = await storage.createItineraryItem(req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create itinerary item' });
    }
  });

  app.delete('/api/itinerary-items/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteItineraryItem(id);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete itinerary item' });
    }
  });

  // Favorites API endpoints
  app.get('/api/favorites', async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string) || 1;
      const favorites = await storage.getUserFavorites(userId);
      res.json(favorites);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch favorites' });
    }
  });

  app.post('/api/favorites', async (req, res) => {
    try {
      const favorite = await storage.createFavorite(req.body);
      res.json(favorite);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create favorite' });
    }
  });

  app.delete('/api/favorites/:userId/:itemId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const itemId = req.params.itemId;
      const success = await storage.deleteFavorite(userId, itemId);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete favorite' });
    }
  });

  // Create trip plan endpoint
  app.post('/api/trip-plans', async (req, res) => {
    try {
      const tripPlan = await storage.createTripPlan(req.body);
      res.json(tripPlan);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create trip plan' });
    }
  });

  app.get('/api/agents/chat/:chatId/activity', async (req, res) => {
    try {
      const { travelOrchestrator } = await import('./agents/orchestrator');
      const chatId = parseInt(req.params.chatId);
      const activity = await travelOrchestrator.getChatAgentActivity(chatId);
      res.json(activity);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get chat activity' });
    }
  });

  app.get('/api/trip-plans/:chatId', async (req, res) => {
    try {
      const chatId = parseInt(req.params.chatId);
      const tripPlan = await storage.getChatTripPlan(chatId);
      res.json(tripPlan);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get trip plan' });
    }
  });



  // Simple Travel Mood API endpoints
  app.get('/api/travel-moods', async (req: Request, res: Response) => {
    try {
      const moods = await getTravelMoods();
      res.json(moods);
    } catch (error) {
      console.error('Error fetching travel moods:', error);
      res.status(500).json({ error: 'Failed to fetch travel moods' });
    }
  });

  app.post('/api/chats/:chatId/mood', async (req: Request, res: Response) => {
    try {
      const chatId = parseInt(req.params.chatId);
      const { moodId } = req.body;
      
      if (!chatId || !moodId) {
        return res.status(400).json({ error: 'Chat ID and mood ID are required' });
      }

      const result = await setChatMood(chatId, moodId);
      res.json(result);
    } catch (error) {
      console.error('Error setting chat mood:', error);
      res.status(500).json({ error: 'Failed to set chat mood' });
    }
  });

  app.get('/api/chats/:chatId/mood', async (req: Request, res: Response) => {
    try {
      const chatId = parseInt(req.params.chatId);
      const chatMood = await getChatMood(chatId);
      res.json(chatMood);
    } catch (error) {
      console.error('Error fetching chat mood:', error);
      res.status(500).json({ error: 'Failed to fetch chat mood' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Cache Management API Routes
function registerCacheRoutes(app: Express) {
  // Get cache statistics and performance metrics
  app.get('/api/cache/stats', async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const stats = await cacheService.getCacheStats(days);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching cache stats:', error);
      res.status(500).json({ error: 'Failed to fetch cache statistics' });
    }
  });

  // Manual cache cleanup
  app.post('/api/cache/cleanup', async (req, res) => {
    try {
      await cacheService.cleanupExpiredCache();
      res.json({ success: true, message: 'Cache cleanup completed' });
    } catch (error) {
      console.error('Error during cache cleanup:', error);
      res.status(500).json({ error: 'Cache cleanup failed' });
    }
  });

  // Clear all cache (development/testing)
  app.delete('/api/cache/clear', async (req, res) => {
    try {
      await cacheService.clearAllCache();
      res.json({ success: true, message: 'All cache cleared' });
    } catch (error) {
      console.error('Error clearing cache:', error);
      res.status(500).json({ error: 'Failed to clear cache' });
    }
  });

  // Get cached places for specific location and category
  app.get('/api/cache/places', async (req, res) => {
    try {
      const { lat, lng, category, radius } = req.query;
      
      if (!lat || !lng || !category) {
        return res.status(400).json({ error: 'lat, lng, and category are required' });
      }

      const location = { 
        lat: parseFloat(lat as string), 
        lng: parseFloat(lng as string) 
      };
      const searchRadius = radius ? parseInt(radius as string) : 5000;

      const cachedPlaces = await cacheService.getCachedPlaces(location, category as string, searchRadius);
      
      res.json({
        cached: cachedPlaces.length > 0,
        count: cachedPlaces.length,
        places: cachedPlaces
      });
    } catch (error) {
      console.error('Error fetching cached places:', error);
      res.status(500).json({ error: 'Failed to fetch cached places' });
    }
  });

  console.log('✅ Cache management routes registered');
}