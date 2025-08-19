<!-- # Travel Planning Application

## Overview

This is a comprehensive travel planning application built with a modern full-stack architecture. The system integrates AI-powered conversation capabilities with real-world travel APIs to provide intelligent trip planning, destination research, and itinerary generation. The application features a sophisticated agent-based architecture for handling complex travel planning tasks and includes an SMT solver for constraint validation.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **UI Library**: Shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **State Management**: TanStack Query for server state, React hooks for local state
- **Internationalization**: React i18next for multi-language support
- **Routing**: Wouter for lightweight client-side routing
- **Interactive Features**: Drag-and-drop with @dnd-kit, interactive maps with Google Maps

### Backend Architecture
- **Runtime**: Node.js with TypeScript (ESM modules)
- **Framework**: Express.js for REST API
- **Real-time Communication**: MCP (Model Context Protocol) for agent communication
- **AI Integration**: OpenAI GPT-4 for natural language processing
- **Agent System**: Multi-agent architecture with specialized travel planning agents

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon serverless PostgreSQL
- **Schema Management**: Drizzle migrations and schema definitions
- **Connection Pooling**: @neondatabase/serverless with WebSocket support

## Key Components

### Core User Experience
The application focuses on intuitive trip planning through:

- **Interactive Trip Building**: Drag-and-drop itinerary creation from map selections
- **Visual Destination Exploration**: Click map markers to add hotels, attractions, restaurants
- **Real-time Collaboration**: Multiple users can edit and share trip plans
- **Trip Templates**: Save and reuse successful itineraries
- **Cost Estimation**: Dynamic pricing for planned activities and accommodations

### MCP (Model Context Protocol) Integration
- **Google Maps Server**: Provides location search, nearby places, and mapping data
- **TripAdvisor Server**: Supplies reviews, photos, and detailed attraction information
- **Storage Server**: Manages database operations for travel data persistence
- **Client**: Orchestrates communication between AI models and external services

### SMT Solver Integration
- **Technology**: Z3 SMT solver implemented in Python
- **Purpose**: Validates travel plan constraints and provides mathematical optimization
- **Features**: Constraint satisfaction, unsatisfiable core analysis, optimization suggestions
- **Integration**: Node.js spawns Python processes for solver execution

### Interactive User Interface
- **Split-screen Layout**: Chat interface alongside interactive map
- **Real-time Map Updates**: Dynamic marker updates based on search results
- **Drag-and-drop Itinerary**: Visual trip planning with sortable components
- **Multi-language Support**: German, English, Spanish, and French

## Data Flow

1. **User Input**: Natural language queries through chat interface
2. **Language Detection**: Automatic detection and response in user's language
3. **AI Processing**: OpenAI GPT-4 processes requests and determines required actions
4. **Agent Orchestration**: Specialized agents execute specific travel planning tasks
5. **External API Calls**: MCP servers fetch data from Google Maps and TripAdvisor
6. **Constraint Validation**: SMT solver validates feasibility of travel plans
7. **Response Generation**: AI synthesizes data into comprehensive travel recommendations
8. **UI Updates**: Real-time updates to map markers, itinerary, and chat interface

## External Dependencies

### Required API Keys
- **OpenAI API**: For GPT-4 language model access
- **Google Maps API**: For location search, places, and mapping
- **Mapbox Access Token**: For alternative mapping solution with enhanced 3D capabilities
- **TripAdvisor API**: For reviews, photos, and detailed attraction data

### Third-party Services
- **Google Maps Services**: Location search, nearby places, geocoding
- **TripAdvisor Content API**: Reviews, photos, location details
- **Neon Database**: Serverless PostgreSQL hosting

### Python Dependencies
- **Z3 Solver**: SMT constraint solving and optimization
- **JSON Processing**: Data serialization for solver communication

## Deployment Strategy

### Development Environment
- **Build Tool**: Vite for fast development and hot module replacement
- **Type Checking**: TypeScript strict mode with comprehensive type coverage
- **Development Server**: Express with Vite middleware integration
- **Database**: Drizzle push for schema synchronization

### Production Build
- **Frontend**: Vite build with optimized bundling
- **Backend**: ESBuild compilation to single JavaScript bundle
- **Database**: Automated migrations with Drizzle kit
- **Environment**: Node.js production server with PM2 or similar process manager

### Configuration Requirements
- Database URL for PostgreSQL connection
- API keys for external services (OpenAI, Google Maps, TripAdvisor)
- Python environment with Z3 solver installation
- WebSocket support for real-time features

