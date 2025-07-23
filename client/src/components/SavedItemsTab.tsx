import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Heart, MapPin, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SavedItem {
  id: number;
  userId: number;
  placeId: string;
  itemType: 'hotel' | 'attraction' | 'restaurant';
  itemName: string;
  itemData: {
    name: string;
    imageUrl?: string;
    rating?: number;
    description?: string;
    address?: string;
    category?: string;
  };
  createdAt: string;
}

interface SavedItemsTabProps {
  chatId?: number;
  onItemClick?: (item: any) => void;
}

export default function SavedItemsTab({ chatId, onItemClick }: SavedItemsTabProps) {
  const [favorites, setFavorites] = useState<SavedItem[]>([]);

  const { data: favoritesData, isLoading } = useQuery({
    queryKey: ['/api/favorites'],
    enabled: true
  });

  useEffect(() => {
    if (favoritesData && Array.isArray(favoritesData)) {
      setFavorites(favoritesData);
    }
  }, [favoritesData]);

  const handleRemoveFavorite = async (placeId: string) => {
    try {
      const response = await fetch(`/api/favorites/${placeId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setFavorites(prev => prev.filter(item => item.placeId !== placeId));
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const handleItemClick = (item: SavedItem) => {
    onItemClick?.({
      placeId: item.placeId,
      name: item.itemData.name,
      type: item.itemType,
      imageUrl: item.itemData.imageUrl,
      rating: item.itemData.rating,
      description: item.itemData.description,
      address: item.itemData.address,
      category: item.itemData.category
    });
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <Heart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">Keine gespeicherten Orte</p>
          <p className="text-sm">Speichern Sie Orte, die Sie interessieren</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Gespeicherte Orte</h2>
        
        <div className="grid grid-cols-1 gap-4">
          {favorites.map((item) => (
            <Card 
              key={item.id} 
              className="group hover:shadow-lg transition-all cursor-pointer"
              onClick={() => handleItemClick(item)}
            >
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Image */}
                  <div className="w-20 h-20 flex-shrink-0">
                    {item.itemData.imageUrl ? (
                      <img
                        src={item.itemData.imageUrl}
                        alt={item.itemData.name}
                        className="w-full h-full object-cover rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                        <MapPin className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm line-clamp-1">{item.itemData.name}</h3>
                        
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {item.itemType === 'hotel' ? 'Hotel' : 
                             item.itemType === 'restaurant' ? 'Restaurant' : 
                             'Attraktion'}
                          </Badge>
                          {item.itemData.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs text-gray-600">{item.itemData.rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>

                        {item.itemData.address && (
                          <p className="text-xs text-gray-600 line-clamp-1 mt-1">{item.itemData.address}</p>
                        )}
                      </div>

                      {/* Remove Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-red-500 w-8 h-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFavorite(item.placeId);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}