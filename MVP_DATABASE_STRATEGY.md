# MVP Database Strategy: Supabase Migration

## Overview

This document outlines the database strategy for the MVP, transitioning from the POC's experimental setup to a production-ready Supabase architecture.

## POC vs MVP Database Comparison

### Current POC Setup (Experimental)
```typescript
// POC Database - "nur rein geschissen"
interface POCDatabase {
  provider: 'Neon Serverless PostgreSQL';
  orm: 'Drizzle ORM';
  schema: 'Experimental tables for testing concepts';
  features: [
    'Basic chat storage',
    'Destination data',
    'LiteAPI booking experiments',
    'Social media content (removed for MVP)'
  ];
  authentication: 'None (development only)';
  realTimeFeatures: 'None';
}
```

### MVP Target Setup (Production-Ready)
```typescript
// MVP Database - Clean Supabase Architecture
interface MVPDatabase {
  provider: 'Supabase (PostgreSQL + Auth + Real-time)';
  orm: 'Drizzle ORM (consistent with POC)';
  schema: 'Properly designed from scratch';
  features: [
    'Built-in authentication',
    'Real-time subscriptions',
    'Row Level Security (RLS)',
    'Automatic API generation',
    'Edge functions support'
  ];
  deployment: 'Cloud-native with global CDN';
}
```

## Why Supabase for MVP?

### Built-in Features
1. **Authentication**: Email, OAuth, magic links out of the box
2. **Real-time**: WebSocket subscriptions for live updates
3. **Security**: Row Level Security policies
4. **API**: Auto-generated REST and GraphQL APIs
5. **Storage**: File uploads for user-generated content
6. **Edge Functions**: Serverless functions for complex logic

### Development Benefits
```typescript
interface SupabaseBenefits {
  setup: 'Zero infrastructure management';
  scaling: 'Automatic horizontal scaling';
  security: 'Built-in authentication and RLS';
  development: 'Instant API generation';
  monitoring: 'Built-in analytics and logging';
  cost: 'Free tier: 50,000 monthly active users';
}
```

## MVP Database Schema Design

### Core Tables (Clean Design)
```sql
-- User management (Supabase Auth integration)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  travel_preferences JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Trip planning
CREATE TABLE trips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'planning', -- planning, confirmed, completed, cancelled
  budget_total DECIMAL(10,2),
  currency TEXT DEFAULT 'EUR',
  metadata JSONB, -- preferences, notes, AI analysis
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Trip items (hotels, attractions, restaurants)
CREATE TABLE trip_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- hotel, attraction, restaurant, transport
  name TEXT NOT NULL,
  description TEXT,
  location_name TEXT,
  coordinates POINT, -- PostGIS point type
  scheduled_date DATE,
  scheduled_time TIME,
  duration_minutes INTEGER,
  cost DECIMAL(10,2),
  booking_status TEXT DEFAULT 'planned', -- planned, booked, confirmed, cancelled
  external_ids JSONB, -- Google Places ID, LiteAPI ID, etc.
  metadata JSONB, -- photos, ratings, contact info
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Hotel bookings (LiteAPI integration)
CREATE TABLE hotel_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_item_id UUID REFERENCES trip_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  liteapi_booking_id TEXT UNIQUE,
  hotel_id TEXT NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  guest_count INTEGER NOT NULL,
  room_type TEXT,
  total_amount DECIMAL(10,2),
  commission_amount DECIMAL(10,2),
  currency TEXT DEFAULT 'EUR',
  booking_status TEXT DEFAULT 'pending', -- pending, confirmed, cancelled
  guest_details JSONB, -- names, contacts
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- AI conversation history
CREATE TABLE chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  title TEXT,
  language TEXT DEFAULT 'en',
  context JSONB, -- conversation context, preferences
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- user, assistant, system
  content TEXT NOT NULL,
  metadata JSONB, -- AI model info, processing time, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);
```

