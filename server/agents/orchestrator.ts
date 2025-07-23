import { BaseAgent, AgentTaskInput, AgentTaskResult } from "./base-agent";
import { DestinationAgent } from "./destination-agent";
import { ItineraryAgent } from "./itinerary-agent";
import { storage } from "../storage";
import type { InsertAgent, InsertTripPlan } from "@shared/schema";

export interface TripPlanningRequest {
  destination: string;
  chatId: number;
  userId: number;
  startDate?: string;
  endDate?: string;
  duration?: number;
  budget?: string;
  preferences?: string[];
  language?: string;
}

export interface TripPlanningResult {
  success: boolean;
  tripPlan?: any;
  destinationData?: any;
  itinerary?: any;
  agentTasks?: any[];
  error?: string;
}

export class TravelPlannerOrchestrator {
  private agents: Map<string, BaseAgent> = new Map();
  private agentIds: Map<string, number> = new Map();

  constructor() {
    this.initializeAgents();
  }

  private async initializeAgents() {
    // Create agent records in storage
    const destinationAgentData = await storage.createAgent({
      name: "Destination Research Agent",
      type: "destination",
      status: "active",
      config: {
        description:
          "Researches destinations, finds accommodations, attractions, and dining options",
        capabilities: ["google_maps", "tripadvisor", "location_analysis"],
      },
    });

    const itineraryAgentData = await storage.createAgent({
      name: "Itinerary Planning Agent",
      type: "itinerary",
      status: "active",
      config: {
        description:
          "Creates detailed day-by-day travel itineraries with optimized schedules",
        capabilities: [
          "itinerary_generation",
          "activity_scheduling",
          "budget_planning",
        ],
      },
    });

    // Initialize agent instances
    this.agents.set(
      "destination",
      new DestinationAgent(destinationAgentData.id),
    );
    this.agents.set("itinerary", new ItineraryAgent(itineraryAgentData.id));

    this.agentIds.set("destination", destinationAgentData.id);
    this.agentIds.set("itinerary", itineraryAgentData.id);

    console.log("Travel planning agents initialized");
  }