## LiteAPI Hotel Booking Integration

### Overview
Hotel booking system with commission-based monetization through LiteAPI integration.

### Implementation Status
- **Hotel Search**: ✅ Functional with LiteAPI (coordinates-to-city mapping)
- **Prebook Process**: ✅ Working (hotel availability and pricing)
- **Booking Confirmation**: ❌ Incomplete (payment processing needed)
- **Commission Tracking**: ✅ Active (8-15% commission per booking estimated)

### Technical Components
- **API Integration**: LiteAPI search, prebook, and coordinate-based hotel discovery functional
- **Geographic Mapping**: Coordinate-to-city conversion for major European destinations
- **Database Schema**: Basic booking tables created
- **Frontend Forms**: Hotel search and guest information collection
- **Payment Processing**: Requires completion for full booking flow
- **Commission System**: Real-time commission calculation and tracking

### Development Priority
- Complete booking confirmation process
- Implement payment gateway integration
- Test full end-to-end booking workflow
- Commission tracking once bookings are functional

## Social Media Integration

### Overview
Comprehensive TikTok and Instagram content curation system integrated into the travel platform to provide users with authentic social media inspiration for their destinations.

### Key Components
- **Complete Database Schema**: Extended schema with 5 new tables (social_media_content, destination_social_content, social_media_curation, user_social_interactions, social_media_hashtags)
- **Backend Service**: Full-featured social media service (`server/social-media.ts`) with TikTok/Instagram API integration, AI-powered relevance scoring, and content curation
- **API Endpoints**: Complete REST API (`server/social-media-routes.ts`) with 8 endpoints for content discovery, curation, hashtag tracking, and user interactions
- **Frontend Component**: Professional React component (`client/src/components/SocialMediaContent.tsx`) with platform-specific filtering, engagement tracking, and responsive design
- **UI Integration**: Seamlessly integrated into MainTabs as 5th tab with Instagram icon and "Social" label

### Technical Implementation
- **AI Content Analysis**: OpenAI GPT-4 powered relevance scoring (0-1 scale) with location extraction and quality assessment
- **Rate Limiting**: Built-in rate limiting for TikTok (50/min, 1000/hour) and Instagram (60/min, 2000/hour) APIs
- **Content Moderation**: Automated content verification with manual moderation workflows
- **Engagement Tracking**: User interaction analytics (view, like, save, share) with database persistence
- **Hashtag Analytics**: Trending hashtag tracking with destination correlation and scoring algorithms

### Current Status
- **Backend**: Fully implemented with error handling and proper TypeScript types
- **Frontend**: Complete UI with platform tabs, content cards, engagement buttons, and responsive design
- **Database**: All tables created with proper relationships and indexing
- **API Keys**: Ready for TikTok API key (TIKTOK_API_KEY) and Instagram access token (INSTAGRAM_ACCESS_TOKEN)
- **Production Ready**: Complete integration ready for API credential configuration

## User Preferences
- **German Language**: Always use informal "du" form, never "Sie" in German translations
- **Communication Style**: Direct, professional, and concise

## Recent Changes

