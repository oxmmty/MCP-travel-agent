# MVP Technical Foundation

## Architecture Overview

Clean, production-ready travel planning platform with commission-based monetization.

### Core Technology Stack
- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: Supabase (PostgreSQL + Auth + Real-time)
- **Mapping**: Mapbox (visualization) + Google Places API (data)
- **AI**: OpenAI GPT-4 for travel planning
- **Images**: Unsplash professional photography
- **Monetization**: LiteAPI hotel booking (8-15% commission)

## Key Strategic Decisions

### Hybrid Data + Visualization Approach
```typescript
interface TravelDataFlow {
  dataSource: 'Google Places API';    // Best POI data quality
  visualization: 'Mapbox';            // Superior mobile performance
  monetization: 'LiteAPI';            // Hotel booking commissions
  content: 'Unsplash';                // Professional photography
  intelligence: 'OpenAI GPT-4';       // Travel planning AI
}
```

### Database Strategy: Supabase
- **Authentication**: Built-in email, OAuth, magic links
- **Real-time**: WebSocket subscriptions for live updates
- **Security**: Row Level Security (RLS) policies
- **API**: Auto-generated REST endpoints
- **Mobile**: Full React Native support

### Mobile-First Architecture
- **Framework**: React Native for maximum code reuse
- **Offline**: Mapbox offline maps + cached data
- **Performance**: Vector tiles, optimized imagery
- **Native Features**: Push notifications, biometric auth

## Production Deployment

### Environment Setup
```bash
# Core Services
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
DATABASE_URL=

# External APIs
GOOGLE_MAPS_API_KEY=
VITE_MAPBOX_ACCESS_TOKEN=
OPENAI_API_KEY=
UNSPLASH_ACCESS_KEY=

# Monetization
LITEAPI_PUBLIC_KEY=
LITEAPI_PRIVATE_KEY=
```

### Scalability Considerations
- Supabase: Auto-scaling PostgreSQL
- API rate limiting: Built-in protection
- CDN: Global image and asset delivery
- Caching: Redis for frequent queries

This foundation provides a clean, scalable base for MVP development with clear paths to mobile deployment and revenue generation.