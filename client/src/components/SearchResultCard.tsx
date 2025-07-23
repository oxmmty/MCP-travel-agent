import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Heart, Plus, Star, MapPin, Euro } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface SearchResultCardProps {
  item: {
    id: string;
    name: string;
    type: 'hotel' | 'attraction' | 'restaurant' | 'activity';
    imageUrl?: string;
    rating?: number;
    description?: string;
    address?: string;
    vicinity?: string;
    priceLevel?: number;
    location?: { lat: number; lng: number };
    placeId?: string;
    category?: string;
    phone?: string;
    website?: string;
  };
  onItemClick?: (item: any) => void;
  chatId?: number;
  destinationName?: string;
}

export default function SearchResultCard({ 
  item, 
  onItemClick, 
  chatId, 
  destinationName 
}: SearchResultCardProps) {
  const [isSavingToFavorites, setIsSavingToFavorites] = useState(false);
  const [isAddingToTrip, setIsAddingToTrip] = useState(false);
  const queryClient = useQueryClient();

  // Add to favorites mutation
  const addToFavoritesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/favorites', {
        userId: 1,
        itemType: item.type,
        itemId: item.placeId || item.id,
        itemName: item.name,
        itemData: {
          ...item,
          savedAt: new Date().toISOString(),
        },
      });
      return response.json();
    },
    onSuccess: () => {
      setIsSavingToFavorites(false);
      toast({
        title: "Zu Favoriten hinzugefügt",
        description: `${item.name} wurde zu deinen Favoriten hinzugefügt.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
    },
    onError: () => {
      setIsSavingToFavorites(false);
      toast({
        title: "Fehler",
        description: "Konnte nicht zu Favoriten hinzufügen.",
        variant: "destructive",
      });
    },
  });

  // Add to trip mutation
  const addToTripMutation = useMutation({
    mutationFn: async () => {
      // First, ensure we have a trip plan for this chat
      if (chatId && destinationName) {
        // Try to get existing trip plan, create if doesn't exist
        let tripPlan;
        try {
          const tripPlanResponse = await fetch(`/api/trip-plans/${chatId}`);
          if (tripPlanResponse.ok) {
            tripPlan = await tripPlanResponse.json();
          }
        } catch (error) {
          // Trip plan doesn't exist, will create below
        }

        if (!tripPlan) {
          // Create new trip plan
          const createTripResponse = await apiRequest('POST', '/api/trip-plans', {
            chatId,
            userId: 1,
            destination: destinationName,
            budget: 'mid-range',
            currency: 'EUR',
            preferences: null,
            status: 'draft',
          });
          tripPlan = await createTripResponse.json();
        }
      }

      // Add item to itinerary
      const response = await apiRequest('POST', '/api/itinerary-items', {
        chatId: chatId || 1,
        itemType: item.type,
        itemId: item.placeId || item.id || `${item.type}-${(item.name || 'unknown').replace(/\s+/g, '-').toLowerCase()}`,
        itemName: item.name,
        itemData: {
          ...item,
          addedAt: new Date().toISOString(),
        },
        day: 1, // Default to day 1
        order: 0, // Will be updated based on existing items
        notes: null,
      });
      return response.json();
    },
    onSuccess: () => {
      setIsAddingToTrip(false);
      toast({
        title: "Zum Trip hinzugefügt",
        description: `${item.name} wurde zu deinem Reiseplan hinzugefügt.`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/itinerary-items/${chatId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/trip-plans/${chatId}`] });
    },
    onError: () => {
      setIsAddingToTrip(false);
      toast({
        title: "Fehler",
        description: "Konnte nicht zum Trip hinzufügen.",
        variant: "destructive",
      });
    },
  });

  const handleAddToFavorites = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSavingToFavorites(true);
    addToFavoritesMutation.mutate();
  };

  const handleAddToTrip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAddingToTrip(true);
    addToTripMutation.mutate();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'hotel': return '🏨';
      case 'attraction': return '🎯';
      case 'restaurant': return '🍽️';
      case 'activity': return '🎪';
      default: return '📍';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'hotel': return 'bg-blue-100 text-blue-800';
      case 'attraction': return 'bg-green-100 text-green-800';
      case 'restaurant': return 'bg-orange-100 text-orange-800';
      case 'activity': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'hotel': return 'Hotel';
      case 'attraction': return 'Sehenswürdigkeit';
      case 'restaurant': return 'Restaurant';
      case 'activity': return 'Aktivität';
      default: return type;
    }
  };

  const getPriceLevel = (level?: number) => {
    if (!level) return '';
    return '€'.repeat(level);
  };

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onItemClick?.(item)}
    >
      <CardContent className="p-0">
        <div className="flex">
          {/* Image */}
          {item.imageUrl && (
            <div className="w-24 h-24 flex-shrink-0">
              <img 
                src={item.imageUrl} 
                alt={item.name}
                className="w-full h-full object-cover rounded-l-lg"
              />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 p-3 min-w-0">
            <div className="flex items-start justify-between mb-1">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">{getTypeIcon(item.type)}</span>
                  <h3 className="font-medium text-sm truncate">{item.name}</h3>
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className={`text-xs ${getTypeColor(item.type)}`}>
                    {getTypeLabel(item.type)}
                  </Badge>
                  {item.category && (
                    <Badge variant="outline" className="text-xs">
                      {item.category}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-1 ml-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAddToFavorites}
                  disabled={isSavingToFavorites}
                  className="h-6 w-6 p-0 hover:bg-red-50"
                  title="Zu Favoriten hinzufügen"
                >
                  <Heart className={`w-3 h-3 ${isSavingToFavorites ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`} />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAddToTrip}
                  disabled={isAddingToTrip}
                  className="h-6 w-6 p-0 hover:bg-blue-50"
                  title="Zum Trip hinzufügen"
                >
                  <Plus className={`w-3 h-3 ${isAddingToTrip ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'}`} />
                </Button>
              </div>
            </div>

            {/* Rating and Price */}
            {(item.rating || item.priceLevel) && (
              <div className="flex items-center gap-3 mb-2 text-xs">
                {item.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{item.rating}</span>
                  </div>
                )}
                {item.priceLevel && (
                  <div className="flex items-center gap-1">
                    <Euro className="w-3 h-3 text-green-600" />
                    <span className="text-green-600 font-medium">
                      {getPriceLevel(item.priceLevel)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            {item.description && (
              <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                {item.description}
              </p>
            )}

            {/* Address */}
            {(item.address || item.vicinity) && (
              <div className="flex items-start gap-1">
                <MapPin className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-gray-500 line-clamp-1">
                  {item.address || item.vicinity}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}