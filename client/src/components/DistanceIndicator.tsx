import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Route, Loader } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface DistanceIndicatorProps {
  fromCoordinates?: { lat: number; lng: number };
  toCoordinates?: { lat: number; lng: number };
  fromName: string;
  toName: string;
  language?: string;
}

export default function DistanceIndicator({ 
  fromCoordinates, 
  toCoordinates, 
  fromName, 
  toName,
  language = 'de' 
}: DistanceIndicatorProps) {
  const [distance, setDistance] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fromCoordinates || !toCoordinates) {
      setDistance(null);
      return;
    }

    const calculateDistance = async () => {
      setIsCalculating(true);
      setError(null);
      
      try {
        const response = await apiRequest('POST', '/api/calculate-distance', {
          lat1: fromCoordinates.lat,
          lng1: fromCoordinates.lng,
          lat2: toCoordinates.lat,
          lng2: toCoordinates.lng,
          language
        });
        
        const data = await response.json();
        setDistance(data.formattedDistance);
      } catch (err) {
        console.error('Failed to calculate distance:', err);
        setError('Distanz konnte nicht berechnet werden');
      } finally {
        setIsCalculating(false);
      }
    };

    calculateDistance();
  }, [fromCoordinates, toCoordinates, language]);

  if (!fromCoordinates || !toCoordinates) {
    return null;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-2 text-gray-400">
        <Route className="w-3 h-3 mr-1" />
        <span className="text-xs">Keine Koordinaten</span>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center py-2">
      {/* Dashed connecting line */}
      <div className="flex items-center w-full">
        <div className="flex-1 border-t-2 border-dashed border-gray-300"></div>
        {isCalculating ? (
          <div className="flex items-center gap-1 text-gray-400 px-3">
            <Loader className="w-3 h-3 animate-spin" />
            <span className="text-xs">Berechne...</span>
          </div>
        ) : distance ? (
          <div className="flex items-center gap-1 bg-white px-3">
            <Route className="w-3 h-3 text-blue-500" />
            <span className="text-xs text-gray-600 font-medium">
              {distance}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-gray-400 px-3">
            <Route className="w-3 h-3" />
            <span className="text-xs">Keine Koordinaten</span>
          </div>
        )}
        <div className="flex-1 border-t-2 border-dashed border-gray-300"></div>
      </div>
    </div>
  );
}