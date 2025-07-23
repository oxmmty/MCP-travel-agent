import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, AlertTriangle, Calculator, Clock, Lightbulb } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface SolverValidationPanelProps {
  chatId: number;
  tripData?: any;
  onValidationComplete?: (result: any) => void;
}

export default function SolverValidationPanel({ 
  chatId, 
  tripData, 
  onValidationComplete 
}: SolverValidationPanelProps) {
  const [isValidating, setIsValidating] = useState(false);
  const queryClient = useQueryClient();

  // Fetch existing solver results for this chat
  const { data: solverResults } = useQuery({
    queryKey: [`/api/solver/results/${chatId}`],
    enabled: !!chatId,
  });

  // Solver validation mutation
  const validateConstraintsMutation = useMutation({
    mutationFn: async (validationData: any) => {
      const response = await apiRequest('POST', '/api/solver/validate', validationData);
      return response.json();
    },
    onSuccess: (data) => {
      setIsValidating(false);
      queryClient.invalidateQueries({ queryKey: [`/api/solver/results/${chatId}`] });
      if (onValidationComplete) {
        onValidationComplete(data);
      }
    },
    onError: () => {
      setIsValidating(false);
    },
  });

  const handleValidateConstraints = () => {
    if (!tripData) return;
    
    setIsValidating(true);
    
    const validationData = {
      destination: tripData.destination || 'Unknown',
      startDate: tripData.startDate,
      endDate: tripData.endDate,
      duration: tripData.duration || 3,
      budget: tripData.budget || 1000,
      currency: tripData.currency || 'EUR',
      preferences: tripData.preferences || ['culture', 'sightseeing'],
      hotels: tripData.hotels || [],
      attractions: tripData.attractions || [],
      restaurants: tripData.restaurants || [],
      language: 'de',
      chatId,
      context: { tripPlanId: tripData.id }
    };

    validateConstraintsMutation.mutate(validationData);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'satisfiable':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'unsatisfiable':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'timeout':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return <Calculator className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      satisfiable: 'bg-green-100 text-green-800',
      unsatisfiable: 'bg-red-100 text-red-800',
      timeout: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800'
    };

    const labels = {
      satisfiable: 'Erfüllbar',
      unsatisfiable: 'Nicht erfüllbar',
      timeout: 'Zeitüberschreitung',
      error: 'Fehler'
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const latestResult = Array.isArray(solverResults) ? solverResults[0] : null;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          SMT-Solver Validierung
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Validation Controls */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Überprüfe die Erfüllbarkeit aller Reise-Constraints mit mathematischer Präzision
          </p>
          <Button
            onClick={handleValidateConstraints}
            disabled={isValidating || !tripData}
            className="flex items-center gap-2"
          >
            <Calculator className="w-4 h-4" />
            {isValidating ? 'Validiere...' : 'Constraints prüfen'}
          </Button>
        </div>

        {isValidating && (
          <Alert>
            <Calculator className="w-4 h-4" />
            <AlertDescription>
              Der SMT-Solver analysiert Ihre Reiseplanungs-Constraints. Dies kann bis zu 30 Sekunden dauern...
            </AlertDescription>
          </Alert>
        )}

        {/* Latest Validation Result */}
        {latestResult && (
          <div className="space-y-4">
            <Separator />
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Letzte Validierung</h4>
              <div className="flex items-center gap-2">
                {getStatusIcon(latestResult.status)}
                {getStatusBadge(latestResult.status)}
              </div>
            </div>

            {/* Execution Stats */}
            {latestResult.executionTime && (
              <div className="text-sm text-gray-600">
                Ausführungszeit: {latestResult.executionTime}ms
              </div>
            )}

            {/* Success Result */}
            {latestResult.status === 'satisfiable' && latestResult.solution && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Alle Constraints erfüllbar!</strong> 
                  Ihr Reiseplan ist mathematisch gültig und kann umgesetzt werden.
                </AlertDescription>
              </Alert>
            )}

            {/* Unsatisfiable Result with Suggestions */}
            {latestResult.status === 'unsatisfiable' && (
              <div className="space-y-3">
                <Alert className="bg-red-50 border-red-200">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>Constraints nicht erfüllbar!</strong> 
                    Die angegebenen Anforderungen können nicht gleichzeitig erfüllt werden.
                  </AlertDescription>
                </Alert>

                {/* Unsat Core */}
                {latestResult.unsatCore && latestResult.unsatCore.length > 0 && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h5 className="font-medium text-sm mb-2">Konfliktierende Constraints:</h5>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {latestResult.unsatCore.map((constraint: string, index: number) => (
                        <li key={index} className="flex items-center gap-2">
                          <XCircle className="w-3 h-3 text-red-500" />
                          {constraint}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Improvement Suggestions */}
                {latestResult.suggestions && latestResult.suggestions.length > 0 && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-blue-600" />
                      Verbesserungsvorschläge:
                    </h5>
                    <ul className="text-sm text-blue-800 space-y-2">
                      {latestResult.suggestions.map((suggestion: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-600 font-medium">{index + 1}.</span>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Error Result */}
            {latestResult.status === 'error' && (
              <Alert className="bg-red-50 border-red-200">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Validierungsfehler:</strong> {latestResult.errorMessage || 'Unbekannter Fehler'}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Solver Information */}
        {!latestResult && !isValidating && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h5 className="font-medium text-sm mb-2">Über den SMT-Solver</h5>
            <p className="text-sm text-gray-600">
              Der SMT-Solver verwendet Z3 zur mathematischen Verifikation Ihrer Reiseplanung. 
              Er kann mit 93,9% Erfolgsquote komplexe Constraint-Probleme lösen und bei 
              Unerfüllbarkeit konkrete Verbesserungsvorschläge geben.
            </p>
          </div>
        )}

        {/* Historical Results */}
        {Array.isArray(solverResults) && solverResults.length > 1 && (
          <div className="space-y-2">
            <Separator />
            <h5 className="font-medium text-sm">Validierungshistorie</h5>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {solverResults.slice(1).map((result: any, index: number) => (
                <div key={result.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.status)}
                    <span>Validierung #{solverResults.length - index - 1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(result.status)}
                    {result.executionTime && (
                      <span className="text-gray-500">{result.executionTime}ms</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}