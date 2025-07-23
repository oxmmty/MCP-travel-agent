import { BaseAgent, AgentTaskInput, AgentTaskResult } from './base-agent';

export interface DestinationTaskData {
  destination: string;
  preferences?: string[];
  language?: string;
}

export class DestinationAgent extends BaseAgent {
  async execute(task: AgentTaskInput): Promise<AgentTaskResult> {
    try {
      const { destination, preferences = [], language = 'en' } = task.data as DestinationTaskData;

      // 1. Search for destination using Google Maps
      const destinationData = await this.callMCPTool('google-maps_search_destination', {
        query: destination
      });

      if (!destinationData || !destinationData.location) {
        return {
          success: false,
          error: `Destination "${destination}" not found`
        };
      }

      // 2. Find nearby hotels
      const hotels = await this.callMCPTool('google-maps_find_nearby_hotels', {
        lat: destinationData.location.lat,
        lng: destinationData.location.lng,
        radius: 15000
      });

      // 3. Find nearby attractions
      const attractions = await this.callMCPTool('google-maps_find_nearby_attractions', {
        lat: destinationData.location.lat,
        lng: destinationData.location.lng,
        radius: 25000
      });

      // 4. Find nearby restaurants
      const restaurants = await this.callMCPTool('google-maps_find_nearby_restaurants', {
        lat: destinationData.location.lat,
        lng: destinationData.location.lng,
        radius: 10000
      });

      // 5. Get additional insights from TripAdvisor if available
      let tripAdvisorData = null;
      try {
        tripAdvisorData = await this.callMCPTool('tripadvisor_search_location', {
          searchQuery: destination,
          category: 'geos'
        });
      } catch (error) {
        console.log('TripAdvisor data not available:', error.message);
      }

      // 6. Use LLM to analyze and summarize destination data
      const analysisPrompt = `Analyze this destination data and provide insights for travelers interested in ${preferences.join(', ')}:

Destination: ${destination}
Hotels found: ${(hotels?.hotels || hotels?.results || hotels || []).length}
Attractions found: ${(attractions?.attractions || attractions?.results || attractions || []).length}
Restaurants found: ${(restaurants?.restaurants || restaurants?.results || restaurants || []).length}

Provide a comprehensive analysis including:
1. Best areas to stay
2. Must-visit attractions
3. Local dining recommendations
4. Travel tips and considerations
5. Best time to visit

Respond in ${language === 'de' ? 'German' : 'English'}.`;

      const analysis = await this.askLLM(
        analysisPrompt,
        { 
          destination: destinationData,
          hotels: hotels?.results?.slice(0, 10),
          attractions: attractions?.results?.slice(0, 15),
          restaurants: restaurants?.results?.slice(0, 10),
          tripAdvisor: tripAdvisorData
        },
        `You are a knowledgeable travel advisor specializing in destination insights and recommendations.`
      );

      const result = {
        destination: destinationData,
        accommodations: {
          hotels: hotels?.hotels || hotels?.results || hotels || [],
          count: (hotels?.hotels || hotels?.results || hotels || []).length
        },
        attractions: {
          places: attractions?.attractions || attractions?.results || attractions || [],
          count: (attractions?.attractions || attractions?.results || attractions || []).length
        },
        dining: {
          restaurants: restaurants?.restaurants || restaurants?.results || restaurants || [],
          count: (restaurants?.restaurants || restaurants?.results || restaurants || []).length
        },
        insights: {
          analysis,
          preferences,
          language
        },
        tripAdvisor: tripAdvisorData
      };

      return {
        success: true,
        data: result,
        metadata: {
          totalPlaces: (hotels?.hotels || hotels?.results || hotels || []).length + 
                      (attractions?.attractions || attractions?.results || attractions || []).length + 
                      (restaurants?.restaurants || restaurants?.results || restaurants || []).length,
          searchRadius: { hotels: 15000, attractions: 25000, restaurants: 10000 }
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in destination analysis'
      };
    }
  }
}