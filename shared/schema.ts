import { pgTable, text, serial, integer, boolean, jsonb, timestamp, varchar, date, decimal } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User storage table for custom auth system
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(), // UUID
  email: varchar("email").unique().notNull(),
  passwordHash: varchar("password_hash"), // NULL for OAuth-only accounts
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  emailVerified: boolean("email_verified").default(false),
  authProvider: varchar("auth_provider").default('local'), // 'local', 'google'
  googleId: varchar("google_id").unique(),
  preferredLanguage: text("preferred_language").notNull().default('en'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
});

// Email verification tokens
export const emailVerifications = pgTable("email_verifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  verificationToken: varchar("verification_token").unique().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// User sessions
export const userSessions = pgTable("user_sessions", {
  id: varchar("id").primaryKey().notNull(), // Session token
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  lastAccessedAt: timestamp("last_accessed_at").defaultNow(),
});

// Password reset tokens
export const passwordResets = pgTable("password_resets", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  resetToken: varchar("reset_token").unique().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  language: text("language").notNull().default('en'),
  travelMoodId: integer("travel_mood_id"),
  moodSelectedAt: timestamp("mood_selected_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").notNull(),
  role: text("role").notNull(), // 'user' | 'assistant'
  content: text("content").notNull(),
  metadata: jsonb("metadata"), // for storing additional data like destination info
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const destinations = pgTable("destinations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }), // NULL for shared/global destinations
  name: text("name").notNull(),
  country: text("country").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  coordinates: jsonb("coordinates"), // {lat: number, lng: number}
  isGlobal: boolean("is_global").default(false), // true for system-wide destinations
  createdAt: timestamp("created_at").defaultNow(),
});

export const hotels = pgTable("hotels", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }), // NULL for shared/global hotels
  destinationId: integer("destination_id").notNull(),
  placeId: text("place_id").notNull(), // Unique identifier: Google PlaceID or LiteAPI ID
  name: text("name").notNull(),
  description: text("description").notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  pricePerNight: integer("price_per_night").notNull(),
  imageUrl: text("image_url"),
  amenities: text("amenities").array(),
  coordinates: jsonb("coordinates"),
  isGlobal: boolean("is_global").default(false), // true for system-wide hotels
  createdAt: timestamp("created_at").defaultNow(),
});

export const attractions = pgTable("attractions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }), // NULL for shared/global attractions
  destinationId: integer("destination_id").notNull(),
  placeId: text("place_id").notNull(), // Unique identifier: Google PlaceID or custom ID
  name: text("name").notNull(),
  description: text("description").notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  category: text("category").notNull(),
  imageUrl: text("image_url"),
  coordinates: jsonb("coordinates"),
  distance: text("distance"), // e.g., "2 hours away"
  isGlobal: boolean("is_global").default(false), // true for system-wide attractions
  createdAt: timestamp("created_at").defaultNow(),
});

export const itineraries = pgTable("itineraries", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  destinationId: integer("destination_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  day: integer("day").notNull(),
  items: jsonb("items"), // Array of itinerary items with time, activity, location, duration, cost
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Restaurants table - unified with PlaceID system
export const restaurants = pgTable("restaurants", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }), // NULL for shared/global restaurants
  destinationId: integer("destination_id").notNull(),
  placeId: text("place_id").notNull(), // Unique identifier: Google PlaceID
  name: text("name").notNull(),
  description: text("description").notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  category: text("category").notNull(),
  priceLevel: integer("price_level"), // 1-4 Google Places price level
  imageUrl: text("image_url"),
  coordinates: jsonb("coordinates"),
  vicinity: text("vicinity"), // Short address
  isGlobal: boolean("is_global").default(false), // true for system-wide restaurants
  createdAt: timestamp("created_at").defaultNow(),
});

export const travelMoods = pgTable("travel_moods", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
  keywords: text("keywords").array().notNull(),
  preferences: jsonb("preferences").notNull(), // Travel preferences configuration
  mapFilters: jsonb("map_filters").notNull(), // {prioritize: string[], exclude: string[], accommodationTypes: string[], priceLevel: number[]}
});



export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertChatSchema = createInsertSchema(chats).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertDestinationSchema = createInsertSchema(destinations).omit({
  id: true,
});

export const insertHotelSchema = createInsertSchema(hotels).omit({
  id: true,
});

export const insertAttractionSchema = createInsertSchema(attractions).omit({
  id: true,
});

