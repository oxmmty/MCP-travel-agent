import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Bot, Sparkles, CheckCircle, AlertCircle, Clock, Users, MapPin, Calendar } from 'lucide-react';
import SolverValidationPanel from './SolverValidationPanel';

interface TravelPlannerAgentProps {
  chatId?: number;
  destinationName?: string;
  onTripPlanGenerated?: (tripPlan: any) => void;
}

export default function TravelPlannerAgent({ chatId, destinationName, onTripPlanGenerated }: TravelPlannerAgentProps) {
  const [isPlanning, setIsPlanning] = useState(false);
  const queryClient = useQueryClient();

  // Fetch agent status
  const { data: agentStatus } = useQuery({
    queryKey: ['/api/agents/status'],
    refetchInterval: isPlanning ? 2000 : false,
  });

  // Fetch trip plan for this chat
  const { data: tripPlan } = useQuery({
    queryKey: [`/api/trip-plans/${chatId}`],
    enabled: !!chatId,
    refetchInterval: isPlanning ? 3000 : false,
  });

  // Fetch agent chat data
  const { data: agentChat } = useQuery({
    queryKey: ['/api/agents/chat'],
    refetchInterval: isPlanning ? 2000 : false,
  });

  // Generate trip plan mutation
  const generateTripMutation = useMutation({
    mutationFn: async (destination: string) => {
      const response = await apiRequest('POST', '/api/agents/plan-trip', {
        destination,
        chatId,
        userId: 1,
        duration: 3,
        budget: 'mid-range',
        preferences: ['culture', 'sightseeing', 'dining'],
        language: 'de',
      });
      return response.json();
    },
    onSuccess: (data) => {
      setIsPlanning(false);
      queryClient.invalidateQueries({ queryKey: [`/api/trip-plans/${chatId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/itinerary-items/${chatId}`] });
      if (onTripPlanGenerated && data.success) {
        onTripPlanGenerated(data);
      }
    },
    onError: () => {
      setIsPlanning(false);
    },
  });

  const handleGenerateTrip = () => {
    if (!destinationName) return;
    setIsPlanning(true);
    generateTripMutation.mutate(destinationName);
  };

  const getAgentStatusSummary = () => {
    if (!agentStatus) return null;
    
    const agents = Object.values(agentStatus) as any[];
    const totalTasks = agents.reduce((sum, agent) => sum + agent.totalTasks, 0);
    const completedTasks = agents.reduce((sum, agent) => sum + agent.completedTasks, 0);
    const runningTasks = agents.reduce((sum, agent) => sum + agent.runningTasks, 0);
    
    return { totalTasks, completedTasks, runningTasks };
  };

  const summary = getAgentStatusSummary();

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Bot className="w-5 h-5" />
          KI-Reiseplaner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Trip Plan Status */}
        {(tripPlan || agentChat?.tripPlan) && (
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className="font-medium">
                  {tripPlan?.destination || agentChat?.tripPlan?.destination || 'Reiseplan'}
                </span>
              </div>
              <Badge 
                variant={(tripPlan?.status || agentChat?.tripPlan?.status) === 'ready' ? 'default' : 'secondary'}
                className={(tripPlan?.status || agentChat?.tripPlan?.status) === 'ready' ? 'bg-green-100 text-green-800' : ''}
              >
                {(tripPlan?.status || agentChat?.tripPlan?.status) === 'ready' ? 'Fertig' : 'In Arbeit'}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{tripPlan?.duration || agentChat?.tripPlan?.duration || 3} Tage</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>2 Reisende</span>
              </div>
              <div className="flex items-center gap-1">
                <span>💰</span>
                <span>{tripPlan?.budget || agentChat?.tripPlan?.budget || 'Mittelklasse'}</span>
              </div>
            </div>

            {/* Show detailed plan if available */}
            {(tripPlan?.generatedPlan || agentChat?.tripPlan?.generatedPlan) && (
              <div className="mt-4 space-y-3">
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-sm text-green-700 flex items-center gap-1 mb-3">
                    <CheckCircle className="w-4 h-4" />
                    Reiseplan erfolgreich erstellt
                  </p>
                  
                  {/* Display generated plan content */}
                  <div className="space-y-2 text-sm">
                    {typeof (tripPlan?.generatedPlan || agentChat?.tripPlan?.generatedPlan) === 'string' ? (
                      <div className="bg-gray-50 p-3 rounded max-h-96 overflow-y-auto whitespace-pre-wrap">
                        {tripPlan?.generatedPlan || agentChat?.tripPlan?.generatedPlan}
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-3 rounded max-h-96 overflow-y-auto">
                        <pre className="text-xs">{JSON.stringify(tripPlan?.generatedPlan || agentChat?.tripPlan?.generatedPlan, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Solver Validation Panel */}
        {(tripPlan || agentChat?.tripPlan) && (
          <div className="mt-6">
            <SolverValidationPanel
              chatId={chatId || 1}
              tripData={{
                destination: (tripPlan as any)?.destination || (agentChat as any)?.tripPlan?.destination || 'Unknown',
                startDate: (tripPlan as any)?.startDate || (agentChat as any)?.tripPlan?.startDate,
                endDate: (tripPlan as any)?.endDate || (agentChat as any)?.tripPlan?.endDate,
                budget: 1000,
                currency: (tripPlan as any)?.currency || (agentChat as any)?.tripPlan?.currency || 'EUR',
                preferences: ['culture', 'sightseeing'],
                hotels: (tripPlan as any)?.generatedPlan?.destination?.accommodations?.hotels || 
                        (agentChat as any)?.tripPlan?.generatedPlan?.destination?.accommodations?.hotels || [],
                attractions: (tripPlan as any)?.generatedPlan?.destination?.attractions?.places || 
                            (agentChat as any)?.tripPlan?.generatedPlan?.destination?.attractions?.places || [],
                restaurants: (tripPlan as any)?.generatedPlan?.destination?.dining?.restaurants || 
                            (agentChat as any)?.tripPlan?.generatedPlan?.destination?.dining?.restaurants || [],
                duration: 3,
                id: (tripPlan as any)?.id || (agentChat as any)?.tripPlan?.id || 1
              }}
              onValidationComplete={(result) => {
                console.log('Solver validation completed:', result);
              }}
            />
          </div>
        )}

        {!tripPlan && (
          // Generate Trip Plan Section
          <div className="text-center space-y-3">
            {destinationName ? (
              <>
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">{destinationName}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Lassen Sie unsere KI-Agenten einen personalisierten Reiseplan erstellen
                  </p>
                  
                  <Button
                    onClick={handleGenerateTrip}
                    disabled={isPlanning}
                    className="w-full"
                  >
                    {isPlanning ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        KI-Agenten arbeiten...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Reiseplan generieren
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <Bot className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-500">
                  Wählen Sie ein Reiseziel im Chat aus, um einen KI-Reiseplan zu erstellen
                </p>
              </div>
            )}
          </div>
        )}

        {/* Agent Progress */}
        {isPlanning && summary && summary.totalTasks > 0 && (
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-blue-600 animate-pulse" />
              <span className="text-sm font-medium">KI-Agenten arbeiten</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Fortschritt</span>
                <span>{summary.completedTasks}/{summary.totalTasks} Aufgaben</span>
              </div>
              <Progress 
                value={(summary.completedTasks / summary.totalTasks) * 100} 
                className="h-2"
              />
              
              {summary.runningTasks > 0 && (
                <p className="text-xs text-blue-600 flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                  {summary.runningTasks} Agent{summary.runningTasks > 1 ? 'en' : ''} aktiv
                </p>
              )}
            </div>
          </div>
        )}

        {/* Error State */}
        {generateTripMutation.isError && (
          <div className="bg-red-50 rounded-lg p-3 border border-red-200">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">Fehler beim Erstellen des Reiseplans</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}