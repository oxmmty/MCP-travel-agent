import { BaseAgent, AgentTaskInput, AgentTaskResult } from './base-agent';

export interface ItineraryTaskData {
  destination: string;
  startDate?: string;
  endDate?: string;
  duration?: number; // days
  preferences?: string[];
  budget?: string;
  attractions?: any[];
  hotels?: any[];
  restaurants?: any[];
  language?: string;
}

export class ItineraryAgent extends BaseAgent {
  async execute(task: AgentTaskInput): Promise<AgentTaskResult> {
    try {
      const { 
        destination, 
        startDate,
        endDate,
        duration = 3,
        preferences = [],
        budget,
        attractions = [],
        hotels = [],
        restaurants = [],
        language = 'en'
      } = task.data as ItineraryTaskData;

      // Calculate days if not provided
      let days = duration;
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      }

      // Create comprehensive itinerary using LLM
      const itineraryPrompt = `Create a detailed ${days}-day travel itinerary for ${destination}.

Available data:
- Hotels: ${hotels.length} options
- Attractions: ${attractions.length} places
- Restaurants: ${restaurants.length} dining options
- Preferences: ${preferences.join(', ')}
- Budget level: ${budget || 'Not specified'}
- Start date: ${startDate || 'Flexible'}

Requirements:
1. Create a day-by-day schedule
2. Include specific timing (morning, afternoon, evening)
3. Mix popular attractions with local experiences
4. Consider travel distances and logistics
5. Include meal recommendations
6. Add practical tips for each day
7. Suggest optimal accommodation areas

Format the response as a structured JSON with this format:
{
  "overview": "Brief itinerary summary",
  "days": [
    {
      "day": 1,
      "date": "2024-XX-XX",
      "theme": "Arrival & City Center",
      "activities": [
        {
          "time": "09:00",
          "type": "arrival",
          "title": "Airport Transfer",
          "description": "...",
          "location": "...",
          "duration": "1 hour",
          "cost": "€25-40",
          "tips": "..."
        }
      ]
    }
  ],
  "recommendations": {
    "accommodation": "...",
    "transportation": "...",
    "budget_tips": "...",
    "packing_suggestions": "..."
  }
}

Respond in ${language === 'de' ? 'German' : 'English'}.`;

      const itineraryResponse = await this.askLLM(
        itineraryPrompt,
        {
          destination,
          hotels: hotels.slice(0, 5),
          attractions: attractions.slice(0, 10),
          restaurants: restaurants.slice(0, 8),
          preferences,
          budget,
          duration: days
        },
        'You are an expert travel planner who creates detailed, practical itineraries. Always provide specific locations, timings, and actionable advice.'
      );

      // Parse the JSON response or create structured fallback
      let parsedItinerary;
      try {
        parsedItinerary = JSON.parse(itineraryResponse);
      } catch (parseError) {
        // Create structured itinerary from text response
        parsedItinerary = this.parseTextItinerary(itineraryResponse, days, destination);
      }

      // Enhance with location data
      const enhancedItinerary = await this.enhanceWithLocationData(parsedItinerary, attractions, restaurants);

      // Generate packing list
      const packingList = await this.generatePackingList(destination, preferences, language);

      // Create budget breakdown
      const budgetBreakdown = await this.generateBudgetBreakdown(destination, days, budget, language);

      const result = {
        itinerary: enhancedItinerary,
        metadata: {
          destination,
          duration: days,
          startDate,
          endDate,
          preferences,
          totalActivities: this.countActivities(enhancedItinerary),
          lastUpdated: new Date().toISOString()
        },
        packingList,
        budgetBreakdown,
        recommendations: {
          bestTimeToVisit: await this.getBestTimeToVisit(destination, language),
          localTips: await this.getLocalTips(destination, language)
        }
      };

      return {
        success: true,
        data: result,
        metadata: {
          generatedDays: days,
          totalRecommendations: attractions.length + restaurants.length + hotels.length
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in itinerary generation'
      };
    }
  }

