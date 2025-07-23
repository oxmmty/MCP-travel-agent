import { 
  users, chats, messages, destinations, hotels, attractions, favorites, itineraryItems,
  agents, agentTasks, tripPlans, solverResults, solverConstraints,
  hotelBookings, revenueTracking, userPreferences, enhancedHotels,
  socialMediaContent, destinationSocialContent, socialMediaCuration, 
  userSocialInteractions, socialMediaHashtags,
  type User, type InsertUser,
  type Chat, type InsertChat,
  type Message, type InsertMessage,
  type Destination, type InsertDestination,
  type Hotel, type InsertHotel,
  type Attraction, type InsertAttraction,
  type Favorite, type InsertFavorite,
  type ItineraryItemDb, type InsertItineraryItemDb,
  type Agent, type InsertAgent,
  type AgentTask, type InsertAgentTask,
  type TripPlan, type InsertTripPlan,
  type SolverResult, type InsertSolverResult,
  type SolverConstraint, type InsertSolverConstraint,
  type HotelBooking, type InsertHotelBooking,
  type RevenueTracking, type InsertRevenueTracking,
  type UserPreferences, type InsertUserPreferences,
  type EnhancedHotel, type InsertEnhancedHotel,
  type SocialMediaContent, type InsertSocialMediaContent,
  type DestinationSocialContent, type InsertDestinationSocialContent,
  type SocialMediaCuration, type InsertSocialMediaCuration,
  type UserSocialInteraction, type InsertUserSocialInteraction,
  type SocialMediaHashtag, type InsertSocialMediaHashtag
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Chat operations
  getUserChats(userId: number): Promise<Chat[]>;
  getChat(id: number): Promise<Chat | undefined>;
  createChat(chat: InsertChat): Promise<Chat>;
  updateChat(id: number, updates: Partial<Chat>): Promise<Chat | undefined>;

  // Message operations
  getChatMessages(chatId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // Destination operations
  getDestinations(): Promise<Destination[]>;
  getDestination(id: number): Promise<Destination | undefined>;
  getDestinationByName(name: string): Promise<Destination | undefined>;
  createDestination(destination: InsertDestination): Promise<Destination>;

  // Hotel operations
  getDestinationHotels(destinationId: number): Promise<Hotel[]>;
  getHotel(id: number): Promise<Hotel | undefined>;
  createHotel(hotel: InsertHotel): Promise<Hotel>;

  // Attraction operations
  getDestinationAttractions(destinationId: number): Promise<Attraction[]>;
  getAttraction(id: number): Promise<Attraction | undefined>;
  createAttraction(attraction: InsertAttraction): Promise<Attraction>;

  // Favorites operations
  getUserFavorites(userId: number): Promise<Favorite[]>;
  createFavorite(favorite: InsertFavorite): Promise<Favorite>;
  deleteFavorite(userId: number, itemId: string): Promise<boolean>;

  // Itinerary operations
  getChatItineraryItems(chatId: number): Promise<ItineraryItemDb[]>;
  createItineraryItem(item: InsertItineraryItemDb): Promise<ItineraryItemDb>;
  deleteItineraryItem(id: number): Promise<boolean>;

  // Agent operations
  getAgents(): Promise<Agent[]>;
  getAgent(id: number): Promise<Agent | undefined>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgentStatus(id: number, status: string): Promise<Agent | undefined>;

  // Agent Task operations
  createAgentTask(task: InsertAgentTask): Promise<AgentTask>;
  getAgentTask(id: number): Promise<AgentTask | undefined>;
  getAgentTasks(agentId: number): Promise<AgentTask[]>;
  getChatAgentTasks(chatId: number): Promise<AgentTask[]>;
  updateAgentTask(id: number, updates: Partial<AgentTask>): Promise<AgentTask | undefined>;

  // Trip Plan operations
  createTripPlan(plan: InsertTripPlan): Promise<TripPlan>;
  getTripPlan(id: number): Promise<TripPlan | undefined>;
  getChatTripPlan(chatId: number): Promise<TripPlan | undefined>;
  updateTripPlan(id: number, updates: Partial<TripPlan>): Promise<TripPlan | undefined>;

  // Solver operations
  createSolverResult(result: InsertSolverResult): Promise<SolverResult>;
  getSolverResult(id: number): Promise<SolverResult | undefined>;
  getChatSolverResults(chatId: number): Promise<SolverResult[]>;
  getTripPlanSolverResults(tripPlanId: number): Promise<SolverResult[]>;
  createSolverConstraint(constraint: InsertSolverConstraint): Promise<SolverConstraint>;
  getSolverConstraints(solverResultId: number): Promise<SolverConstraint[]>;

  // LiteAPI Booking operations
  createHotelBooking(booking: InsertHotelBooking): Promise<HotelBooking>;
  getHotelBooking(id: number): Promise<HotelBooking | undefined>;
  getHotelBookingByLiteApiId(liteApiBookingId: string): Promise<HotelBooking | undefined>;
  getUserHotelBookings(userId: number): Promise<HotelBooking[]>;
  getChatHotelBookings(chatId: number): Promise<HotelBooking[]>;
  updateHotelBooking(id: number, updates: Partial<HotelBooking>): Promise<HotelBooking | undefined>;

  // Revenue tracking operations
  createRevenueTracking(revenue: InsertRevenueTracking): Promise<RevenueTracking>;
  getRevenueTracking(id: number): Promise<RevenueTracking | undefined>;
  getBookingRevenue(bookingId: number): Promise<RevenueTracking[]>;
  getTotalRevenue(startDate?: string, endDate?: string): Promise<{ total: number; currency: string }>;

  // User preferences operations
  getUserPreferences(userId: number): Promise<UserPreferences | undefined>;
  createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences>;
  updateUserPreferences(userId: number, updates: Partial<UserPreferences>): Promise<UserPreferences | undefined>;

  // Enhanced Hotels operations
  getEnhancedHotels(destinationId: number): Promise<EnhancedHotel[]>;
  getEnhancedHotel(id: number): Promise<EnhancedHotel | undefined>;
  getEnhancedHotelByLiteApiId(liteApiId: string): Promise<EnhancedHotel | undefined>;
  createEnhancedHotel(hotel: InsertEnhancedHotel): Promise<EnhancedHotel>;
  updateEnhancedHotel(id: number, updates: Partial<EnhancedHotel>): Promise<EnhancedHotel | undefined>;
  getBookableHotels(destinationId: number): Promise<EnhancedHotel[]>;

  // Social Media operations
  createSocialMediaContent(content: InsertSocialMediaContent): Promise<SocialMediaContent>;
  getSocialMediaContent(id: number): Promise<SocialMediaContent | undefined>;
  getSocialMediaContentForDestination(destination: string, platform?: string): Promise<SocialMediaContent[]>;
  updateSocialMediaContent(id: number, updates: Partial<SocialMediaContent>): Promise<SocialMediaContent | undefined>;
  
  createDestinationSocialContent(content: InsertDestinationSocialContent): Promise<DestinationSocialContent>;
  getDestinationSocialContent(destinationId: number): Promise<DestinationSocialContent[]>;
  
  createSocialMediaCuration(curation: InsertSocialMediaCuration): Promise<SocialMediaCuration>;
  getSocialMediaCuration(destination: string, platform?: string): Promise<SocialMediaCuration[]>;
  
  createUserSocialInteraction(interaction: InsertUserSocialInteraction): Promise<UserSocialInteraction>;
  getUserSocialInteractions(userId: number): Promise<UserSocialInteraction[]>;
  
  createSocialMediaHashtag(hashtag: InsertSocialMediaHashtag): Promise<SocialMediaHashtag>;
  getTrendingHashtags(destination?: string, platform?: string): Promise<SocialMediaHashtag[]>;
  updateHashtagTrending(hashtag: string, platform: string, uses: number): Promise<SocialMediaHashtag | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private chats: Map<number, Chat>;
  private messages: Map<number, Message>;
  private destinations: Map<number, Destination>;
  private hotels: Map<number, Hotel>;
  private attractions: Map<number, Attraction>;
  private favorites: Map<number, Favorite>;
  private itineraryItems: Map<number, ItineraryItemDb>;
  private agents: Map<number, Agent>;
  private agentTasks: Map<number, AgentTask>;
  private tripPlans: Map<number, TripPlan>;
  private solverResults: Map<number, SolverResult>;
  private solverConstraints: Map<number, SolverConstraint>;
  private hotelBookings: Map<number, HotelBooking>;
  private revenueTracking: Map<number, RevenueTracking>;
  private userPreferences: Map<number, UserPreferences>;
  private enhancedHotels: Map<number, EnhancedHotel>;
  private socialMediaContent: Map<number, SocialMediaContent>;
  private destinationSocialContent: Map<number, DestinationSocialContent>;
  private socialMediaCuration: Map<number, SocialMediaCuration>;
  private userSocialInteractions: Map<number, UserSocialInteraction>;
  private socialMediaHashtags: Map<number, SocialMediaHashtag>;
  private currentUserId: number;
  private currentChatId: number;
  private currentMessageId: number;
  private currentDestinationId: number;
  private currentHotelId: number;
  private currentAttractionId: number;
  private currentFavoriteId: number;
  private currentItineraryItemId: number;
  private currentAgentId: number;
  private currentAgentTaskId: number;
  private currentTripPlanId: number;
  private currentSolverResultId: number;
  private currentSolverConstraintId: number;
  private currentHotelBookingId: number;
  private currentRevenueTrackingId: number;
  private currentUserPreferencesId: number;
  private currentEnhancedHotelId: number;
  private currentSocialMediaContentId: number;
  private currentDestinationSocialContentId: number;
  private currentSocialMediaCurationId: number;
  private currentUserSocialInteractionId: number;
  private currentSocialMediaHashtagId: number;

  constructor() {
    this.users = new Map();
    this.chats = new Map();
    this.messages = new Map();
    this.destinations = new Map();
    this.hotels = new Map();
    this.attractions = new Map();
    this.favorites = new Map();
    this.itineraryItems = new Map();
    this.agents = new Map();
    this.agentTasks = new Map();
    this.tripPlans = new Map();
    this.solverResults = new Map();
    this.solverConstraints = new Map();
    this.hotelBookings = new Map();
    this.revenueTracking = new Map();
    this.userPreferences = new Map();
    this.enhancedHotels = new Map();
    this.socialMediaContent = new Map();
    this.destinationSocialContent = new Map();
    this.socialMediaCuration = new Map();
    this.userSocialInteractions = new Map();
    this.socialMediaHashtags = new Map();
    this.currentUserId = 1;
    this.currentChatId = 1;
    this.currentMessageId = 1;
    this.currentDestinationId = 1;
    this.currentHotelId = 1;
    this.currentAttractionId = 1;
    this.currentFavoriteId = 1;
    this.currentItineraryItemId = 1;
    this.currentAgentId = 1;
    this.currentAgentTaskId = 1;
    this.currentTripPlanId = 1;
    this.currentSolverResultId = 1;
    this.currentSolverConstraintId = 1;
    this.currentHotelBookingId = 1;
    this.currentRevenueTrackingId = 1;
    this.currentUserPreferencesId = 1;
    this.currentEnhancedHotelId = 1;
    this.currentSocialMediaContentId = 1;
    this.currentDestinationSocialContentId = 1;
    this.currentSocialMediaCurationId = 1;
    this.currentUserSocialInteractionId = 1;
    this.currentSocialMediaHashtagId = 1;

    this.initializeData();
  }

  private initializeData() {
    // Create default user
    const defaultUser: User = {
      id: 1,
      username: "marcus",
      password: "password123",
      email: "marcus@example.com",
      name: "Marcus Klein",
      preferredLanguage: "en"
    };
    this.users.set(1, defaultUser);
    this.currentUserId = 2;

    // Create Munich destination
    const munich: Destination = {
      id: 1,
      name: "Munich",
      country: "Germany",
      description: "Bavaria's capital with rich history, beautiful architecture, and world-famous Oktoberfest.",
      imageUrl: "https://images.unsplash.com/photo-1595867818082-083862f3d630?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
      coordinates: { lat: 48.1351, lng: 11.5820 }
    };
    this.destinations.set(1, munich);
    this.currentDestinationId = 2;

    // Create hotels for Munich
    const munichHotels: Hotel[] = [
      {
        id: 1,
        destinationId: 1,
        name: "Hotel Vier Jahreszeiten",
        description: "Luxury hotel in the heart of Munich with exceptional service and elegant rooms.",
        rating: 5,
        pricePerNight: 320,
        imageUrl: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        amenities: ["WiFi", "Spa", "Restaurant", "Bar", "Concierge"],
        coordinates: { lat: 48.1374, lng: 11.5755 }
      },
      {
        id: 2,
        destinationId: 1,
        name: "The Westin Grand Munich",
        description: "Modern business hotel with contemporary design and excellent amenities.",
        rating: 4,
        pricePerNight: 240,
        imageUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        amenities: ["WiFi", "Fitness Center", "Restaurant", "Business Center"],
        coordinates: { lat: 48.1447, lng: 11.5580 }
      }
    ];
    munichHotels.forEach(hotel => this.hotels.set(hotel.id, hotel));
    this.currentHotelId = 3;

    // Create attractions for Munich
    const munichAttractions: Attraction[] = [
      {
        id: 1,
        destinationId: 1,
        name: "Neuschwanstein Castle",
        description: "Fairy-tale castle that inspired Disney's Sleeping Beauty Castle.",
        rating: 5,
        category: "Historical",
        imageUrl: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        coordinates: { lat: 47.5576, lng: 10.7498 },
        distance: "2 hours away"
      },
      {
        id: 2,
        destinationId: 1,
        name: "Viktualienmarkt",
        description: "Famous food market in the heart of Munich with local specialties.",
        rating: 4,
        category: "Market",
        imageUrl: "https://images.unsplash.com/photo-1555992336-03a23692b5ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        coordinates: { lat: 48.1351, lng: 11.5762 },
        distance: "City center"
      },
      {
        id: 3,
        destinationId: 1,
        name: "BMW Museum",
        description: "Iconic museum showcasing BMW's automotive history and innovations.",
        rating: 4,
        category: "Museum",
        imageUrl: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        coordinates: { lat: 48.1761, lng: 11.5594 },
        distance: "20 min by metro"
      }
    ];
    munichAttractions.forEach(attraction => this.attractions.set(attraction.id, attraction));
    this.currentAttractionId = 4;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      preferredLanguage: insertUser.preferredLanguage || 'en'
    };
    this.users.set(id, user);
    return user;
  }

  // Chat operations
  async getUserChats(userId: number): Promise<Chat[]> {
    return Array.from(this.chats.values()).filter(chat => chat.userId === userId);
  }

  async getChat(id: number): Promise<Chat | undefined> {
    return this.chats.get(id);
  }

  async createChat(insertChat: InsertChat): Promise<Chat> {
    const id = this.currentChatId++;
    const now = new Date();
    const chat: Chat = { 
      ...insertChat, 
      id, 
      language: insertChat.language || 'en',
      createdAt: now,
      updatedAt: now
    };
    this.chats.set(id, chat);
    return chat;
  }

  async updateChat(id: number, updates: Partial<Chat>): Promise<Chat | undefined> {
    const chat = this.chats.get(id);
    if (!chat) return undefined;
    
    const updatedChat = { ...chat, ...updates, updatedAt: new Date() };
    this.chats.set(id, updatedChat);
    return updatedChat;
  }

  // Message operations
  async getChatMessages(chatId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.chatId === chatId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const message: Message = { 
      ...insertMessage, 
      id, 
      metadata: insertMessage.metadata || null,
      createdAt: new Date()
    };
    this.messages.set(id, message);
    return message;
  }

  // Destination operations
  async getDestinations(): Promise<Destination[]> {
    return Array.from(this.destinations.values());
  }

  async getDestination(id: number): Promise<Destination | undefined> {
    return this.destinations.get(id);
  }

  async getDestinationByName(name: string): Promise<Destination | undefined> {
    return Array.from(this.destinations.values()).find(
      dest => dest.name.toLowerCase().includes(name.toLowerCase())
    );
  }

  async createDestination(insertDestination: InsertDestination): Promise<Destination> {
    const id = this.currentDestinationId++;
    const destination: Destination = { 
      ...insertDestination, 
      id,
      imageUrl: insertDestination.imageUrl || null,
      coordinates: insertDestination.coordinates || null
    };
    this.destinations.set(id, destination);
    return destination;
  }

  // Hotel operations
  async getDestinationHotels(destinationId: number): Promise<Hotel[]> {
    return Array.from(this.hotels.values()).filter(hotel => hotel.destinationId === destinationId);
  }

  async getHotel(id: number): Promise<Hotel | undefined> {
    return this.hotels.get(id);
  }

  async createHotel(insertHotel: InsertHotel): Promise<Hotel> {
    const id = this.currentHotelId++;
    const hotel: Hotel = { 
      ...insertHotel, 
      id,
      imageUrl: insertHotel.imageUrl || null,
      coordinates: insertHotel.coordinates || null,
      amenities: insertHotel.amenities || null
    };
    this.hotels.set(id, hotel);
    return hotel;
  }

  // Attraction operations
  async getDestinationAttractions(destinationId: number): Promise<Attraction[]> {
    return Array.from(this.attractions.values()).filter(attraction => attraction.destinationId === destinationId);
  }

  async getAttraction(id: number): Promise<Attraction | undefined> {
    return this.attractions.get(id);
  }

  async createAttraction(insertAttraction: InsertAttraction): Promise<Attraction> {
    const id = this.currentAttractionId++;
    const attraction: Attraction = { 
      ...insertAttraction, 
      id,
      imageUrl: insertAttraction.imageUrl || null,
      coordinates: insertAttraction.coordinates || null,
      distance: insertAttraction.distance || null
    };
    this.attractions.set(id, attraction);
    return attraction;
  }

  // Favorites operations
  async getUserFavorites(userId: number): Promise<Favorite[]> {
    return Array.from(this.favorites.values()).filter(favorite => favorite.userId === userId);
  }

  async createFavorite(insertFavorite: InsertFavorite): Promise<Favorite> {
    const id = this.currentFavoriteId++;
    const favorite: Favorite = { 
      ...insertFavorite, 
      id,
      createdAt: new Date(),
      itemData: insertFavorite.itemData || {}
    };
    this.favorites.set(id, favorite);
    return favorite;
  }

  async deleteFavorite(userId: number, itemId: string): Promise<boolean> {
    const favorite = Array.from(this.favorites.values()).find(f => 
      f.userId === userId && f.itemId === itemId
    );
    if (favorite) {
      this.favorites.delete(favorite.id);
      return true;
    }
    return false;
  }

  // Itinerary operations
  async getChatItineraryItems(chatId: number): Promise<ItineraryItemDb[]> {
    return Array.from(this.itineraryItems.values()).filter(item => item.chatId === chatId);
  }

  async createItineraryItem(insertItem: InsertItineraryItemDb): Promise<ItineraryItemDb> {
    const id = this.currentItineraryItemId++;
    const item: ItineraryItemDb = { 
      ...insertItem, 
      id,
      createdAt: new Date(),
      itemData: insertItem.itemData || {},
      day: insertItem.day || null,
      order: insertItem.order || null,
      notes: insertItem.notes || null
    };
    this.itineraryItems.set(id, item);
    return item;
  }

  async deleteItineraryItem(id: number): Promise<boolean> {
    if (this.itineraryItems.has(id)) {
      this.itineraryItems.delete(id);
      return true;
    }
    return false;
  }

  // Agent operations
  async getAgents(): Promise<Agent[]> {
    return Array.from(this.agents.values());
  }

  async getAgent(id: number): Promise<Agent | undefined> {
    return this.agents.get(id);
  }

  async createAgent(insertAgent: InsertAgent): Promise<Agent> {
    const id = this.currentAgentId++;
    const agent: Agent = { 
      ...insertAgent, 
      id,
      createdAt: new Date(),
      status: insertAgent.status || "active",
      config: insertAgent.config || null
    };
    this.agents.set(id, agent);
    return agent;
  }

  async updateAgentStatus(id: number, status: string): Promise<Agent | undefined> {
    const agent = this.agents.get(id);
    if (agent) {
      const updatedAgent = { ...agent, status };
      this.agents.set(id, updatedAgent);
      return updatedAgent;
    }
    return undefined;
  }

  // Agent Task operations
  async createAgentTask(insertTask: InsertAgentTask): Promise<AgentTask> {
    const id = this.currentAgentTaskId++;
    const task: AgentTask = { 
      ...insertTask, 
      id,
      createdAt: new Date(),
      status: insertTask.status || "pending",
      agentId: insertTask.agentId || null,
      chatId: insertTask.chatId || null,
      output: insertTask.output || null,
      executedAt: null,
      completedAt: null,
      error: null
    };
    this.agentTasks.set(id, task);
    return task;
  }

  async getAgentTask(id: number): Promise<AgentTask | undefined> {
    return this.agentTasks.get(id);
  }

  async getAgentTasks(agentId: number): Promise<AgentTask[]> {
    return Array.from(this.agentTasks.values()).filter(task => task.agentId === agentId);
  }

  async getChatAgentTasks(chatId: number): Promise<AgentTask[]> {
    return Array.from(this.agentTasks.values()).filter(task => task.chatId === chatId);
  }

  async updateAgentTask(id: number, updates: Partial<AgentTask>): Promise<AgentTask | undefined> {
    const task = this.agentTasks.get(id);
    if (task) {
      const updatedTask = { ...task, ...updates };
      this.agentTasks.set(id, updatedTask);
      return updatedTask;
    }
    return undefined;
  }

  // Trip Plan operations
  async createTripPlan(insertPlan: InsertTripPlan): Promise<TripPlan> {
    const id = this.currentTripPlanId++;
    const plan: TripPlan = { 
      ...insertPlan, 
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: insertPlan.status || "draft",
      chatId: insertPlan.chatId || null,
      userId: insertPlan.userId || null,
      preferences: insertPlan.preferences || null,
      generatedPlan: insertPlan.generatedPlan || null,
      startDate: insertPlan.startDate || null,
      endDate: insertPlan.endDate || null,
      budget: insertPlan.budget || null,
      currency: insertPlan.currency || "EUR"
    };
    this.tripPlans.set(id, plan);
    return plan;
  }

  async getTripPlan(id: number): Promise<TripPlan | undefined> {
    return this.tripPlans.get(id);
  }

  async getChatTripPlan(chatId: number): Promise<TripPlan | undefined> {
    return Array.from(this.tripPlans.values()).find(plan => plan.chatId === chatId);
  }

  async updateTripPlan(id: number, updates: Partial<TripPlan>): Promise<TripPlan | undefined> {
    const plan = this.tripPlans.get(id);
    if (plan) {
      const updatedPlan = { ...plan, ...updates, updatedAt: new Date(), currency: updates.currency || plan.currency || "EUR" };
      this.tripPlans.set(id, updatedPlan);
      return updatedPlan;
    }
    return undefined;
  }

  // Solver operations
  async createSolverResult(insertResult: InsertSolverResult): Promise<SolverResult> {
    const id = this.currentSolverResultId++;
    const result: SolverResult = { 
      ...insertResult, 
      id,
      createdAt: new Date(),
      chatId: insertResult.chatId || null,
      tripPlanId: insertResult.tripPlanId || null,
      solution: insertResult.solution || null,
      unsatCore: insertResult.unsatCore || null,
      executionTime: insertResult.executionTime || null,
      errorMessage: insertResult.errorMessage || null
    };
    this.solverResults.set(id, result);
    return result;
  }

  async getSolverResult(id: number): Promise<SolverResult | undefined> {
    return this.solverResults.get(id);
  }

  async getChatSolverResults(chatId: number): Promise<SolverResult[]> {
    return Array.from(this.solverResults.values()).filter(result => result.chatId === chatId);
  }

  async getTripPlanSolverResults(tripPlanId: number): Promise<SolverResult[]> {
    return Array.from(this.solverResults.values()).filter(result => result.tripPlanId === tripPlanId);
  }

  async createSolverConstraint(insertConstraint: InsertSolverConstraint): Promise<SolverConstraint> {
    const id = this.currentSolverConstraintId++;
    const constraint: SolverConstraint = { 
      ...insertConstraint, 
      id,
      metadata: insertConstraint.metadata || null,
      solverResultId: insertConstraint.solverResultId || null,
      priority: insertConstraint.priority || null,
      isHard: insertConstraint.isHard || null
    };
    this.solverConstraints.set(id, constraint);
    return constraint;
  }

  async getSolverConstraints(solverResultId: number): Promise<SolverConstraint[]> {
    return Array.from(this.solverConstraints.values()).filter(constraint => constraint.solverResultId === solverResultId);
  }

  // LiteAPI Booking operations
  async createHotelBooking(insertBooking: InsertHotelBooking): Promise<HotelBooking> {
    const id = this.currentHotelBookingId++;
    const booking: HotelBooking = { 
      ...insertBooking, 
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      currency: insertBooking.currency || 'EUR',
      userId: insertBooking.userId || null,
      chatId: insertBooking.chatId || null,
      tripPlanId: insertBooking.tripPlanId || null,
      commission: insertBooking.commission || null,
      commissionPercentage: insertBooking.commissionPercentage || null,
      cancellationPolicy: insertBooking.cancellationPolicy || null,
      paymentStatus: insertBooking.paymentStatus || null,
      specialRequests: insertBooking.specialRequests || null,
      metadata: insertBooking.metadata || null
    };
    this.hotelBookings.set(id, booking);
    return booking;
  }

  async getHotelBooking(id: number): Promise<HotelBooking | undefined> {
    return this.hotelBookings.get(id);
  }

  async getHotelBookingByLiteApiId(liteApiBookingId: string): Promise<HotelBooking | undefined> {
    return Array.from(this.hotelBookings.values()).find(booking => booking.liteApiBookingId === liteApiBookingId);
  }

  async getUserHotelBookings(userId: number): Promise<HotelBooking[]> {
    return Array.from(this.hotelBookings.values()).filter(booking => booking.userId === userId);
  }

  async getChatHotelBookings(chatId: number): Promise<HotelBooking[]> {
    return Array.from(this.hotelBookings.values()).filter(booking => booking.chatId === chatId);
  }

  async updateHotelBooking(id: number, updates: Partial<HotelBooking>): Promise<HotelBooking | undefined> {
    const booking = this.hotelBookings.get(id);
    if (!booking) return undefined;

    const updatedBooking = { ...booking, ...updates, updatedAt: new Date() };
    this.hotelBookings.set(id, updatedBooking);
    return updatedBooking;
  }

  // Revenue tracking operations
  async createRevenueTracking(insertRevenue: InsertRevenueTracking): Promise<RevenueTracking> {
    const id = this.currentRevenueTrackingId++;
    const revenue: RevenueTracking = { 
      ...insertRevenue, 
      id,
      createdAt: new Date(),
      currency: insertRevenue.currency || 'EUR',
      bookingId: insertRevenue.bookingId || null,
      percentage: insertRevenue.percentage || null,
      status: insertRevenue.status || null,
      payoutDate: insertRevenue.payoutDate || null,
      metadata: insertRevenue.metadata || null
    };
    this.revenueTracking.set(id, revenue);
    return revenue;
  }

  async getRevenueTracking(id: number): Promise<RevenueTracking | undefined> {
    return this.revenueTracking.get(id);
  }

  async getBookingRevenue(bookingId: number): Promise<RevenueTracking[]> {
    return Array.from(this.revenueTracking.values()).filter(revenue => revenue.bookingId === bookingId);
  }

  async getTotalRevenue(startDate?: string, endDate?: string): Promise<{ total: number; currency: string }> {
    let revenues = Array.from(this.revenueTracking.values());
    
    if (startDate) {
      revenues = revenues.filter(revenue => revenue.createdAt >= new Date(startDate));
    }
    if (endDate) {
      revenues = revenues.filter(revenue => revenue.createdAt <= new Date(endDate));
    }
    
    const total = revenues.reduce((sum, revenue) => sum + parseFloat(revenue.amount), 0);
    return { total, currency: 'EUR' };
  }

  // User preferences operations
  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    return Array.from(this.userPreferences.values()).find(pref => pref.userId === userId);
  }

  async createUserPreferences(insertPreferences: InsertUserPreferences): Promise<UserPreferences> {
    const id = this.currentUserPreferencesId++;
    const preferences: UserPreferences = { 
      ...insertPreferences, 
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: insertPreferences.userId || null,
      accommodationType: insertPreferences.accommodationType || null,
      priceRange: insertPreferences.priceRange || null,
      amenities: insertPreferences.amenities || null,
      roomType: insertPreferences.roomType || null,
      boardType: insertPreferences.boardType || null,
      currency: insertPreferences.currency || null,
      language: insertPreferences.language || null,
      notifications: insertPreferences.notifications || null,
      paymentMethods: insertPreferences.paymentMethods || null
    };
    this.userPreferences.set(id, preferences);
    return preferences;
  }

  async updateUserPreferences(userId: number, updates: Partial<UserPreferences>): Promise<UserPreferences | undefined> {
    const preferences = Array.from(this.userPreferences.values()).find(pref => pref.userId === userId);
    if (!preferences) return undefined;

    const updatedPreferences = { ...preferences, ...updates, updatedAt: new Date() };
    this.userPreferences.set(preferences.id, updatedPreferences);
    return updatedPreferences;
  }

  // Enhanced Hotels operations
  async getEnhancedHotels(destinationId: number): Promise<EnhancedHotel[]> {
    return Array.from(this.enhancedHotels.values()).filter(hotel => hotel.destinationId === destinationId);
  }

  async getEnhancedHotel(id: number): Promise<EnhancedHotel | undefined> {
    return this.enhancedHotels.get(id);
  }

  async getEnhancedHotelByLiteApiId(liteApiId: string): Promise<EnhancedHotel | undefined> {
    return Array.from(this.enhancedHotels.values()).find(hotel => hotel.liteApiId === liteApiId);
  }

  async createEnhancedHotel(insertHotel: InsertEnhancedHotel): Promise<EnhancedHotel> {
    const id = this.currentEnhancedHotelId++;
    const hotel: EnhancedHotel = { 
      ...insertHotel, 
      id,
      lastUpdated: new Date(),
      destinationId: insertHotel.destinationId || null,
      imageUrl: insertHotel.imageUrl || null,
      amenities: insertHotel.amenities || null,
      coordinates: insertHotel.coordinates || null,
      liteApiId: insertHotel.liteApiId || null,
      bookable: insertHotel.bookable || null,
      commissionRate: insertHotel.commissionRate || null,
      provider: insertHotel.provider || null,
      availabilityCache: insertHotel.availabilityCache || null,
      priceCache: insertHotel.priceCache || null
    };
    this.enhancedHotels.set(id, hotel);
    return hotel;
  }

  async updateEnhancedHotel(id: number, updates: Partial<EnhancedHotel>): Promise<EnhancedHotel | undefined> {
    const hotel = this.enhancedHotels.get(id);
    if (!hotel) return undefined;

    const updatedHotel = { ...hotel, ...updates, lastUpdated: new Date() };
    this.enhancedHotels.set(id, updatedHotel);
    return updatedHotel;
  }

  async getBookableHotels(destinationId: number): Promise<EnhancedHotel[]> {
    return Array.from(this.enhancedHotels.values()).filter(hotel => 
      hotel.destinationId === destinationId && hotel.bookable === true
    );
  }

  // Social Media operations
  async createSocialMediaContent(insertContent: InsertSocialMediaContent): Promise<SocialMediaContent> {
    const id = this.currentSocialMediaContentId++;
    const content: SocialMediaContent = { 
      ...insertContent, 
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      authorDisplayName: insertContent.authorDisplayName || null,
      authorAvatar: insertContent.authorAvatar || null,
      authorFollowers: insertContent.authorFollowers || null,
      caption: insertContent.caption || null,
      hashtags: insertContent.hashtags || null,
      mentions: insertContent.mentions || null,
      thumbnailUrl: insertContent.thumbnailUrl || null,
      viewCount: insertContent.viewCount || null,
      likeCount: insertContent.likeCount || null,
      commentCount: insertContent.commentCount || null,
      shareCount: insertContent.shareCount || null
    };
    this.socialMediaContent.set(id, content);
    return content;
  }

  async getSocialMediaContent(id: number): Promise<SocialMediaContent | undefined> {
    return this.socialMediaContent.get(id);
  }

  async getSocialMediaContentForDestination(destination: string, platform?: string): Promise<SocialMediaContent[]> {
    const destinationLinks = Array.from(this.destinationSocialContent.values())
      .filter(link => link.locationName.toLowerCase().includes(destination.toLowerCase()));
    
    const contentIds = destinationLinks.map(link => link.socialContentId);
    let contents = Array.from(this.socialMediaContent.values())
      .filter(content => contentIds.includes(content.id));
    
    if (platform) {
      contents = contents.filter(content => content.platform === platform);
    }
    
    return contents;
  }

  async updateSocialMediaContent(id: number, updates: Partial<SocialMediaContent>): Promise<SocialMediaContent | undefined> {
    const content = this.socialMediaContent.get(id);
    if (!content) return undefined;

    const updatedContent = { ...content, ...updates, updatedAt: new Date() };
    this.socialMediaContent.set(id, updatedContent);
    return updatedContent;
  }

  async createDestinationSocialContent(insertContent: InsertDestinationSocialContent): Promise<DestinationSocialContent> {
    const id = this.currentDestinationSocialContentId++;
    const content: DestinationSocialContent = { 
      ...insertContent, 
      id,
      createdAt: new Date(),
      socialContentId: insertContent.socialContentId || null,
      destinationId: insertContent.destinationId || null,
      coordinates: insertContent.coordinates || null,
      relevanceScore: insertContent.relevanceScore || null,
      contentTags: insertContent.contentTags || null,
      extractedLocations: insertContent.extractedLocations || null,
      isVerified: insertContent.isVerified || null,
      moderationStatus: insertContent.moderationStatus || null
    };
    this.destinationSocialContent.set(id, content);
    return content;
  }

  async getDestinationSocialContent(destinationId: number): Promise<DestinationSocialContent[]> {
    return Array.from(this.destinationSocialContent.values()).filter(content => content.destinationId === destinationId);
  }

  async createSocialMediaCuration(insertCuration: InsertSocialMediaCuration): Promise<SocialMediaCuration> {
    const id = this.currentSocialMediaCurationId++;
    const curation: SocialMediaCuration = { 
      ...insertCuration, 
      id,
      curatedAt: new Date(),
      contentIds: insertCuration.contentIds || null,
      expiresAt: insertCuration.expiresAt || null,
      metadata: insertCuration.metadata || null
    };
    this.socialMediaCuration.set(id, curation);
    return curation;
  }

  async getSocialMediaCuration(destination: string, platform?: string): Promise<SocialMediaCuration[]> {
    let curations = Array.from(this.socialMediaCuration.values())
      .filter(curation => curation.destinationName.toLowerCase().includes(destination.toLowerCase()));
    
    if (platform) {
      curations = curations.filter(curation => curation.platform.includes(platform));
    }
    
    return curations;
  }

  async createUserSocialInteraction(insertInteraction: InsertUserSocialInteraction): Promise<UserSocialInteraction> {
    const id = this.currentUserSocialInteractionId++;
    const interaction: UserSocialInteraction = { 
      ...insertInteraction, 
      id,
      createdAt: new Date(),
      socialContentId: insertInteraction.socialContentId || null,
      userId: insertInteraction.userId || null,
      interactionData: insertInteraction.interactionData || null
    };
    this.userSocialInteractions.set(id, interaction);
    return interaction;
  }

  async getUserSocialInteractions(userId: number): Promise<UserSocialInteraction[]> {
    return Array.from(this.userSocialInteractions.values()).filter(interaction => interaction.userId === userId);
  }

  async createSocialMediaHashtag(insertHashtag: InsertSocialMediaHashtag): Promise<SocialMediaHashtag> {
    const id = this.currentSocialMediaHashtagId++;
    const hashtag: SocialMediaHashtag = { 
      ...insertHashtag, 
      id,
      lastUpdated: new Date(),
      totalUses: insertHashtag.totalUses || null,
      trendingScore: insertHashtag.trendingScore || null,
      relatedDestinations: insertHashtag.relatedDestinations || null
    };
    this.socialMediaHashtags.set(id, hashtag);
    return hashtag;
  }

  async getTrendingHashtags(destination?: string, platform?: string): Promise<SocialMediaHashtag[]> {
    let hashtags = Array.from(this.socialMediaHashtags.values());
    
    if (destination) {
      hashtags = hashtags.filter(hashtag => 
        hashtag.relatedDestinations?.some(dest => dest.toLowerCase().includes(destination.toLowerCase()))
      );
    }
    
    if (platform) {
      hashtags = hashtags.filter(hashtag => hashtag.platform === platform);
    }
    
    return hashtags.sort((a, b) => (parseFloat(b.trendingScore || '0') - parseFloat(a.trendingScore || '0')));
  }

  async updateHashtagTrending(hashtag: string, platform: string, uses: number): Promise<SocialMediaHashtag | undefined> {
    const existingHashtag = Array.from(this.socialMediaHashtags.values())
      .find(h => h.hashtag === hashtag && h.platform === platform);
    
    if (existingHashtag) {
      const updatedHashtag = { 
        ...existingHashtag, 
        totalUses: uses,
        trendingScore: (uses / 1000).toString(), // Simple trending score calculation
        lastUpdated: new Date()
      };
      this.socialMediaHashtags.set(existingHashtag.id, updatedHashtag);
      return updatedHashtag;
    }
    
    return undefined;
  }
}

export const storage = new MemStorage();