### Indexes for Performance
```sql
-- Essential indexes for travel app queries
CREATE INDEX idx_trips_user_id ON trips(user_id);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trip_items_trip_id ON trip_items(trip_id);
CREATE INDEX idx_trip_items_type ON trip_items(type);
CREATE INDEX idx_trip_items_date ON trip_items(scheduled_date);
CREATE INDEX idx_hotel_bookings_user_id ON hotel_bookings(user_id);
CREATE INDEX idx_hotel_bookings_status ON hotel_bookings(booking_status);
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);

-- Spatial index for location queries
CREATE INDEX idx_trip_items_coordinates ON trip_items USING GIST(coordinates);
```

### Row Level Security (RLS) Policies
```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can manage own trips" ON trips
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own trip items" ON trip_items
  FOR ALL USING (auth.uid() IN (
    SELECT user_id FROM trips WHERE id = trip_items.trip_id
  ));

CREATE POLICY "Users can manage own bookings" ON hotel_bookings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own chat sessions" ON chat_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own chat messages" ON chat_messages
  FOR ALL USING (auth.uid() IN (
    SELECT user_id FROM chat_sessions WHERE id = chat_messages.session_id
  ));
```

## Drizzle ORM Integration with Supabase

### Schema Definition
```typescript
// shared/supabase-schema.ts
import { pgTable, uuid, text, timestamp, decimal, integer, jsonb, date, time } from 'drizzle-orm/pg-core';

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  email: text('email'),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  travelPreferences: jsonb('travel_preferences'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const trips = pgTable('trips', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  destination: text('destination').notNull(),
  startDate: date('start_date'),
  endDate: date('end_date'),
  status: text('status').default('planning'),
  budgetTotal: decimal('budget_total', { precision: 10, scale: 2 }),
  currency: text('currency').default('EUR'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Additional tables...
```

### Supabase Client Configuration
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database client with Drizzle
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
export const db = drizzle(client);
```

## Migration Strategy

### Phase 1: MVP Schema Setup (Week 1)
```bash
# 1. Create Supabase project
# 2. Set up authentication
# 3. Create tables with proper RLS
# 4. Configure Drizzle ORM
# 5. Test basic CRUD operations
```

### Phase 2: Fresh Start Implementation (Week 2)
```bash
# 1. Create clean Supabase database from scratch
# 2. No data migration - fresh start approach
# 3. Implement user onboarding flow
# 4. Test with new user registrations
```

### Phase 3: Application Integration (Week 3)
```bash
# 1. Update API endpoints for Supabase
# 2. Implement authentication flows
# 3. Add real-time subscriptions
# 4. Test end-to-end functionality
```

## Key Differences from POC

### Authentication
```typescript
// POC: No authentication
// MVP: Supabase Auth with multiple providers
interface AuthenticationStrategy {
  providers: ['email/password', 'Google OAuth', 'Magic links'];
  session: 'JWT tokens with automatic refresh';
  security: 'Row Level Security policies';
}
```

### Real-time Features
```typescript
// POC: Basic WebSocket
// MVP: Supabase real-time subscriptions
const subscription = supabase
  .channel('trip-updates')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'trip_items' },
    (payload) => updateUI(payload)
  )
  .subscribe();
```

### Data Structure
```typescript
// POC: Experimental flat structure
// MVP: Normalized relational design
interface DataStructure {
  users: 'Proper user profiles with preferences';
  trips: 'Complete trip planning workflow';
  items: 'Flexible trip item system';
  bookings: 'Full booking lifecycle management';
  chats: 'Structured conversation history';
}
```

## Not Included in MVP (Future Features)

### Advanced Features for Later
- User collaboration on trips
- Trip sharing and social features
- Advanced analytics and reporting
- Multi-tenant organization support
- Advanced caching strategies
- Database sharding for scale

### Authentication Complexity
- Two-factor authentication
- Enterprise SSO integration
- Advanced role-based access control
- API key management for third parties

The MVP focuses on core functionality with a clean, scalable foundation that can be extended as the platform grows.