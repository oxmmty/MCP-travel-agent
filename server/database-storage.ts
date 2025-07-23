import { eq, and, desc } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  chats,
  messages,
  destinations,
  hotels,
  attractions,
  favorites,
  itineraryItems,
  agents,
  agentTasks,
  tripPlans,
  travelMoods,
  tripSharingSettings,
  tripInvitations,
  anonymousTripSessions,
  chatSharingSettings,
  chatInvitations,
  anonymousChatSessions,
  type User,
  type InsertUser,
  type Chat,
  type InsertChat,
  type Message,
  type InsertMessage,
  type Destination,
  type InsertDestination,
  type Hotel,
  type InsertHotel,
  type Attraction,
  type InsertAttraction,
  type Favorite,
  type InsertFavorite,
  type ItineraryItemDb,
  type InsertItineraryItemDb,
  type Agent,
  type InsertAgent,
  type AgentTask,
  type InsertAgentTask,
  type TripPlan,
  type InsertTripPlan,
  type TravelMood,
  type TripSharingSettings,
  type InsertTripSharingSettings,
  type TripInvitation,
  type InsertTripInvitation,
  type AnonymousTripSession,
  type InsertAnonymousTripSession,
  type ChatSharingSettings,
  type InsertChatSharingSettings,
  type ChatInvitation,
  type InsertChatInvitation,
  type AnonymousChatSession,
  type InsertAnonymousChatSession,
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;

  // Chat operations
  createChat(chat: InsertChat): Promise<Chat>;
  getUserChats(userId: string): Promise<Chat[]>;
  getChat(id: number): Promise<Chat | undefined>;
  updateChat(id: number, updates: Partial<InsertChat>): Promise<Chat>;
  deleteChat(id: number, userId: string): Promise<void>;

  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getChatMessages(chatId: number): Promise<Message[]>;
  getLastMessage(chatId: number): Promise<Message | undefined>;

  // Destination operations
  createDestination(destination: InsertDestination): Promise<Destination>;
  getDestinations(userId?: string): Promise<Destination[]>;
  getDestination(id: number): Promise<Destination | undefined>;
  getDestinationByName(name: string, userId?: string): Promise<Destination | undefined>;
  searchDestinations(query: string, userId?: string): Promise<Destination[]>;

  // Hotel operations
  createHotel(hotel: InsertHotel): Promise<Hotel>;
  getDestinationHotels(destinationId: number, userId?: string): Promise<Hotel[]>;
  getHotel(id: number): Promise<Hotel | undefined>;

  // Attraction operations
  createAttraction(attraction: InsertAttraction): Promise<Attraction>;
  getDestinationAttractions(destinationId: number, userId?: string): Promise<Attraction[]>;
  getAttraction(id: number): Promise<Attraction | undefined>;

  // Favorites operations
  createFavorite(favorite: InsertFavorite): Promise<Favorite>;
  getUserFavorites(userId: string): Promise<Favorite[]>;
  deleteFavorite(userId: string, itemId: string): Promise<boolean>;
  removeFavorite(id: number, userId: string): Promise<void>;
  getFavoriteByItem(userId: string, itemType: string, itemId: string): Promise<Favorite | undefined>;

  // Itinerary operations
  createItineraryItem(item: InsertItineraryItemDb): Promise<ItineraryItemDb>;
  getChatItineraryItems(chatId: number): Promise<ItineraryItemDb[]>;
  updateItineraryItem(id: number, updates: Partial<InsertItineraryItemDb>): Promise<ItineraryItemDb>;
  removeItineraryItem(id: number): Promise<void>;

  // Travel mood operations
  getTravelMoods(): Promise<TravelMood[]>;
  getTravelMood(id: number): Promise<TravelMood | undefined>;

  // Agent operations
  createAgent(agent: InsertAgent): Promise<Agent>;
  getAgents(): Promise<Agent[]>;
  getAgent(id: number): Promise<Agent | undefined>;

  // Agent task operations
  createAgentTask(task: InsertAgentTask): Promise<AgentTask>;
  getChatAgentTasks(chatId: number): Promise<AgentTask[]>;
  updateAgentTask(id: number, updates: Partial<InsertAgentTask>): Promise<AgentTask>;

  // Trip plan operations
  createTripPlan(tripPlan: InsertTripPlan): Promise<TripPlan>;
  getUserTripPlans(userId: string): Promise<TripPlan[]>;
  getTripPlan(id: number): Promise<TripPlan | undefined>;
  updateTripPlan(id: number, updates: Partial<InsertTripPlan>): Promise<TripPlan>;

  // Trip sharing operations
  createTripSharingSettings(settings: InsertTripSharingSettings): Promise<TripSharingSettings>;
  getTripSharingSettings(tripPlanId: number): Promise<TripSharingSettings | undefined>;
  getTripSharingSettingsByToken(accessToken: string): Promise<TripSharingSettings | undefined>;
  updateTripSharingSettings(id: number, updates: Partial<InsertTripSharingSettings>): Promise<TripSharingSettings>;
  
  // Trip invitation operations
  createTripInvitation(invitation: InsertTripInvitation): Promise<TripInvitation>;
  getTripInvitations(tripPlanId: number): Promise<TripInvitation[]>;
  getTripInvitationByToken(token: string): Promise<TripInvitation | undefined>;
  getTripInvitationByEmail(tripPlanId: number, email: string): Promise<TripInvitation | undefined>;
  updateTripInvitation(id: number, updates: Partial<InsertTripInvitation>): Promise<TripInvitation>;
  
  // Anonymous session operations
  createAnonymousSession(session: InsertAnonymousTripSession): Promise<AnonymousTripSession>;
  getAnonymousSession(sessionToken: string): Promise<AnonymousTripSession | undefined>;
  updateAnonymousSession(id: number, updates: Partial<InsertAnonymousTripSession>): Promise<AnonymousTripSession>;

  // Chat sharing operations
  createChatSharingSettings(settings: InsertChatSharingSettings): Promise<ChatSharingSettings>;
  getChatSharingSettings(chatId: number): Promise<ChatSharingSettings | undefined>;
  getChatSharingSettingsByToken(accessToken: string): Promise<ChatSharingSettings | undefined>;
  updateChatSharingSettings(id: number, updates: Partial<InsertChatSharingSettings>): Promise<ChatSharingSettings>;
  
  // Chat invitation operations
  createChatInvitation(invitation: InsertChatInvitation): Promise<ChatInvitation>;
  getChatInvitations(chatId: number): Promise<ChatInvitation[]>;
  getChatInvitationByToken(token: string): Promise<ChatInvitation | undefined>;
  getChatInvitationByEmail(chatId: number, email: string): Promise<ChatInvitation | undefined>;
  updateChatInvitation(id: number, updates: Partial<InsertChatInvitation>): Promise<ChatInvitation>;
  
  // Anonymous chat session operations
  createAnonymousChatSession(session: InsertAnonymousChatSession): Promise<AnonymousChatSession>;
  getAnonymousChatSession(sessionToken: string): Promise<AnonymousChatSession | undefined>;
  updateAnonymousChatSession(id: number, updates: Partial<InsertAnonymousChatSession>): Promise<AnonymousChatSession>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Chat operations
  async createChat(chatData: InsertChat): Promise<Chat> {
    const [chat] = await db.insert(chats).values({
      ...chatData,
      travelMoodId: chatData.travelMoodId || null,
      moodSelectedAt: chatData.moodSelectedAt || null,
    }).returning();
    return chat;
  }

  async getUserChats(userId: string): Promise<Chat[]> {
    return await db
      .select()
      .from(chats)
      .where(eq(chats.userId, userId))
      .orderBy(desc(chats.updatedAt));
  }

  async getChat(id: number): Promise<Chat | undefined> {
    const [chat] = await db.select().from(chats).where(eq(chats.id, id)).limit(1);
    return chat;
  }

  async updateChat(id: number, updates: Partial<InsertChat>): Promise<Chat> {
    const [chat] = await db
      .update(chats)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(chats.id, id))
      .returning();
    return chat;
  }

  async deleteChat(id: number, userId: string): Promise<void> {
    await db.delete(chats).where(and(eq(chats.id, id), eq(chats.userId, userId)));
  }

  // Message operations
  async createMessage(messageData: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(messageData).returning();
    return message;
  }

  async getChatMessages(chatId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(messages.createdAt);
  }

  async getLastMessage(chatId: number): Promise<Message | undefined> {
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(desc(messages.createdAt))
      .limit(1);
    return message;
  }

  // Destination operations
  async createDestination(destinationData: InsertDestination): Promise<Destination> {
    const [destination] = await db.insert(destinations).values({
      ...destinationData,
      createdAt: new Date(),
      isGlobal: destinationData.isGlobal || false,
    }).returning();
    return destination;
  }

  async getDestinations(userId?: string): Promise<Destination[]> {
    if (userId) {
      // Return both user's destinations and global destinations
      return await db
        .select()
        .from(destinations)
        .where(
          eq(destinations.userId, userId)
        );
    } else {
      // Return only global destinations
      return await db
        .select()
        .from(destinations)
        .where(eq(destinations.isGlobal, true));
    }
  }

  async getDestination(id: number): Promise<Destination | undefined> {
    const [destination] = await db.select().from(destinations).where(eq(destinations.id, id)).limit(1);
    return destination;
  }

  async getDestinationByName(name: string, userId?: string): Promise<Destination | undefined> {
    if (userId) {
      // Check user's destinations first, then global destinations
      const [destination] = await db
        .select()
        .from(destinations)
        .where(
          and(
            eq(destinations.name, name),
            eq(destinations.userId, userId)
          )
        )
        .limit(1);
      
      if (destination) return destination;
      
      // If not found in user's destinations, check global destinations
      const [globalDestination] = await db
        .select()
        .from(destinations)
        .where(
          and(
            eq(destinations.name, name),
            eq(destinations.isGlobal, true)
          )
        )
        .limit(1);
      
      return globalDestination;
    } else {
      // Only check global destinations
      const [destination] = await db
        .select()
        .from(destinations)
        .where(
          and(
            eq(destinations.name, name),
            eq(destinations.isGlobal, true)
          )
        )
        .limit(1);
      
      return destination;
    }
  }

  async searchDestinations(query: string, userId?: string): Promise<Destination[]> {
    // Simple search implementation - can be enhanced with full-text search
    const searchQuery = `%${query.toLowerCase()}%`;
    
    if (userId) {
      return await db
        .select()
        .from(destinations)
        .where(
          and(
            eq(destinations.userId, userId),
          )
        );
    } else {
      return await db
        .select()
        .from(destinations)
        .where(eq(destinations.isGlobal, true));
    }
  }

  // Hotel operations
  async createHotel(hotelData: InsertHotel): Promise<Hotel> {
    const [hotel] = await db.insert(hotels).values({
      ...hotelData,
      createdAt: new Date(),
      isGlobal: hotelData.isGlobal || false,
    }).returning();
    return hotel;
  }

  async getDestinationHotels(destinationId: number, userId?: string): Promise<Hotel[]> {
    if (userId) {
      return await db
        .select()
        .from(hotels)
        .where(
          and(
            eq(hotels.destinationId, destinationId),
            eq(hotels.userId, userId)
          )
        );
    } else {
      return await db
        .select()
        .from(hotels)
        .where(
          and(
            eq(hotels.destinationId, destinationId),
            eq(hotels.isGlobal, true)
          )
        );
    }
  }

  async getHotel(id: number): Promise<Hotel | undefined> {
    const [hotel] = await db.select().from(hotels).where(eq(hotels.id, id)).limit(1);
    return hotel;
  }

  // Attraction operations
  async createAttraction(attractionData: InsertAttraction): Promise<Attraction> {
    const [attraction] = await db.insert(attractions).values({
      ...attractionData,
      createdAt: new Date(),
      isGlobal: attractionData.isGlobal || false,
    }).returning();
    return attraction;
  }

  async getDestinationAttractions(destinationId: number, userId?: string): Promise<Attraction[]> {
    if (userId) {
      return await db
        .select()
        .from(attractions)
        .where(
          and(
            eq(attractions.destinationId, destinationId),
            eq(attractions.userId, userId)
          )
        );
    } else {
      return await db
        .select()
        .from(attractions)
        .where(
          and(
            eq(attractions.destinationId, destinationId),
            eq(attractions.isGlobal, true)
          )
        );
    }
  }

  async getAttraction(id: number): Promise<Attraction | undefined> {
    const [attraction] = await db.select().from(attractions).where(eq(attractions.id, id)).limit(1);
    return attraction;
  }

  // Favorites operations
  async createFavorite(favoriteData: InsertFavorite): Promise<Favorite> {
    const [favorite] = await db.insert(favorites).values(favoriteData).returning();
    return favorite;
  }

  async getUserFavorites(userId: string): Promise<Favorite[]> {
    return await db
      .select()
      .from(favorites)
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.createdAt));
  }

  async deleteFavorite(userId: string, placeId: string): Promise<boolean> {
    const result = await db
      .delete(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.placeId, placeId)))
      .returning({ id: favorites.id });
    
    return result.length > 0;
  }

  async removeFavorite(id: number, userId: string): Promise<void> {
    await db.delete(favorites).where(and(eq(favorites.id, id), eq(favorites.userId, userId)));
  }

  async getFavoriteByItem(userId: string, itemType: string, itemId: string): Promise<Favorite | undefined> {
    const [favorite] = await db
      .select()
      .from(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.itemType, itemType),
          eq(favorites.placeId, itemId)
        )
      )
      .limit(1);
    return favorite;
  }

  // Itinerary operations
  async createItineraryItem(itemData: InsertItineraryItemDb): Promise<ItineraryItemDb> {
    const [item] = await db.insert(itineraryItems).values(itemData).returning();
    return item;
  }

  async getChatItineraryItems(chatId: number): Promise<ItineraryItemDb[]> {
    return await db
      .select()
      .from(itineraryItems)
      .where(eq(itineraryItems.chatId, chatId))
      .orderBy(itineraryItems.day, itineraryItems.order);
  }

  async updateItineraryItem(id: number, updates: Partial<InsertItineraryItemDb>): Promise<ItineraryItemDb> {
    const [item] = await db
      .update(itineraryItems)
      .set(updates)
      .where(eq(itineraryItems.id, id))
      .returning();
    return item;
  }

  async removeItineraryItem(id: number): Promise<void> {
    await db.delete(itineraryItems).where(eq(itineraryItems.id, id));
  }

  // Travel mood operations
  async getTravelMoods(): Promise<TravelMood[]> {
    return await db.select().from(travelMoods);
  }

  async getTravelMood(id: number): Promise<TravelMood | undefined> {
    const [mood] = await db.select().from(travelMoods).where(eq(travelMoods.id, id)).limit(1);
    return mood;
  }

  // Agent operations
  async createAgent(agentData: InsertAgent): Promise<Agent> {
    const [agent] = await db.insert(agents).values(agentData).returning();
    return agent;
  }

  async getAgents(): Promise<Agent[]> {
    return await db.select().from(agents);
  }

  async getAgent(id: number): Promise<Agent | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.id, id)).limit(1);
    return agent;
  }

  // Agent task operations
  async createAgentTask(taskData: InsertAgentTask): Promise<AgentTask> {
    const [task] = await db.insert(agentTasks).values(taskData).returning();
    return task;
  }

  async getChatAgentTasks(chatId: number): Promise<AgentTask[]> {
    return await db
      .select()
      .from(agentTasks)
      .where(eq(agentTasks.chatId, chatId))
      .orderBy(agentTasks.createdAt);
  }

  async updateAgentTask(id: number, updates: Partial<InsertAgentTask>): Promise<AgentTask> {
    const [task] = await db
      .update(agentTasks)
      .set(updates)
      .where(eq(agentTasks.id, id))
      .returning();
    return task;
  }

  // Trip plan operations
  async createTripPlan(tripPlanData: InsertTripPlan): Promise<TripPlan> {
    const [tripPlan] = await db.insert(tripPlans).values(tripPlanData).returning();
    return tripPlan;
  }

  async getUserTripPlans(userId: string): Promise<TripPlan[]> {
    return await db
      .select()
      .from(tripPlans)
      .where(eq(tripPlans.userId, userId))
      .orderBy(desc(tripPlans.updatedAt));
  }

  async getTripPlan(id: number): Promise<TripPlan | undefined> {
    const [tripPlan] = await db.select().from(tripPlans).where(eq(tripPlans.id, id)).limit(1);
    return tripPlan;
  }

  async updateTripPlan(id: number, updates: Partial<InsertTripPlan>): Promise<TripPlan> {
    const [tripPlan] = await db
      .update(tripPlans)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tripPlans.id, id))
      .returning();
    return tripPlan;
  }

  async getChatTripPlan(chatId: number): Promise<TripPlan | undefined> {
    const [tripPlan] = await db
      .select()
      .from(tripPlans)
      .where(eq(tripPlans.chatId, chatId))
      .limit(1);
    return tripPlan;
  }

  async deleteTripPlan(id: number): Promise<boolean> {
    const result = await db
      .delete(tripPlans)
      .where(eq(tripPlans.id, id))
      .returning({ id: tripPlans.id });
    
    return result.length > 0;
  }

  async deleteItineraryItem(id: number): Promise<boolean> {
    const result = await db
      .delete(itineraryItems)
      .where(eq(itineraryItems.id, id))
      .returning({ id: itineraryItems.id });
    
    return result.length > 0;
  }

  async getItineraryItem(id: number): Promise<ItineraryItemDb | undefined> {
    const [item] = await db
      .select()
      .from(itineraryItems)
      .where(eq(itineraryItems.id, id))
      .limit(1);
    return item;
  }

  // Trip sharing operations
  async createTripSharingSettings(settings: InsertTripSharingSettings): Promise<TripSharingSettings> {
    const [sharingSettings] = await db.insert(tripSharingSettings).values(settings).returning();
    return sharingSettings;
  }

  async getTripSharingSettings(tripPlanId: number): Promise<TripSharingSettings | undefined> {
    const [settings] = await db
      .select()
      .from(tripSharingSettings)
      .where(eq(tripSharingSettings.tripPlanId, tripPlanId))
      .limit(1);
    return settings;
  }

  async getTripSharingSettingsByToken(accessToken: string): Promise<TripSharingSettings | undefined> {
    const [settings] = await db
      .select()
      .from(tripSharingSettings)
      .where(eq(tripSharingSettings.accessToken, accessToken))
      .limit(1);
    return settings;
  }

  async updateTripSharingSettings(id: number, updates: Partial<InsertTripSharingSettings>): Promise<TripSharingSettings> {
    const [settings] = await db
      .update(tripSharingSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tripSharingSettings.id, id))
      .returning();
    return settings;
  }

  // Trip invitation operations
  async createTripInvitation(invitation: InsertTripInvitation): Promise<TripInvitation> {
    const [tripInvitation] = await db.insert(tripInvitations).values(invitation).returning();
    return tripInvitation;
  }

  async getTripInvitations(tripPlanId: number): Promise<TripInvitation[]> {
    return await db
      .select()
      .from(tripInvitations)
      .where(eq(tripInvitations.tripPlanId, tripPlanId))
      .orderBy(desc(tripInvitations.createdAt));
  }

  async getTripInvitationByToken(token: string): Promise<TripInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(tripInvitations)
      .where(eq(tripInvitations.invitationToken, token))
      .limit(1);
    return invitation;
  }

  async getTripInvitationByEmail(tripPlanId: number, email: string): Promise<TripInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(tripInvitations)
      .where(
        and(
          eq(tripInvitations.tripPlanId, tripPlanId),
          eq(tripInvitations.email, email)
        )
      )
      .limit(1);
    return invitation;
  }

  async updateTripInvitation(id: number, updates: Partial<InsertTripInvitation>): Promise<TripInvitation> {
    const [invitation] = await db
      .update(tripInvitations)
      .set(updates)
      .where(eq(tripInvitations.id, id))
      .returning();
    return invitation;
  }

  // Anonymous session operations
  async createAnonymousSession(session: InsertAnonymousTripSession): Promise<AnonymousTripSession> {
    const [anonymousSession] = await db.insert(anonymousTripSessions).values(session).returning();
    return anonymousSession;
  }

  async getAnonymousSession(sessionToken: string): Promise<AnonymousTripSession | undefined> {
    const [session] = await db
      .select()
      .from(anonymousTripSessions)
      .where(eq(anonymousTripSessions.sessionToken, sessionToken))
      .limit(1);
    return session;
  }

  async updateAnonymousSession(id: number, updates: Partial<InsertAnonymousTripSession>): Promise<AnonymousTripSession> {
    const [session] = await db
      .update(anonymousTripSessions)
      .set({ ...updates, lastAccessedAt: new Date() })
      .where(eq(anonymousTripSessions.id, id))
      .returning();
    return session;
  }

  // Chat sharing operations
  async createChatSharingSettings(settings: InsertChatSharingSettings): Promise<ChatSharingSettings> {
    const [chatSettings] = await db.insert(chatSharingSettings).values(settings).returning();
    return chatSettings;
  }

  async getChatSharingSettings(chatId: number): Promise<ChatSharingSettings | undefined> {
    const [settings] = await db
      .select()
      .from(chatSharingSettings)
      .where(eq(chatSharingSettings.chatId, chatId))
      .limit(1);
    return settings;
  }

  async getChatSharingSettingsByToken(accessToken: string): Promise<ChatSharingSettings | undefined> {
    const [settings] = await db
      .select()
      .from(chatSharingSettings)
      .where(eq(chatSharingSettings.accessToken, accessToken))
      .limit(1);
    return settings;
  }

  async updateChatSharingSettings(id: number, updates: Partial<InsertChatSharingSettings>): Promise<ChatSharingSettings> {
    const [settings] = await db
      .update(chatSharingSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(chatSharingSettings.id, id))
      .returning();
    return settings;
  }

  // Chat invitation operations
  async createChatInvitation(invitation: InsertChatInvitation): Promise<ChatInvitation> {
    const [chatInvitation] = await db.insert(chatInvitations).values(invitation).returning();
    return chatInvitation;
  }

  async getChatInvitations(chatId: number): Promise<ChatInvitation[]> {
    return await db
      .select()
      .from(chatInvitations)
      .where(eq(chatInvitations.chatId, chatId))
      .orderBy(desc(chatInvitations.createdAt));
  }

  async getChatInvitationByToken(token: string): Promise<ChatInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(chatInvitations)
      .where(eq(chatInvitations.invitationToken, token))
      .limit(1);
    return invitation;
  }

  async getChatInvitationByEmail(chatId: number, email: string): Promise<ChatInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(chatInvitations)
      .where(
        and(
          eq(chatInvitations.chatId, chatId),
          eq(chatInvitations.email, email)
        )
      )
      .limit(1);
    return invitation;
  }

  async updateChatInvitation(id: number, updates: Partial<InsertChatInvitation>): Promise<ChatInvitation> {
    const [invitation] = await db
      .update(chatInvitations)
      .set(updates)
      .where(eq(chatInvitations.id, id))
      .returning();
    return invitation;
  }

  // Anonymous chat session operations
  async createAnonymousChatSession(session: InsertAnonymousChatSession): Promise<AnonymousChatSession> {
    const [anonymousSession] = await db.insert(anonymousChatSessions).values(session).returning();
    return anonymousSession;
  }

  async getAnonymousChatSession(sessionToken: string): Promise<AnonymousChatSession | undefined> {
    const [session] = await db
      .select()
      .from(anonymousChatSessions)
      .where(eq(anonymousChatSessions.sessionToken, sessionToken))
      .limit(1);
    return session;
  }

  async updateAnonymousChatSession(id: number, updates: Partial<InsertAnonymousChatSession>): Promise<AnonymousChatSession> {
    const [session] = await db
      .update(anonymousChatSessions)
      .set({ ...updates, lastAccessedAt: new Date() })
      .where(eq(anonymousChatSessions.id, id))
      .returning();
    return session;
  }
}

export const storage = new DatabaseStorage();