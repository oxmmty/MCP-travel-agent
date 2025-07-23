import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Heart, Plus, Star, MapPin, X, Euro } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface MapItemOverlayProps {
  item: {
    id: string;
    name: string;
    type: 'hotel' | 'attraction' | 'restaurant' | 'activity' | 'destination' | 'natural_feature';
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
  position: { x: number; y: number };
  onClose: () => void;
  chatId?: number;
  destinationName?: string;
}

export default function MapItemOverlay({ item, position, onClose, chatId, destinationName }: MapItemOverlayProps) {
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
      onClose();
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
      case 'destination': return '📍';
      case 'natural_feature': return '🏞️';
      default: return '📍';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'hotel': return 'bg-blue-100 text-blue-800';
      case 'attraction': return 'bg-green-100 text-green-800';
      case 'restaurant': return 'bg-orange-100 text-orange-800';
      case 'activity': return 'bg-purple-100 text-purple-800';
      case 'destination': return 'bg-red-100 text-red-800';
      case 'natural_feature': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'hotel': return t('Hotel');
      case 'attraction': return t('Sehenswürdigkeit');
      case 'restaurant': return t('Restaurant');
      case 'activity': return t('Aktivität');
      case 'destination': return t('Reiseziel');
      case 'natural_feature': return t('Naturgebiet');
      default: return type;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'museum': return t('Museum');
      case 'art_gallery': return t('Kunstgalerie');
      case 'park': return t('Park');
      case 'church': return t('Kirche');
      case 'amusement_park': return t('Freizeitpark');
      case 'zoo': return t('Zoo');
      case 'aquarium': return t('Aquarium');
      case 'historical_landmark': return t('Historisches Wahrzeichen');
      case 'tourist_attraction': return t('Touristenattraktion');
      case 'attraction': return t('Sehenswürdigkeit');
      default: return category;
    }
  };

  const getPriceLevel = (level?: number) => {
    if (!level) return '';
    return '€'.repeat(level);
  };

  return (
    <div
      className="absolute z-50 pointer-events-none"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <Card className="w-80 shadow-2xl border-0 rounded-xl overflow-hidden pointer-events-auto bg-white/95 backdrop-blur-sm">
        <CardContent className="p-0">
          {/* Image Header with Overlay */}
          <div className="relative">
            {item.imageUrl ? (
              <div className="w-full h-40 relative overflow-hidden">
                <img 
                  src={item.imageUrl} 
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
            ) : (
              <div className={`w-full h-40 relative ${getTypeColor(item.type).replace('text-', 'bg-').split(' ')[0]}/10 flex items-center justify-center`}>
                <span className="text-6xl opacity-20">{getTypeIcon(item.type)}</span>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              </div>
            )}
            
            {/* Floating Header Content */}
            <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
              <Badge className={`${getTypeColor(item.type)} shadow-lg border-white/20`}>
                <span className="mr-1">{getTypeIcon(item.type)}</span>
                {getTypeLabel(item.type)}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Title and Rating Overlay */}
            <div className="absolute bottom-3 left-3 right-3">
              <h3 className="font-bold text-white text-lg leading-tight mb-1 drop-shadow-lg">
                {item.name}
              </h3>
              <div className="flex items-center gap-3">
                {item.rating && (
                  <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-2 py-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium text-white text-xs">{item.rating}</span>
                  </div>
                )}
                {item.priceLevel && (
                  <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-2 py-1">
                    <Euro className="w-3 h-3 text-yellow-400" />
                    <span className="text-yellow-400 font-medium text-xs">
                      {getPriceLevel(item.priceLevel)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-4 space-y-3">
            {/* Category */}
            {item.category && (
              <Badge variant="outline" className="text-xs">
                {getCategoryLabel(item.category)}
              </Badge>
            )}

            {/* Description */}
            {item.description && (
              <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                {item.description}
              </p>
            )}

            {/* Address */}
            {(item.address || item.vicinity) && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-500 line-clamp-2">
                  {item.address || item.vicinity}
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddToFavorites}
                disabled={isSavingToFavorites}
                className="flex-1 hover:bg-red-50 hover:border-red-200 transition-colors"
              >
                <Heart className={`w-4 h-4 mr-2 ${isSavingToFavorites ? 'text-red-500 fill-red-500' : ''}`} />
                {isSavingToFavorites ? 'Speichern...' : 'Favoriten'}
              </Button>
              
              <Button
                size="sm"
                onClick={handleAddToTrip}
                disabled={isAddingToTrip}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                {isAddingToTrip ? 'Hinzufügen...' : 'Zum Trip'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}