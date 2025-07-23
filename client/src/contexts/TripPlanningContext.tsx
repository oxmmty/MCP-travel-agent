import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';

interface TripPlanningData {
  location: string;
  startDate: Date | null;
  endDate: Date | null;
  duration: number;
  travelers: number;
  budget: string;
  isRoadTrip: boolean;
}

interface TripPlanningContextType {
  tripData: TripPlanningData;
  updateTripData: (updates: Partial<TripPlanningData>) => void;
  saveTripPlan: (chatId?: number) => Promise<void>;
  loadTripPlan: (chatId: number) => Promise<void>;
  isLoading: boolean;
  isSaving: boolean;
  tripPlanId?: number;
  currentChatId?: number;
  setCurrentChatId: (chatId: number | undefined) => void;
}

const defaultTripData: TripPlanningData = {
  location: '',
  startDate: null,
  endDate: null,
  duration: 5,
  travelers: 2,
  budget: 'Mid-range',
  isRoadTrip: false,
};

const TripPlanningContext = createContext<TripPlanningContextType | undefined>(undefined);

interface TripPlanningProviderProps {
  children: ReactNode;
}

export function TripPlanningProvider({ children }: TripPlanningProviderProps) {
  const [tripData, setTripData] = useState<TripPlanningData>(defaultTripData);
  const [currentChatId, setCurrentChatId] = useState<number | undefined>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch trip plan for current chat
  const { data: existingTripPlan, isLoading } = useQuery({
    queryKey: [`/api/trip-plans/${currentChatId}`],
    enabled: !!currentChatId && currentChatId > 0,
    retry: false,
  });

  // Save trip plan mutation
  const saveTripPlanMutation = useMutation({
    mutationFn: async ({ chatId, tripPlanData }: { chatId?: number; tripPlanData: TripPlanningData }) => {
      if (!chatId || chatId <= 0) return;
      
      const response = await apiRequest('POST', '/api/trip-plans', {
        chatId,
        destination: tripPlanData.location,
        startDate: tripPlanData.startDate?.toISOString(),
        endDate: tripPlanData.endDate?.toISOString(),
        budget: tripPlanData.budget,
        preferences: {
          travelers: tripPlanData.travelers,
          duration: tripPlanData.duration,
          isRoadTrip: tripPlanData.isRoadTrip,
        },
        status: 'draft',
      });
      return response.json();
    },
    onSuccess: () => {
      if (currentChatId) {
        queryClient.invalidateQueries({ queryKey: [`/api/trip-plans/${currentChatId}`] });
      }
    },
  });

  // Update trip plan mutation
  const updateTripPlanMutation = useMutation({
    mutationFn: async ({ tripPlanId, tripPlanData }: { tripPlanId: number; tripPlanData: TripPlanningData }) => {
      const response = await apiRequest('PUT', `/api/trip-plans/${tripPlanId}`, {
        destination: tripPlanData.location,
        startDate: tripPlanData.startDate?.toISOString(),
        endDate: tripPlanData.endDate?.toISOString(),
        budget: tripPlanData.budget,
        preferences: {
          travelers: tripPlanData.travelers,
          duration: tripPlanData.duration,
          isRoadTrip: tripPlanData.isRoadTrip,
        },
      });
      return response.json();
    },
    onSuccess: () => {
      if (currentChatId) {
        queryClient.invalidateQueries({ queryKey: [`/api/trip-plans/${currentChatId}`] });
      }
    },
  });

  // Load existing trip plan data when available
  useEffect(() => {
    if (existingTripPlan && typeof existingTripPlan === 'object' && 'id' in existingTripPlan) {
      const preferences = (existingTripPlan as any).preferences || {};
      setTripData({
        location: (existingTripPlan as any).destination || '',
        startDate: (existingTripPlan as any).startDate ? new Date((existingTripPlan as any).startDate) : null,
        endDate: (existingTripPlan as any).endDate ? new Date((existingTripPlan as any).endDate) : null,
        duration: preferences.duration || 5,
        travelers: preferences.travelers || 2,
        budget: (existingTripPlan as any).budget || 'Mid-range',
        isRoadTrip: preferences.isRoadTrip || false,
      });
    }
  }, [existingTripPlan]);

  const updateTripData = (updates: Partial<TripPlanningData>) => {
    setTripData(prev => ({ ...prev, ...updates }));
  };

  const saveTripPlan = async (chatId?: number) => {
    const targetChatId = chatId || currentChatId;
    if (!targetChatId || targetChatId <= 0) return;

    if (existingTripPlan && typeof existingTripPlan === 'object' && 'id' in existingTripPlan) {
      // Update existing trip plan
      await updateTripPlanMutation.mutateAsync({
        tripPlanId: (existingTripPlan as any).id,
        tripPlanData: tripData,
      });
    } else {
      // Create new trip plan
      await saveTripPlanMutation.mutateAsync({
        chatId: targetChatId,
        tripPlanData: tripData,
      });
    }
  };

  const loadTripPlan = async (chatId: number) => {
    setCurrentChatId(chatId);
    // The useQuery will automatically refetch when currentChatId changes
  };

  const isSaving = saveTripPlanMutation.isPending || updateTripPlanMutation.isPending;

  return (
    <TripPlanningContext.Provider
      value={{
        tripData,
        updateTripData,
        saveTripPlan,
        loadTripPlan,
        isLoading,
        isSaving,
        tripPlanId: existingTripPlan && typeof existingTripPlan === 'object' && 'id' in existingTripPlan ? (existingTripPlan as any).id : undefined,
        currentChatId,
        setCurrentChatId,
      }}
    >
      {children}
    </TripPlanningContext.Provider>
  );
}

export function useTripPlanning() {
  const context = useContext(TripPlanningContext);
  if (context === undefined) {
    throw new Error('useTripPlanning must be used within a TripPlanningProvider');
  }
  return context;
}