  async planTrip(request: TripPlanningRequest): Promise<TripPlanningResult> {
    try {
      console.log(`Starting trip planning for ${request.destination}`);

      // Create initial trip plan record
      const tripPlan = await storage.createTripPlan({
        chatId: request.chatId,
        userId: request.userId,
        destination: request.destination,
        startDate: request.startDate || null,
        endDate: request.endDate || null,
        budget: request.budget || null,
        currency: "EUR",
        preferences: request.preferences || null,
        status: "planning",
      });

      const agentTasks: any[] = [];

      // Phase 1: Destination Research
      console.log("Phase 1: Researching destination...");
      const { itineraryLogger } = await import("../itinerary-logger.js");

      itineraryLogger.logDestinationAgent(
        request.chatId,
        "destination_research",
        "Analysiere Reiseziel und sammle Informationen...",
        10,
      );

      const destinationAgent = this.agents.get("destination");
      if (!destinationAgent) {
        throw new Error("Destination agent not available");
      }

      const destinationTask: AgentTaskInput = {
        type: "destination_research",
        data: {
          destination: request.destination,
          preferences: request.preferences || [],
          language: request.language || "en",
        },
        chatId: request.chatId,
        context: { tripPlanId: tripPlan.id },
      };

      itineraryLogger.logDestinationAgent(
        request.chatId,
        "places_search",
        "Suche Hotels, Restaurants und Attraktionen...",
        30,
      );

      const destinationResult =
        await destinationAgent.executeWithTracking(destinationTask);
      agentTasks.push(destinationResult);

      if (!destinationResult.success) {
        await storage.updateTripPlan(tripPlan.id, { status: "failed" });
        return {
          success: false,
          error: `Destination research failed: ${destinationResult.error}`,
          agentTasks,
        };
      }

      itineraryLogger.logDestinationAgent(
        request.chatId,
        "research_complete",
        "Destination-Recherche abgeschlossen",
        50,
      );
      console.log("Destination research completed successfully");

      // Phase 2: Itinerary Generation
      console.log("Phase 2: Generating itinerary...");
      itineraryLogger.logItineraryAgent(
        request.chatId,
        "itinerary_planning",
        "Erstelle detaillierten Tagesplan...",
        60,
      );

      const itineraryAgent = this.agents.get("itinerary");
      if (!itineraryAgent) {
        throw new Error("Itinerary agent not available");
      }

      const destinationData = destinationResult.data;
      const itineraryTask: AgentTaskInput = {
        type: "itinerary_generation",
        data: {
          destination: request.destination,
          startDate: request.startDate,
          endDate: request.endDate,
          duration: request.duration || 3,
          preferences: request.preferences || [],
          budget: request.budget,
          attractions: destinationData.attractions?.places || [],
          hotels: destinationData.accommodations?.hotels || [],
          restaurants: destinationData.dining?.restaurants || [],
          language: request.language || "en",
        },
        chatId: request.chatId,
        context: { tripPlanId: tripPlan.id, destinationData },
      };

      itineraryLogger.logItineraryAgent(
        request.chatId,
        "schedule_optimization",
        "Optimiere Tagesabläufe und Routen...",
        75,
      );

      const itineraryResult =
        await itineraryAgent.executeWithTracking(itineraryTask);
      agentTasks.push(itineraryResult);

      if (!itineraryResult.success) {
        await storage.updateTripPlan(tripPlan.id, {
          status: "partially_complete",
        });
        return {
          success: false,
          error: `Itinerary generation failed: ${itineraryResult.error}`,
          destinationData,
          agentTasks,
        };
      }

      itineraryLogger.logItineraryAgent(
        request.chatId,
        "itinerary_complete",
        "Reiseplan erfolgreich erstellt",
        90,
      );
      console.log("Itinerary generation completed successfully");

      // Update trip plan with complete data
      itineraryLogger.logDataIntegration(
        request.chatId,
        "finalizing_data",
        "Finalisiere Daten und speichere Ergebnisse...",
        95,
      );

      const finalTripPlan = await storage.updateTripPlan(tripPlan.id, {
        status: "ready",
        generatedPlan: {
          destination: destinationData,
          itinerary: itineraryResult.data,
          generatedAt: new Date().toISOString(),
          agentSummary: {
            destinationAgent: {
              status: "completed",
              placesFound: destinationResult.metadata?.totalPlaces || 0,
            },
            itineraryAgent: {
              status: "completed",
              daysGenerated: itineraryResult.metadata?.generatedDays || 0,
            },
          },
        },
      });

      console.log(`Trip planning completed for ${request.destination}`);

      return {
        success: true,
        tripPlan: finalTripPlan,
        destinationData,
        itinerary: itineraryResult.data,
        agentTasks,
      };
    } catch (error) {
      console.error("Trip planning orchestration failed:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown orchestration error",
      };
    }
  }

  async getAgentStatus(): Promise<any> {
    const agents = await storage.getAgents();
    const agentStatus = {};

    for (const agent of agents) {
      const tasks = await storage.getAgentTasks(agent.id);
      agentStatus[agent.type] = {
        id: agent.id,
        name: agent.name,
        status: agent.status,
        totalTasks: tasks.length,
        pendingTasks: tasks.filter((t) => t.status === "pending").length,
        runningTasks: tasks.filter((t) => t.status === "running").length,
        completedTasks: tasks.filter((t) => t.status === "completed").length,
        failedTasks: tasks.filter((t) => t.status === "failed").length,
      };
    }

    return agentStatus;
  }

  async getChatAgentActivity(chatId: number): Promise<any> {
    const tasks = await storage.getChatAgentTasks(chatId);
    const tripPlan = await storage.getChatTripPlan(chatId);

    return {
      tripPlan,
      agentTasks: tasks.map((task) => ({
        id: task.id,
        agentId: task.agentId,
        taskType: task.taskType,
        status: task.status,
        createdAt: task.createdAt,
        completedAt: task.completedAt,
        error: task.error,
      })),
      summary: {
        totalTasks: tasks.length,
        completedTasks: tasks.filter((t) => t.status === "completed").length,
        failedTasks: tasks.filter((t) => t.status === "failed").length,
        lastActivity:
          tasks.length > 0
            ? Math.max(...tasks.map((t) => new Date(t.createdAt).getTime()))
            : null,
      },
    };
  }
}

export const travelOrchestrator = new TravelPlannerOrchestrator();