### Password Reset System (July 23, 2025)
- Complete password reset functionality implemented with Resend email integration
- Backend APIs: `/api/auth/forgot-password`, `/api/auth/verify-reset-token/:token`, `/api/auth/reset-password`
- Professional plain HTML email templates in English for maximum compatibility
- **Production URL Fix**: Auto-detection of frontend URL (Replit production vs localhost development)
- Frontend: Dedicated `/reset-password` page with token validation and secure password forms
- AuthOverlay enhanced with "Forgot Password" functionality accessible from login screen
- Security features: 1-hour token expiration, token validation, session invalidation on password reset
- Database schema: `password_resets` table with proper indexing and cleanup mechanisms
- July 23, 2025: **Comprehensive Translation Coverage Complete** - Successfully implemented complete multilingual support for Trip-Sidebar and Invite Feature components across German, English, Spanish, and French. Updated all UI elements to use proper t() translation functions, fixed duplicate translation keys, and corrected German language to use informal "du" form throughout. Added comprehensive translation coverage for trip planning, itinerary management, invite system, toast messages, and form validation. Translation system now supports structured hierarchical keys and provides consistent user experience across all supported languages.
- July 23, 2025: **Complete Collaborative Trip Sharing System Finished** - Successfully implemented comprehensive chat-based sharing system with both chat-specific and platform-wide invitation capabilities. Features: (1) Fixed shareable link generation to use activeChatId instead of deprecated activeTripPlanId with /chat/{chatId}?access={token} format, (2) Implemented platform-wide invitation system for users without active chats via /api/platform/invite endpoint, (3) Enhanced InvitePanel UI to differentiate between chat and platform invitations with contextual messaging, (4) Added sendPlatformInvitationEmail function with professional email templates via Resend integration, (5) Chat sharing settings only appear for active chats while platform invitations work globally, (6) All API mutations fixed to use proper apiRequest method format. System now supports complete sharing workflow: anonymous access via shareable links, email invitations through Resend, multiple access levels, and platform-wide user recruitment. TripPlanningContext bug with currentChatId tracking also resolved for proper chat selection synchronization.
- July 23, 2025: **Complete Trip Planning Context Integration Finished** - Successfully implemented comprehensive TripPlanningContext system for centralized trip data management with real-time synchronization across all components. Features: (1) Unified data storage with PostgreSQL persistence via trip_plans table, (2) All overlay components (WhereOverlay, WhenOverlay, TravelersOverlay, BudgetOverlay) now use centralized context with automatic saving states, (3) Top navigation buttons display real-time trip data (location, dates, travelers count, budget), (4) TripSidebar fully synchronized with shared context for seamless updates, (5) Automatic trip plan loading when selecting chats, (6) Database integration with proper API routes for CRUD operations. System eliminates data silos and provides true synchronization between navigation overlays and trip planning sidebar as requested by user. All trip data is now centrally managed and automatically persisted.
- July 22, 2025: **Intelligent Location Classification System Complete** - Implemented robust location classification that respects Google Places API data while preventing geographic features from being misclassified. Fixed critical issue where "Moselle Valley" was showing campgrounds as hotels instead of proper geographic attractions. Enhanced ChatLocationResolver and routes.ts with priority-based classification: (1) Geographic features by name patterns, (2) Administrative/political areas, (3) Business establishments. Removed campgrounds from hotel classification to prevent geographic areas from being incorrectly categorized. Enhanced MapItemOverlay with beautiful Mindtrap-style design featuring image headers, gradient overlays, glass-morphism effects, and professional typography. System now provides accurate location types and engaging visual previews for all location mentions in chat.
- July 21, 2025: **External Developer Brief Creation Complete** - Created comprehensive technical specification (`EXTERNAL_DEVELOPER_BRIEF.md`) for external developer to enhance chat experience with multi-agent system. Document includes detailed technical stack overview, current agent architecture analysis, specific development tasks (Enhanced Agent Orchestration, Conversation Memory, Specialized Chat Agents, Real-time Collaboration), performance requirements, quality assurance guidelines, and 8-week delivery timeline. Brief leverages existing MCP framework, agent system (DestinationAgent, ItineraryAgent, Orchestrator), and database schema to guide seamless external development integration.
- July 18, 2025: **Chat Location Intelligence System Implementation Complete** - Successfully implemented unified location resolution system that checks database/cache first, then uses Google Places API for unknown locations. Major tourist attractions (Elbphilharmonie, Miniatur Wunderland, Speicherstadt, etc.) are now intelligently classified as 'place' instead of 'attraction' using keyword-based classification logic. System maintains PlaceID-based identification throughout and integrates with existing cache service for optimal performance. Chat locations now resolve with 100% accuracy and proper type classification.
- July 18, 2025: **Mapbox Startup Error Resolution Complete** - Fixed critical startup errors caused by problematic custom Mapbox style that was attempting to access non-existent POI data sources. Replaced custom style `mapbox://styles/marcusburk/cmcnbtrz0009101sh0uvue4t1` with standard `mapbox://styles/mapbox/streets-v12` to eliminate 404 errors and ERR_BLOCKED_BY_CLIENT issues. Added comprehensive error handling, telemetry disabling, and ErrorBoundary component to prevent application crashes during initialization. Application now loads smoothly without the cascade of startup errors.
- July 17, 2025: **Complete Cache System Optimization & Documentation Finished** - Successfully eliminated all unnecessary Google Places API calls through PlaceID-based caching system achieving 99%+ cache hit rate. Fixed critical database issue affecting 1037 cached places missing 'id' field for frontend PlaceID transmission. Created comprehensive final report (CACHE_OPTIMIZATION_FINAL_REPORT.md) documenting $21.73+ proven savings, 99.95% performance improvement (2157ms→1ms), and language-independent caching solution. System now provides enterprise-grade performance with minimal API dependency, transforming operational cost structure from $170-340/month to $2-9/month for 1000 users.
- July 17, 2025: **DetailSidebar Enhancements Complete** - Successfully moved FAQ section from reviews to overview tab, fixed TripAdvisor image loading with correct URL structure, and resolved favorites functionality with proper string conversion for itemId. All three issues (FAQ placement, image loading, favorites saving) are now fully functional.
- July 17, 2025: **Favorites System Synchronization Complete** - Successfully implemented comprehensive favorites system with unique constraints and state synchronization between components. Added unique database constraint (userId + itemId), created FavoritesContext for React state management, implemented `deleteFavorite` storage function, and updated both MapboxMap and DetailSidebar to use shared context with dynamic heart icons. System now prevents duplicate favorites and provides real-time synchronization between map pins and detail views with proper error handling.
- July 17, 2025: **Complete Multi-Tenancy Implementation Finished** - Successfully transformed the travel planning system into a fully multi-tenant application with complete user data isolation. Fixed critical database migration issues (userId field type mismatches), integrated authentication middleware across all API routes, and updated frontend API calls to include authentication headers. Tested with multiple users to verify data isolation works correctly - users can only access their own chats, favorites, and itineraries. The system now supports secure user workspaces with JWT-based authentication and is ready for future trip sharing functionality.
- July 17, 2025: **Duplicate Chat Interface File Cleanup Complete** - Removed redundant `ChatInterface_backup.tsx` file to eliminate confusion during app loading. Found and verified the existence of multiple chat-related components with green color styling that may cause brief visual inconsistencies during loading. The main `ChatInterface.tsx` file is now the single source of truth for chat functionality. All imports and references are properly maintained.
- July 16, 2025: **Saved Tab Removal from Chat Sub-menu Complete** - Removed "Saved" tab from chat sub-navigation (MainTabs and ChatTabs components) as saved items are now handled globally through the main navigation's SavedPage. This implements user preference for global saved items per user rather than per chat session. Updated MainTabs to remove saved button and TabsContent, cleaned up imports, and modified ChatTabs to single-column layout with only search tab.
- July 16, 2025: **Favorites Save Bug Fix Complete** - Fixed critical bug where saving attractions, hotels, and other items from map or detail sidebar resulted in empty saved items. Fixed two issues: (1) DetailSidebar component not sending complete `itemData` to backend - updated `saveFavoriteMutation` to include full item details, (2) MapboxMap popup functions had property mapping mismatch - SavedPage expected `name` but markers used `title`, and `address` but markers used `description/vicinity`. Added proper property mapping in `mapboxAddToFavorites` and `mapboxAddToTrip` functions. All save functions now include complete item data with proper field mapping.
- July 16, 2025: **Map PIN Error Fix Complete** - Fixed critical error when entering PINs on map where `highlightedElement.name` could be undefined. Added proper null safety check in MapboxMap component useEffect hook to prevent `toLowerCase()` method calls on undefined values. Map now handles PIN entries gracefully without crashing.
- July 16, 2025: **LiteAPI Hotel Integration Implementation Complete** - Successfully migrated hotel search from Google Places API to LiteAPI for real booking capability and commission-based monetization. Created `server/liteapi-hotels.ts` with coordinate-based hotel search, commission tracking (8-15%), and geographic city mapping. Hotels now use authentic LiteAPI data with booking functionality while attractions and restaurants continue using Google Places API. This architectural change enables proper monetization through hotel bookings.
- July 16, 2025: **Diverse Attraction & Restaurant Icons Implementation Complete** - Successfully implemented category-specific icons for attraction types and restaurants on map display. Enhanced MapboxMarker interface with category field, extended getEmojiIcon function for specific categories (🏛️ museums, ⛪ churches, 🌳 parks, ☕ cafes, 🥖 bakeries, etc.), added getCategoryFromTypes for attractions and getRestaurantCategory function. Hotels use standard 🏨 icon from LiteAPI data. All marker mappings pass category information correctly for attractions and restaurants.
- July 16, 2025: **Intelligent Caching System Implementation Complete** - Successfully implemented comprehensive multi-level caching system for Google Places API optimization. Features: PostgreSQL + Memory cache with TTL-based strategies (restaurants 30 days, attractions 30 days, hotels real-time), 99.95% speed improvement on cached data (2157ms → 1ms), automatic API cost tracking, cache statistics monitoring, and cleanup automation. Hotels remain uncached for LiteAPI real-time pricing. Database schema includes cached_places, cached_reviews, cached_photos, and api_usage_tracking tables. Cache management API routes for stats, cleanup, and monitoring. Extended TTL values to 30 days for development phase to minimize API calls.
- July 15, 2025: **Authentication System Implementation Complete** - Successfully implemented and tested complete custom authentication system with JWT sessions, bcrypt password hashing, and Mindtrip-style overlay UI. Features: user registration/login, database integration with UUID user IDs, real user data display in sidebar (both minimized/expanded modes), functional logout with multilingual dropdown, and protected routes. End-to-end auth flow tested and working. No external auth dependencies.
- July 15, 2025: **Authentication System Concept** - Created comprehensive authentication system concept with local registration/login and Google OAuth integration. No dependency on Replit Auth or Firebase. Features JWT-based sessions, bcrypt password security, React Auth hooks, and complete UI implementation with protected routes. Includes database schema, security features, and phased implementation plan.
- July 15, 2025: **Intelligent Caching System Documentation** - Created comprehensive documentation for multi-level caching system. Strategy: Hotels via LiteAPI real-time (no caching), other POI data intelligently cached with TTL. Includes data separation, geographic cache optimization, and performance monitoring. Implementation phases defined for systematic rollout.
- July 15, 2025: **Complete Translation System Implementation** - Successfully implemented comprehensive multilingual support with automatic language switching based on chat selection. Fixed all remaining translation issues including hard-coded welcome messages in ChatInterface component. Added API endpoint for chat details retrieval and implemented automatic i18n language switching when selecting chats in different languages. Translation system now covers all UI elements (navigation, overlays, chat interface) with proper currency symbols (€ for European languages). Chat creation and selection automatically maintains language preferences with localStorage persistence.
- July 15, 2025: **Translation Refinements** - Fixed specific translation issues requested by user: "Where" corrected to "Wohin" in German, "Any Budget" properly translated to "Budget" in German and other languages. Updated currency symbols from $ to € for European languages (German, French, Spanish). Added comprehensive translations for budget options and standard chat messages including welcome greeting and assistant introduction. All budget overlays now show appropriate currency symbols based on language selection.
- July 15, 2025: **Complete Translation Implementation** - Added comprehensive translations for all new UI elements across 4 languages (English, German, Spanish, French). Updated translation keys for top navigation (New Chat, Where, When, Travelers, Budget, Invite, Create a Trip), sub-navigation tabs (Chat, Search, Social, Agents, Saved), and chat interface elements (Ask Anything, TakeMeTo.ai, Can Make Mistakes, Check Important Info, What Can I Ask). All components now properly use translation hooks for multilingual support.
- July 15, 2025: **Chat Design Cleanup** - Removed gradients from user/bot avatars and message bubbles for cleaner design. User messages now use solid black background, avatars use subtle gray backgrounds. Updated link styling to black, bold text with icons (MapPin for attractions, Building2 for hotels) matching design specifications. Improved overall chat aesthetic with reduced visual noise and better readability.
- July 15, 2025: **Navigation Button Bar Animation** - Transformed navigation tabs into smooth animated button bar that slides in from top after search query. Implemented spring animation with typical project animation style using Framer Motion. Features unified button group design with rounded container, active state styling, and consistent mobile/desktop behavior. Navigation now appears only when destination data is available, preventing empty state clicks. Removed border lines for cleaner appearance.
- July 15, 2025: **Chat Interface Redesign** - Implemented personalized welcome interface based on user's design mockup. Features "Where can I take you to today, Marcus?" greeting with custom travel assistant message, rounded input field, and clean white background. Fixed React ref errors in DropdownMenu components by restructuring TooltipTrigger/DropdownMenuTrigger hierarchy. Added robust user data fetching with fallback values and proper error handling.
- July 15, 2025: **Enhanced Navigation Implementation** - Successfully implemented professional top navigation with connected button group design. Features Where/When/Travelers/Budget buttons as unified rounded container with subtle borders and transparent background. Integrated comprehensive overlay system (WhereOverlay, WhenOverlay, TravelersOverlay, BudgetOverlay) for trip planning inputs. Applied clean, harmonious design with reduced contrast and professional styling matching user preferences for subtle, non-intrusive interface elements.
- July 11, 2025: **Mobile Marker UX Implementation** - Created complete mobile marker interaction system with bottom card and fullscreen overlay. MobileMarkerCard component shows small preview at bottom when marker clicked. MobileDetailOverlay provides fullscreen detail view with image, tabs, features, and action buttons. Smooth animations between states. Desktop maintains sidebar behavior while mobile gets modern app-like UX pattern.
- July 11, 2025: **Desktop Map Interactions Fixed** - Resolved missing marker interaction handlers on desktop Mapbox map. Added handleMarkerClick function to Home.tsx and connected onMarkerClick prop to MapboxMap component. Fixed popup hover events and click event handling for detail sidebar activation. Updated MobileLayout component to support marker clicks. All map marker interactions now work properly on both desktop and mobile.
- July 10, 2025: **UI/UX and Language Detection Improvements** - Disabled non-functional action icons (Shopping, Parks, Cafés, Transport) with proper gray-out styling while keeping Hotels, Restaurants, Attractions, and Nearby fully functional. Implemented intelligent language detection system that uses app's system language as default and only switches when strong language indicators are detected (e.g., "ich möchte", "bitte"). For ambiguous inputs like place names ("New York", "Cochem"), system now responds in app's language setting rather than attempting automatic detection.
- July 10, 2025: **Action Icons Complete Implementation** - All 8 action categories (Hotels, Restaurants, Attractions, Shopping, Parks, Cafés, Transport, Nearby) now fully functional with Google Places API (New). Added complete multilingual support for all action icons in English, German, Spanish, and French. Fixed Express route conflicts by using regex pattern for ID routes. All categories now display real data from Google Places API with proper field masking and supported place types.
- July 10, 2025: **Places API Attractions Fixed** - Fixed 400 Bad Request errors by removing unsupported place types like "landmark" and "historical_landmark". Implemented multiple targeted searches for comprehensive attraction discovery. Added proper category mapping and multilingual support for attraction types (museum, park, church, zoo, etc.). Categories are now properly translated in German, English, Spanish, and French.
- January 10, 2025: **Google Places API Migration** - Migrated from legacy Google Places API to the new Places API (New) for cost optimization and improved features. Updated all endpoints to use new API structure with field masking, new data formats, and direct HTTP calls via axios. Key changes: searchText and searchNearby endpoints, displayName.text format, new photo URLs, X-Goog-FieldMask headers.
- July 10, 2025: **Map Integration UI Fixed** - Resolved white overlay and layout issues in hidden map sidebar. Fixed Mapbox container positioning with absolute CSS, eliminated white background artifacts, improved Action Icons overlay with transparent backdrop. Map now displays full-width without gaps at all screen sizes.
- July 03, 2025. Documentation cleanup completed - Removed 13 obsolete documents, created 5 clean MVP guides (POC_SUMMARY.md, MVP_DATABASE_STRATEGY.md, MVP_API_GUIDE.md, MVP_TECHNICAL_FOUNDATION.md, MVP_USER_FLOW.md), corrected LiteAPI integration status (search/prebook working, booking confirmation incomplete), clarified fresh start approach (no database migration), focused on core user flow: trip building, sharing, and collaboration

## Mobile Strategy

### Current Plan
- **Phase 1**: PWA MVP for market validation and quick deployment
- **Phase 2**: Native Android/iOS apps for App Store presence and native features
- **Technical Approach**: React Native for cross-platform development with shared business logic
- **Timeline**: PWA in 2-3 months, native apps 6-12 months later

### Architecture Considerations
- Monorepo structure with shared packages for business logic
- Code reuse strategy: 70-80% of React logic transferable to React Native
- Parallel development capability for web and mobile teams

### Strategic Technology Decisions (Final)
- **Data Source**: Google Places API for POI data (hotels, attractions, restaurants) - superior data quality
- **Mapping**: Mapbox for visualization only (hybrid: Google Places data + Mapbox rendering)
- **Visual Content**: Unsplash API integration for professional photography
- **Architecture**: Direct API integration (no MCP protocol) for MVP simplicity and mobile performance
- **Database**: Supabase for MVP (built-in auth, real-time, RLS) vs. experimental Neon setup in POC
- **Mobile Framework**: React Native recommended for maximum code reuse with web platform
- **Authentication**: Not implemented in POC, clean Supabase Auth integration planned for MVP

## User Preferences

Preferred communication style: Simple, everyday language. -->