import { createContext, useContext, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import type { Favorite } from '@shared/schema';

interface FavoritesContextType {
  favorites: Favorite[] | undefined;
  isLoading: boolean;
  addToFavorites: (item: { placeId: string; itemType: string; itemName: string; itemData: any }) => Promise<void>;
  removeFromFavorites: (placeId: string) => Promise<void>;
  isFavorited: (placeId: string | undefined | null) => boolean;
  toggleFavorite: (item: { placeId: string; itemType: string; itemName: string; itemData: any }) => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user favorites - aggressive refresh for real-time sync
  const { data: favorites, isLoading } = useQuery({
    queryKey: ['/api/favorites'],
    enabled: isAuthenticated,
    staleTime: 0, // Always fresh for real-time sync
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Add to favorites mutation
  const addMutation = useMutation({
    mutationFn: async (data: { itemId: string; itemType: string; itemName: string; itemData: any }) => {
      const response = await apiRequest('POST', '/api/favorites', data);
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Immediately update local cache AND invalidate for real-time sync
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
      queryClient.refetchQueries({ queryKey: ['/api/favorites'] });
      toast({
        title: "Zu Favoriten hinzugefügt",
        description: `${variables.itemName} wurde zu deinen Favoriten hinzugefügt.`,
      });
    },
    onError: (error: any, variables) => {
      // Handle duplicate favorites gracefully
      if (error.message.includes('409')) {
        toast({
          title: "Bereits in Favoriten",
          description: `${variables.itemName} ist bereits in deinen Favoriten.`,
        });
        return;
      }
      
      toast({
        title: "Fehler",
        description: "Konnte nicht zu Favoriten hinzufügen.",
        variant: "destructive",
      });
    },
  });

  // Remove from favorites mutation
  const removeMutation = useMutation({
    mutationFn: async (placeId: string) => {
      const response = await apiRequest('DELETE', `/api/favorites/${placeId}`);
      return response.json();
    },
    onSuccess: (data, placeId) => {
      // Immediately update local cache AND invalidate for real-time sync
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
      queryClient.refetchQueries({ queryKey: ['/api/favorites'] });
      const removedItem = favorites?.find(fav => fav.placeId === placeId);
      toast({
        title: "Von Favoriten entfernt",
        description: `${removedItem?.itemName || 'Item'} wurde von deinen Favoriten entfernt.`,
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Konnte nicht von Favoriten entfernen.",
        variant: "destructive",
      });
    },
  });

  // Helper functions
  const isFavorited = (placeId: string | undefined | null): boolean => {
    if (!favorites || !placeId || typeof placeId !== 'string') return false;
    
    // Normalize the placeId for comparison
    const normalizeId = (id: string) => {
      if (!id || typeof id !== 'string') return id || '';
      if (id.startsWith('mapbox-marker-')) {
        return id.replace('mapbox-marker-', '');
      }
      return id;
    };
    
    const normalizedInputId = normalizeId(placeId);
    
    // Check if any existing favorite matches this normalized ID
    return favorites.some(fav => {
      const normalizedFavId = normalizeId(fav.placeId);
      
      // Direct match on normalized IDs
      if (normalizedFavId === normalizedInputId) return true;
      
      // Google Places ID match (ChIJ format)
      if (placeId && typeof placeId === 'string' && placeId.startsWith('ChIJ') && fav.placeId === placeId) return true;
      if (fav.placeId && typeof fav.placeId === 'string' && fav.placeId.startsWith('ChIJ') && placeId === fav.placeId) return true;
      
      // Check if the item data contains a matching Google Places ID
      const favDataPlaceId = fav.itemData?.id || fav.itemData?.placeId;
      if (favDataPlaceId && (favDataPlaceId === placeId || placeId === favDataPlaceId)) return true;
      
      return false;
    });
  };

  const addToFavorites = async (item: { placeId: string; itemType: string; itemName: string; itemData: any }) => {
    await addMutation.mutateAsync(item);
  };

  const removeFromFavorites = async (placeId: string) => {
    await removeMutation.mutateAsync(placeId);
  };

  // Centralized toggle function that normalizes data from different sources
  const toggleFavorite = async (item: { placeId: string; itemType: string; itemName: string; itemData: any }) => {
    // Always prefer Google Places ID if available in itemData
    const normalizedPlaceId = item.itemData?.id || item.itemData?.placeId || item.placeId;
    
    // Find existing favorite by comprehensive matching
    const existingFavorite = favorites?.find(fav => {
      // Direct ID match
      if (fav.placeId === normalizedPlaceId) return true;
      
      // Check stored Google Places ID in itemData
      const favDataPlaceId = fav.itemData?.id || fav.itemData?.placeId;
      if (favDataPlaceId && favDataPlaceId === normalizedPlaceId) return true;
      
      // Name-based fallback for items with different ID formats
      if (fav.itemName === item.itemName && fav.itemType === item.itemType) return true;
      
      return false;
    });
    
    console.log('toggleFavorite called:', { 
      originalPlaceId: item.placeId, 
      normalizedPlaceId, 
      existingFavorite: existingFavorite?.placeId,
      itemName: item.itemName 
    });
    
    if (existingFavorite) {
      await removeFromFavorites(existingFavorite.placeId);
    } else {
      // Use normalized data for storage
      const normalizedItem = {
        placeId: normalizedPlaceId,
        itemType: item.itemType,
        itemName: item.itemName,
        itemData: {
          ...item.itemData,
          id: normalizedPlaceId, // Ensure ID is consistent
          savedAt: new Date().toISOString(),
        }
      };
      await addToFavorites(normalizedItem);
    }
  };

  const contextValue: FavoritesContextType = {
    favorites,
    isLoading,
    addToFavorites,
    removeFromFavorites,
    isFavorited,
    toggleFavorite,
  };

  return (
    <FavoritesContext.Provider value={contextValue}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextType {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}