export const insertRestaurantSchema = createInsertSchema(restaurants).omit({
  id: true,
});

export const insertItinerarySchema = createInsertSchema(itineraries).omit({
  id: true,
  createdAt: true,
});

export const insertTravelMoodSchema = createInsertSchema(travelMoods).omit({
  id: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Chat = typeof chats.$inferSelect;
export type InsertChat = z.infer<typeof insertChatSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Destination = typeof destinations.$inferSelect;
export type InsertDestination = z.infer<typeof insertDestinationSchema>;

export type Hotel = typeof hotels.$inferSelect;
export type InsertHotel = z.infer<typeof insertHotelSchema>;

export type Attraction = typeof attractions.$inferSelect;
export type InsertAttraction = z.infer<typeof insertAttractionSchema>;

export type Restaurant = typeof restaurants.$inferSelect;
export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;

export type Itinerary = typeof itineraries.$inferSelect;
export type InsertItinerary = z.infer<typeof insertItinerarySchema>;

export type TravelMood = typeof travelMoods.$inferSelect;
export type InsertTravelMood = z.infer<typeof insertTravelMoodSchema>;

// Add new tables for the enhanced sidebar and itinerary system
export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  itemType: text("item_type").notNull(), // 'hotel', 'attraction', 'restaurant'
  placeId: text("place_id").notNull(), // Google PlaceID, LiteAPI ID, or custom ID
  itemName: text("item_name").notNull(),
  itemData: jsonb("item_data").notNull().default('{}'), // Store full item details
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // Unique constraint: user can only favorite the same place once
  uniqueUserPlace: { columns: [table.userId, table.placeId], name: "unique_user_place_favorite" }
}));

export const itineraryItems = pgTable("itinerary_items", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").notNull(),
  itemType: text("item_type").notNull(), // 'hotel', 'attraction', 'restaurant'
  placeId: text("place_id").notNull(), // Google PlaceID, LiteAPI ID, or custom ID
  itemName: text("item_name").notNull(),
  itemData: jsonb("item_data").notNull().default('{}'),
  day: integer("day").default(1),
  order: integer("order").default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
});

export const insertItineraryItemSchema = createInsertSchema(itineraryItems).omit({
  id: true,
  createdAt: true,
});

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;

export type ItineraryItemDb = typeof itineraryItems.$inferSelect;
export type InsertItineraryItemDb = z.infer<typeof insertItineraryItemSchema>;

// Legacy itinerary item structure for OpenAI generated content
export interface ItineraryItem {
  time: string;
  title: string;
  description: string;
  location: string;
  duration?: string;
  cost?: string;
  coordinates?: { lat: number; lng: number };
}

// Agent System Tables
export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // destination, accommodation, itinerary, etc.
  status: text("status").default("active"),
  config: jsonb("config"), // Agent-specific configuration
  createdAt: timestamp("created_at").defaultNow(),
});

