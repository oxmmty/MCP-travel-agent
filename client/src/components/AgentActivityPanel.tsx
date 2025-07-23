import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bot, Clock, CheckCircle, XCircle, Play, Loader } from 'lucide-react';

interface AgentStatus {
  id: number;
  name: string;
  status: string;
  totalTasks: number;
  pendingTasks: number;
  runningTasks: number;
  completedTasks: number;
  failedTasks: number;
}

interface TripPlanningRequest {
  destination: string;
  chatId: number;
  preferences?: string[];
  duration?: number;
  budget?: string;
  language?: string;
}

interface AgentActivityPanelProps {
  chatId: number;
  onTripPlanGenerated?: (tripPlan: any) => void;
}

export function AgentActivityPanel({ chatId, onTripPlanGenerated }: AgentActivityPanelProps) {
  const [isPlanning, setIsPlanning] = useState(false);
  const queryClient = useQueryClient();

  // Fetch agent status
  const { data: agentStatus } = useQuery({
    queryKey: ['/api/agents/status'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Fetch chat activity
  const { data: chatActivity } = useQuery({
    queryKey: ['/api/agents/chat', chatId, 'activity'],
    refetchInterval: 3000,
  });

  // Trip planning mutation
  const planTripMutation = useMutation({
    mutationFn: async (request: TripPlanningRequest) => {
      const response = await fetch('/api/agents/plan-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      return response.json();
    },
    onSuccess: (data) => {
      setIsPlanning(false);
      queryClient.invalidateQueries({ queryKey: ['/api/agents/chat', chatId, 'activity'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trip-plans', chatId] });
      if (onTripPlanGenerated && data.success) {
        onTripPlanGenerated(data);
      }
    },
    onError: () => {
      setIsPlanning(false);
    },
  });

  const handlePlanTrip = async (destination: string, preferences: string[] = []) => {
    setIsPlanning(true);
    planTripMutation.mutate({
      destination,
      chatId,
      preferences,
      duration: 3,
      budget: 'mid-range',
      language: 'de',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'running': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'running': return <Loader className="w-4 h-4 animate-spin" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return <Bot className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Agent Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            KI-Agenten Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {agentStatus ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(agentStatus as Record<string, AgentStatus>).map(([type, agent]) => (
                <div key={type} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{agent.name}</h4>
                    <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                      {agent.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Aufgaben gesamt:</span>
                      <span>{agent.totalTasks}</span>
                    </div>
                    
                    {agent.totalTasks > 0 && (
                      <>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Abgeschlossen</span>
                            <span>{agent.completedTasks}</span>
                          </div>
                          <Progress 
                            value={(agent.completedTasks / agent.totalTasks) * 100} 
                            className="h-2"
                          />
                        </div>
                        
                        <div className="flex gap-2 text-xs">
                          <Badge variant="outline" className="text-yellow-600">
                            {agent.pendingTasks} wartend
                          </Badge>
                          <Badge variant="outline" className="text-blue-600">
                            {agent.runningTasks} aktiv
                          </Badge>
                          {agent.failedTasks > 0 && (
                            <Badge variant="outline" className="text-red-600">
                              {agent.failedTasks} fehlgeschlagen
                            </Badge>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              Lade Agent-Status...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chat-specific Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Reiseplanung</CardTitle>
        </CardHeader>
        <CardContent>
            {chatActivity && (chatActivity as any).tripPlan ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Reiseplan: {(chatActivity as any).tripPlan.destination}</h4>
                  <Badge variant={(chatActivity as any).tripPlan.status === 'ready' ? 'default' : 'secondary'}>
                    {(chatActivity as any).tripPlan.status}
                  </Badge>
                </div>
                
                {(chatActivity as any).agentTasks.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Agent-Aufgaben:</h5>
                    {(chatActivity as any).agentTasks.map((task: any) => (
                      <div key={task.id} className="flex items-center gap-2 text-sm">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(task.status)}`} />
                        <span>{task.taskType}</span>
                        <div className="flex-1" />
                        {getStatusIcon(task.status)}
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="text-xs text-gray-500">
                  Erstellt: {new Date((chatActivity as any).tripPlan.createdAt).toLocaleString('de-DE')}
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-3">Starte eine vollautomatische Reiseplanung</p>
                <div className="space-y-2">
                  <Button
                    onClick={() => handlePlanTrip('Hamburg, Deutschland', ['culture', 'sightseeing', 'nightlife'])}
                    disabled={isPlanning}
                    className="w-full"
                  >
                    {isPlanning ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Plane Hamburg-Trip...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Hamburg Wochenendtrip planen
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handlePlanTrip('München, Deutschland', ['oktoberfest', 'culture', 'beer'])}
                    disabled={isPlanning}
                    variant="outline"
                    className="w-full"
                  >
                    {isPlanning ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Plane München-Trip...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        München Trip planen
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Always show manual planning option */}
            <div className="mt-4 pt-4 border-t">
              <h5 className="text-sm font-medium mb-2">Manuelle Planung</h5>
              <Button
                onClick={() => handlePlanTrip('Hamburg, Deutschland', ['culture', 'sightseeing', 'nightlife'])}
                disabled={isPlanning}
                variant="outline"
                className="w-full"
              >
                {isPlanning ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    KI-Agenten arbeiten...
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4 mr-2" />
                    Neue Reiseplanung starten
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

      {/* Active Trip Planning */}
      {isPlanning && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Loader className="w-5 h-5 animate-spin text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">KI-Agenten arbeiten...</p>
                <p className="text-sm text-blue-700">
                  Destination wird recherchiert und Reiseplan erstellt
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}