  private parseTextItinerary(text: string, days: number, destination: string): any {
    return {
      overview: `${days}-day itinerary for ${destination}`,
      days: Array.from({ length: days }, (_, i) => ({
        day: i + 1,
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        theme: `Day ${i + 1}`,
        activities: [
          {
            time: "09:00",
            type: "sightseeing",
            title: "Explore city center",
            description: text.substring(0, 200) + "...",
            location: destination,
            duration: "4 hours"
          }
        ]
      })),
      recommendations: {
        accommodation: "Book centrally located accommodation",
        transportation: "Use public transport or walk",
        budget_tips: "Look for local eateries",
        packing_suggestions: "Comfortable walking shoes"
      }
    };
  }

  private async enhanceWithLocationData(itinerary: any, attractions: any[], restaurants: any[]): Promise<any> {
    // Add coordinates and additional details to activities
    if (itinerary.days) {
      for (const day of itinerary.days) {
        if (day.activities) {
          for (const activity of day.activities) {
            // Try to match activity with available attractions/restaurants
            const matchedPlace = [...attractions, ...restaurants].find(place => 
              place.name?.toLowerCase().includes(activity.title?.toLowerCase()) ||
              activity.title?.toLowerCase().includes(place.name?.toLowerCase())
            );
            
            if (matchedPlace) {
              activity.coordinates = matchedPlace.location;
              activity.placeId = matchedPlace.placeId;
              activity.rating = matchedPlace.rating;
            }
          }
        }
      }
    }
    
    return itinerary;
  }

  private async generatePackingList(destination: string, preferences: string[], language: string): Promise<string[]> {
    const packingPrompt = `Generate a practical packing list for ${destination} considering these preferences: ${preferences.join(', ')}. 
    
    Provide 15-20 essential items in ${language === 'de' ? 'German' : 'English'}.`;

    const packingResponse = await this.askLLM(packingPrompt);
    
    // Extract list items from response
    return packingResponse.split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^[-*•]\s*/, '').trim())
      .filter(item => item.length > 0)
      .slice(0, 20);
  }

  private async generateBudgetBreakdown(destination: string, days: number, budget: string | undefined, language: string): Promise<any> {
    const budgetPrompt = `Provide a realistic daily budget breakdown for ${destination} for ${days} days. 
    Budget level: ${budget || 'mid-range'}
    
    Include costs for accommodation, meals, transportation, attractions, and miscellaneous expenses.
    Respond in ${language === 'de' ? 'German' : 'English'}.`;

    const budgetResponse = await this.askLLM(budgetPrompt);
    
    return {
      summary: budgetResponse,
      dailyEstimate: budget === 'budget' ? '€50-80' : budget === 'luxury' ? '€200-400' : '€100-150',
      totalEstimate: budget === 'budget' ? `€${50 * days}-€${80 * days}` : budget === 'luxury' ? `€${200 * days}-€${400 * days}` : `€${100 * days}-€${150 * days}`
    };
  }

  private async getBestTimeToVisit(destination: string, language: string): Promise<string> {
    const timePrompt = `When is the best time to visit ${destination}? Consider weather, crowds, and prices. 
    Respond in ${language === 'de' ? 'German' : 'English'}.`;
    
    return await this.askLLM(timePrompt);
  }

  private async getLocalTips(destination: string, language: string): Promise<string> {
    const tipsPrompt = `Provide 5 insider tips for visiting ${destination} that most tourists don't know. 
    Respond in ${language === 'de' ? 'German' : 'English'}.`;
    
    return await this.askLLM(tipsPrompt);
  }

  private countActivities(itinerary: any): number {
    if (!itinerary.days) return 0;
    return itinerary.days.reduce((total: number, day: any) => 
      total + (day.activities?.length || 0), 0);
  }
}