export const agentTasks = pgTable("agent_tasks", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").references(() => agents.id),
  chatId: integer("chat_id").references(() => chats.id),
  taskType: text("task_type").notNull(),
  input: jsonb("input").notNull(),
  output: jsonb("output"),
  status: text("status").default("pending"), // pending, running, completed, failed
  executedAt: timestamp("executed_at"),
  completedAt: timestamp("completed_at"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tripPlans = pgTable("trip_plans", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").references(() => chats.id),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  destination: text("destination").notNull(),
  startDate: text("start_date"),
  endDate: text("end_date"),
  budget: text("budget"),
  currency: text("currency").default("EUR"),
  preferences: jsonb("preferences"), // Travel preferences
  generatedPlan: jsonb("generated_plan"), // Complete travel plan
  status: text("status").default("draft"), // draft, planning, ready, booked
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas for new tables
export const insertAgentSchema = createInsertSchema(agents).omit({
  id: true,
  createdAt: true,
});

export const insertAgentTaskSchema = createInsertSchema(agentTasks).omit({
  id: true,
  createdAt: true,
  executedAt: true,
  completedAt: true,
});

export const insertTripPlanSchema = createInsertSchema(tripPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for new tables
export type Agent = typeof agents.$inferSelect;
export type InsertAgent = z.infer<typeof insertAgentSchema>;

export type AgentTask = typeof agentTasks.$inferSelect;
export type InsertAgentTask = z.infer<typeof insertAgentTaskSchema>;

export type TripPlan = typeof tripPlans.$inferSelect;
export type InsertTripPlan = z.infer<typeof insertTripPlanSchema>;

// Solver System Tables
export const solverResults = pgTable("solver_results", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").references(() => chats.id),
  tripPlanId: integer("trip_plan_id").references(() => tripPlans.id),
  problemFormulation: jsonb("problem_formulation").notNull(), // SMT constraints and variables
  solverCode: text("solver_code").notNull(), // Generated Python code for Z3
  status: text("status").notNull(), // satisfiable, unsatisfiable, timeout, error
  solution: jsonb("solution"), // Solver output if satisfiable
  unsatCore: jsonb("unsat_core"), // Unsat core if unsatisfiable
  executionTime: integer("execution_time"), // Execution time in milliseconds
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const solverConstraints = pgTable("solver_constraints", {
  id: serial("id").primaryKey(),
  solverResultId: integer("solver_result_id").references(() => solverResults.id),
  constraintType: text("constraint_type").notNull(), // budget, time, location, preference
  constraintName: text("constraint_name").notNull(),
  constraintExpression: text("constraint_expression").notNull(),
  priority: integer("priority").default(1), // 1-10, higher = more important
  isHard: boolean("is_hard").default(true), // hard vs soft constraints
  metadata: jsonb("metadata"), // Additional constraint data
});

// Insert schemas for solver tables
export const insertSolverResultSchema = createInsertSchema(solverResults).omit({
  id: true,
  createdAt: true,
});

export const insertSolverConstraintSchema = createInsertSchema(solverConstraints).omit({
  id: true,
});

// Types for solver tables
export type SolverResult = typeof solverResults.$inferSelect;
export type InsertSolverResult = z.infer<typeof insertSolverResultSchema>;

export type SolverConstraint = typeof solverConstraints.$inferSelect;
export type InsertSolverConstraint = z.infer<typeof insertSolverConstraintSchema>;

// LiteAPI Integration Tables for Monetization
export const hotelBookings = pgTable("hotel_bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  chatId: integer("chat_id").references(() => chats.id),
  tripPlanId: integer("trip_plan_id").references(() => tripPlans.id),
  liteApiBookingId: text("liteapi_booking_id").notNull().unique(),
  liteApiHotelId: text("liteapi_hotel_id").notNull(),
  confirmationNumber: text("confirmation_number").notNull(),
  status: text("status").notNull(), // confirmed, pending, cancelled, completed
  hotelName: text("hotel_name").notNull(),
  hotelAddress: text("hotel_address").notNull(),
  checkInDate: date("check_in_date").notNull(),
  checkOutDate: date("check_out_date").notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("EUR"),
  commission: decimal("commission", { precision: 10, scale: 2 }).default("0"),
  commissionPercentage: decimal("commission_percentage", { precision: 5, scale: 2 }).default("0"),
  guestDetails: jsonb("guest_details").notNull(), // Guest information
  roomDetails: jsonb("room_details").notNull(), // Room type and details
  cancellationPolicy: text("cancellation_policy"),
  paymentMethod: text("payment_method").notNull(),
  paymentStatus: text("payment_status").default("pending"), // pending, paid, refunded
  specialRequests: text("special_requests"),
  metadata: jsonb("metadata"), // Additional LiteAPI response data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const revenueTracking = pgTable("revenue_tracking", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => hotelBookings.id),
  revenueType: text("revenue_type").notNull(), // commission, markup, affiliate
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("EUR"),
  percentage: decimal("percentage", { precision: 5, scale: 2 }),
  provider: text("provider").notNull(), // liteapi, google_maps, tripadvisor
  status: text("status").default("pending"), // pending, confirmed, paid
  payoutDate: date("payout_date"),
  metadata: jsonb("metadata"), // Provider-specific data
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  accommodationType: text("accommodation_type").array(), // hotel, hostel, apartment, etc.
  priceRange: text("price_range"), // budget, mid-range, luxury
  amenities: text("amenities").array(), // wifi, pool, gym, etc.
  roomType: text("room_type"), // single, double, suite, etc.
  boardType: text("board_type"), // room_only, breakfast, half_board, full_board
  currency: text("currency").default("EUR"),
  language: text("language").default("en"),
  notifications: jsonb("notifications").default('{"booking": true, "price_alerts": false, "recommendations": true}'),
  paymentMethods: text("payment_methods").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Insert schemas for LiteAPI tables
export const insertHotelBookingSchema = createInsertSchema(hotelBookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRevenueTrackingSchema = createInsertSchema(revenueTracking).omit({
  id: true,
  createdAt: true,
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for LiteAPI tables
export type HotelBooking = typeof hotelBookings.$inferSelect;
export type InsertHotelBooking = z.infer<typeof insertHotelBookingSchema>;

export type RevenueTracking = typeof revenueTracking.$inferSelect;
export type InsertRevenueTracking = z.infer<typeof insertRevenueTrackingSchema>;

export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;

// Social Media Content Tables for TikTok and Instagram Integration
export const socialMediaContent = pgTable("social_media_content", {
  id: serial("id").primaryKey(),
  platform: text("platform").notNull(), // 'tiktok', 'instagram'
  contentId: text("content_id").notNull().unique(), // Platform-specific content ID
  contentType: text("content_type").notNull(), // 'video', 'post', 'reel', 'story'
  authorUsername: text("author_username").notNull(),
  authorDisplayName: text("author_display_name"),
  authorAvatar: text("author_avatar"),
  authorFollowers: integer("author_followers"),
  caption: text("caption"),
  hashtags: text("hashtags").array(),
  mentions: text("mentions").array(),
  mediaUrl: text("media_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  viewCount: integer("view_count"),
  likeCount: integer("like_count"),
  commentCount: integer("comment_count"),
  shareCount: integer("share_count"),
  publishedAt: timestamp("published_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const destinationSocialContent = pgTable("destination_social_content", {
  id: serial("id").primaryKey(),
  destinationId: integer("destination_id").references(() => destinations.id),
  socialContentId: integer("social_content_id").references(() => socialMediaContent.id),
  locationName: text("location_name").notNull(),
  coordinates: jsonb("coordinates"), // {lat: number, lng: number}
  relevanceScore: decimal("relevance_score", { precision: 3, scale: 2 }).default("0"), // 0-1 relevance score
  contentTags: text("content_tags").array(), // ['food', 'sunset', 'architecture', etc.]
  extractedLocations: text("extracted_locations").array(), // AI-extracted location mentions
  isVerified: boolean("is_verified").default(false), // Human or AI verification
  moderationStatus: text("moderation_status").default("pending"), // pending, approved, rejected
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const socialMediaCuration = pgTable("social_media_curation", {
  id: serial("id").primaryKey(),
  destinationName: text("destination_name").notNull(),
  platform: text("platform").notNull(),
  curationType: text("curation_type").notNull(), // 'trending', 'popular', 'recent', 'verified'
  contentIds: text("content_ids").array(), // Array of social content IDs
  curatedAt: timestamp("curated_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"), // Cache expiration
  metadata: jsonb("metadata"), // Additional curation data
});

export const userSocialInteractions = pgTable("user_social_interactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  socialContentId: integer("social_content_id").references(() => socialMediaContent.id),
  interactionType: text("interaction_type").notNull(), // 'view', 'like', 'save', 'share'
  interactionData: jsonb("interaction_data"), // Additional interaction metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const socialMediaHashtags = pgTable("social_media_hashtags", {
  id: serial("id").primaryKey(),
  hashtag: text("hashtag").notNull().unique(),
  platform: text("platform").notNull(),
  totalUses: integer("total_uses").default(0),
  trendingScore: decimal("trending_score", { precision: 5, scale: 2 }).default("0"),
  relatedDestinations: text("related_destinations").array(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

// Insert schemas for social media tables
export const insertSocialMediaContentSchema = createInsertSchema(socialMediaContent).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDestinationSocialContentSchema = createInsertSchema(destinationSocialContent).omit({
  id: true,
  createdAt: true,
});

export const insertSocialMediaCurationSchema = createInsertSchema(socialMediaCuration).omit({
  id: true,
  curatedAt: true,
});

export const insertUserSocialInteractionSchema = createInsertSchema(userSocialInteractions).omit({
  id: true,
  createdAt: true,
});

export const insertSocialMediaHashtagSchema = createInsertSchema(socialMediaHashtags).omit({
  id: true,
  lastUpdated: true,
});

// Types for social media tables
export type SocialMediaContent = typeof socialMediaContent.$inferSelect;
export type InsertSocialMediaContent = z.infer<typeof insertSocialMediaContentSchema>;

export type DestinationSocialContent = typeof destinationSocialContent.$inferSelect;
export type InsertDestinationSocialContent = z.infer<typeof insertDestinationSocialContentSchema>;

export type SocialMediaCuration = typeof socialMediaCuration.$inferSelect;
export type InsertSocialMediaCuration = z.infer<typeof insertSocialMediaCurationSchema>;

export type UserSocialInteraction = typeof userSocialInteractions.$inferSelect;
export type InsertUserSocialInteraction = z.infer<typeof insertUserSocialInteractionSchema>;

export type SocialMediaHashtag = typeof socialMediaHashtags.$inferSelect;
export type InsertSocialMediaHashtag = z.infer<typeof insertSocialMediaHashtagSchema>;

// Cache System Tables for Intelligent POI Data Caching
export const cachedPlaces = pgTable("cached_places", {
  id: serial("id").primaryKey(),
  placeId: text("place_id").notNull().unique(), // Google Places ID
  name: text("name").notNull(),
  locationLat: decimal("location_lat", { precision: 10, scale: 8 }).notNull(),
  locationLng: decimal("location_lng", { precision: 11, scale: 8 }).notNull(),
  category: text("category").notNull(), // restaurant, attraction, hotel, etc.
  data: jsonb("data").notNull(), // Complete API response
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  searchCount: integer("search_count").default(1), // Popularity tracking
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cachedReviews = pgTable("cached_reviews", {
  id: serial("id").primaryKey(),
  placeId: text("place_id").notNull(),
  source: text("source").notNull(), // tripadvisor, google
  reviews: jsonb("reviews").notNull(),
  rating: decimal("rating", { precision: 2, scale: 1 }),
  reviewCount: integer("review_count"),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const cachedPhotos = pgTable("cached_photos", {
  id: serial("id").primaryKey(),
  placeId: text("place_id").notNull(),
  source: text("source").notNull(), // unsplash, google
  photos: jsonb("photos").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const apiUsageTracking = pgTable("api_usage_tracking", {
  id: serial("id").primaryKey(),
  provider: text("provider").notNull(), // google_places, tripadvisor, unsplash
  endpoint: text("endpoint").notNull(), // searchNearby, searchText, placeDetails
  requestCount: integer("request_count").default(1),
  costEstimate: decimal("cost_estimate", { precision: 8, scale: 4 }), // Estimated cost in USD
  cacheHitRate: decimal("cache_hit_rate", { precision: 5, scale: 4 }), // 0.0 to 1.0
  date: date("date").notNull(),
  metadata: jsonb("metadata"), // Request details, location, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Cache system indexes for performance
// Note: Drizzle will handle these indexes automatically
// CREATE INDEX idx_cached_places_location ON cached_places(location_lat, location_lng);
// CREATE INDEX idx_cached_places_category ON cached_places(category);
// CREATE INDEX idx_cached_places_expires ON cached_places(expires_at);
// CREATE INDEX idx_cached_reviews_place ON cached_reviews(place_id);
// CREATE INDEX idx_cached_photos_place ON cached_photos(place_id);

// Insert schemas for cache tables
export const insertCachedPlaceSchema = createInsertSchema(cachedPlaces).omit({
  id: true,
  lastUpdated: true,
  createdAt: true,
});

export const insertCachedReviewSchema = createInsertSchema(cachedReviews).omit({
  id: true,
  lastUpdated: true,
});

export const insertCachedPhotoSchema = createInsertSchema(cachedPhotos).omit({
  id: true,
  lastUpdated: true,
});

export const insertApiUsageTrackingSchema = createInsertSchema(apiUsageTracking).omit({
  id: true,
  createdAt: true,
});

// Types for cache tables
export type CachedPlace = typeof cachedPlaces.$inferSelect;
export type InsertCachedPlace = z.infer<typeof insertCachedPlaceSchema>;

export type CachedReview = typeof cachedReviews.$inferSelect;
export type InsertCachedReview = z.infer<typeof insertCachedReviewSchema>;

export type CachedPhoto = typeof cachedPhotos.$inferSelect;
export type InsertCachedPhoto = z.infer<typeof insertCachedPhotoSchema>;

export type ApiUsageTracking = typeof apiUsageTracking.$inferSelect;
export type InsertApiUsageTracking = z.infer<typeof insertApiUsageTrackingSchema>;

// Enhanced Hotels table to support LiteAPI integration
export const enhancedHotels = pgTable("enhanced_hotels", {
  id: serial("id").primaryKey(),
  destinationId: integer("destination_id").references(() => destinations.id),
  name: text("name").notNull(),
  description: text("description").notNull(),
  rating: integer("rating").notNull(),
  pricePerNight: decimal("price_per_night", { precision: 8, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  amenities: text("amenities").array(),
  coordinates: jsonb("coordinates"),
  // LiteAPI specific fields
  liteApiId: text("liteapi_id").unique(),
  bookable: boolean("bookable").default(false),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).default("0"),
  provider: text("provider").default("google_maps"), // google_maps, liteapi, tripadvisor
  lastUpdated: timestamp("last_updated").defaultNow(),
  // Pricing and availability cache
  availabilityCache: jsonb("availability_cache"), // Cache recent availability checks
  priceCache: jsonb("price_cache"), // Cache recent price checks
});

export const insertEnhancedHotelSchema = createInsertSchema(enhancedHotels).omit({
  id: true,
  lastUpdated: true,
});

export type EnhancedHotel = typeof enhancedHotels.$inferSelect;
export type InsertEnhancedHotel = z.infer<typeof insertEnhancedHotelSchema>;

// Solver interfaces
export interface SolverRequest {
  destination: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  currency?: string;
  preferences: string[];
  constraints: {
    budget?: { min?: number; max?: number };
    duration?: { min?: number; max?: number };
    activities?: string[];
    locations?: string[];
    transportation?: string[];
    accommodation?: { type?: string; rating?: number };
  };
  language?: string;
}

export interface SolverResponse {
  success: boolean;
  status: 'satisfiable' | 'unsatisfiable' | 'timeout' | 'error';
  solution?: any;
  unsatCore?: string[];
  executionTime?: number;
  error?: string;
  suggestions?: string[];
}

// Auth system types (replacing existing User types)
export type UpdateUser = Partial<InsertUser>;

export type EmailVerification = typeof emailVerifications.$inferSelect;
export type InsertEmailVerification = typeof emailVerifications.$inferInsert;

export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = typeof userSessions.$inferInsert;

export type PasswordReset = typeof passwordResets.$inferSelect;
export type InsertPasswordReset = typeof passwordResets.$inferInsert;

// Auth-related interfaces
export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResult {
  user: User;
  sessionToken: string;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  given_name: string;
  family_name: string;
  picture?: string;
}

// Database relations for proper foreign key handling
export const usersRelations = relations(users, ({ many }) => ({
  chats: many(chats),
  favorites: many(favorites),
  destinations: many(destinations),
  hotels: many(hotels),
  attractions: many(attractions),
  itineraries: many(itineraries),
  tripPlans: many(tripPlans),
  emailVerifications: many(emailVerifications),
  userSessions: many(userSessions),
  passwordResets: many(passwordResets),
}));

export const chatsRelations = relations(chats, ({ one, many }) => ({
  user: one(users, {
    fields: [chats.userId],
    references: [users.id],
  }),
  messages: many(messages),
  itineraryItems: many(itineraryItems),
  agentTasks: many(agentTasks),
  tripPlans: many(tripPlans),
}));

export const destinationsRelations = relations(destinations, ({ one, many }) => ({
  user: one(users, {
    fields: [destinations.userId],
    references: [users.id],
  }),
  hotels: many(hotels),
  attractions: many(attractions),
  itineraries: many(itineraries),
}));

// Trip Sharing System Tables
export const tripSharingSettings = pgTable("trip_sharing_settings", {
  id: serial("id").primaryKey(),
  tripPlanId: integer("trip_plan_id").notNull().references(() => tripPlans.id, { onDelete: 'cascade' }),
  accessLevel: text("access_level").notNull().default("invite-only"), // 'invite-only' | 'anyone-with-link'
  allowAnonymousAccess: boolean("allow_anonymous_access").default(false),
  accessToken: varchar("access_token").unique().notNull(), // Unique sharing token
  expiresAt: timestamp("expires_at"), // Optional expiration
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tripInvitations = pgTable("trip_invitations", {
  id: serial("id").primaryKey(),
  tripPlanId: integer("trip_plan_id").notNull().references(() => tripPlans.id, { onDelete: 'cascade' }),
  email: varchar("email").notNull(),
  invitedByUserId: varchar("invited_by_user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  accessLevel: text("access_level").notNull().default("viewer"), // 'viewer' | 'editor'
  status: text("status").notNull().default("pending"), // 'pending' | 'accepted' | 'declined' | 'expired'
  invitationToken: varchar("invitation_token").unique().notNull(),
  acceptedAt: timestamp("accepted_at"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // Unique constraint: same email can't be invited twice to same trip
  uniqueTripEmail: { columns: [table.tripPlanId, table.email], name: "unique_trip_email_invitation" }
}));

export const anonymousTripSessions = pgTable("anonymous_trip_sessions", {
  id: serial("id").primaryKey(),
  tripPlanId: integer("trip_plan_id").notNull().references(() => tripPlans.id, { onDelete: 'cascade' }),
  sessionToken: varchar("session_token").unique().notNull(),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  permissions: text("permissions").notNull().default("view"), // 'view' | 'edit'
  lastAccessedAt: timestamp("last_accessed_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Chat-based sharing system (independent of trip plans)
export const chatSharingSettings = pgTable("chat_sharing_settings", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").notNull().references(() => chats.id, { onDelete: 'cascade' }),
  accessLevel: text("access_level").notNull().default("invite-only"), // 'invite-only' | 'anyone-with-link'
  allowAnonymousAccess: boolean("allow_anonymous_access").default(false),
  accessToken: varchar("access_token").unique().notNull(), // Unique sharing token
  expiresAt: timestamp("expires_at"), // Optional expiration
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const chatInvitations = pgTable("chat_invitations", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").notNull().references(() => chats.id, { onDelete: 'cascade' }),
  email: varchar("email").notNull(),
  invitedByUserId: varchar("invited_by_user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  accessLevel: text("access_level").notNull().default("viewer"), // 'viewer' | 'editor'
  status: text("status").notNull().default("pending"), // 'pending' | 'accepted' | 'declined' | 'expired'
  invitationToken: varchar("invitation_token").unique().notNull(),
  acceptedAt: timestamp("accepted_at"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // Unique constraint: same email can't be invited twice to same chat
  uniqueChatEmail: { columns: [table.chatId, table.email], name: "unique_chat_email_invitation" }
}));

export const anonymousChatSessions = pgTable("anonymous_chat_sessions", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").notNull().references(() => chats.id, { onDelete: 'cascade' }),
  sessionToken: varchar("session_token").unique().notNull(),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  permissions: text("permissions").notNull().default("view"), // 'view' | 'edit'
  lastAccessedAt: timestamp("last_accessed_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas for trip sharing tables
export const insertTripSharingSettingsSchema = createInsertSchema(tripSharingSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTripInvitationSchema = createInsertSchema(tripInvitations).omit({
  id: true,
  createdAt: true,
  acceptedAt: true,
});

export const insertAnonymousTripSessionSchema = createInsertSchema(anonymousTripSessions).omit({
  id: true,
  createdAt: true,
  lastAccessedAt: true,
});

// Types for trip sharing tables
export type TripSharingSettings = typeof tripSharingSettings.$inferSelect;
export type InsertTripSharingSettings = z.infer<typeof insertTripSharingSettingsSchema>;

export type TripInvitation = typeof tripInvitations.$inferSelect;
export type InsertTripInvitation = z.infer<typeof insertTripInvitationSchema>;

export type AnonymousTripSession = typeof anonymousTripSessions.$inferSelect;
export type InsertAnonymousTripSession = z.infer<typeof insertAnonymousTripSessionSchema>;

// Insert schemas for chat sharing tables
export const insertChatSharingSettingsSchema = createInsertSchema(chatSharingSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatInvitationSchema = createInsertSchema(chatInvitations).omit({
  id: true,
  createdAt: true,
  acceptedAt: true,
});

export const insertAnonymousChatSessionSchema = createInsertSchema(anonymousChatSessions).omit({
  id: true,
  createdAt: true,
  lastAccessedAt: true,
});

// Types for chat sharing tables
export type ChatSharingSettings = typeof chatSharingSettings.$inferSelect;
export type InsertChatSharingSettings = z.infer<typeof insertChatSharingSettingsSchema>;

export type ChatInvitation = typeof chatInvitations.$inferSelect;
export type InsertChatInvitation = z.infer<typeof insertChatInvitationSchema>;

export type AnonymousChatSession = typeof anonymousChatSessions.$inferSelect;
export type InsertAnonymousChatSession = z.infer<typeof insertAnonymousChatSessionSchema>;
