import React, { useRef, useEffect } from 'react';
import { MapPin, Building2 } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

interface InteractiveElementProps {
  children: React.ReactNode;
  name: string;
  type: 'hotel' | 'attraction' | 'restaurant';
  onHighlight?: (name: string, type: 'hotel' | 'attraction' | 'restaurant') => void;
  onUnhighlight?: () => void;
  onLocationClick?: (locationName: string, locationType: 'hotel' | 'attraction' | 'restaurant') => void;
  chatId?: number;
  data?: {
    id?: string;
    rating?: number;
    description?: string;
    category?: string;
    pricePerNight?: number;
    location?: string;
    imageUrl?: string;
    icon?: string; // Google Places icon URL
    iconBackgroundColor?: string; // Icon background color
    address?: string;
    vicinity?: string;
  };
}

export default function InteractiveElement({
  children,
  name,
  type,
  onHighlight,
  onUnhighlight,
  onLocationClick,
  chatId,
  data
}: InteractiveElementProps) {
  const elementRef = useRef<HTMLSpanElement>(null);
  const { toggleFavorite, isFavorited } = useFavorites();
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Setup global functions for this element to use the Mapbox popup system
  useEffect(() => {
    const itemId = data?.id || `${type}-${name.toLowerCase().replace(/\s+/g, '-')}`;
    
    // Store element data for global functions
    (window as any).interactiveElementData = (window as any).interactiveElementData || {};
    (window as any).interactiveElementData[itemId] = {
      name,
      type,
      data,
      chatId,
      toggleFavorite,
      isFavorited,
      toast,
      t,
      queryClient,
      apiRequest
    };

    return () => {
      // Cleanup when component unmounts
      if ((window as any).interactiveElementData) {
        delete (window as any).interactiveElementData[itemId];
      }
    };
  }, [name, type, data, chatId, toggleFavorite, isFavorited, toast, t, queryClient]);

  const handleMouseEnter = (e: React.MouseEvent) => {
    onHighlight?.(name, type);
    
    // Show popup on mouse enter (like Mapbox hover)
    showInteractivePopup(e, name, type, data, chatId);
  };

  const handleMouseLeave = () => {
    onUnhighlight?.();
    
    // Hide popup after a short delay to allow mouse movement to popup
    const popup = document.getElementById('interactive-popup');
    if (popup) {
      (popup as any).hideTimer = setTimeout(() => {
        popup.remove();
      }, 200);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onLocationClick?.(name, type);
  };

  // Function to show popup with the same styling as Mapbox popups
  const showInteractivePopup = async (e: React.MouseEvent, name: string, type: string, data: any, chatId?: number) => {
    // Remove any existing popup
    const existingPopup = document.getElementById('interactive-popup');
    if (existingPopup) {
      existingPopup.remove();
    }

    const itemId = data?.id || `${type}-${name.toLowerCase().replace(/\s+/g, '-')}`;
    const isCurrentlyFavorited = itemId ? isFavorited(itemId) : false;
    
    // Get translated strings
    const addToFavoritesText = t('addToFavorites');
    const addToTripText = t('addToTrip');

    // Try to fetch image if not available but we have an ID
    let imageUrl = data?.imageUrl;
    if (!imageUrl && itemId && type === 'attraction') {
      try {
        console.log(`🖼️ Fetching image for ${name} (${itemId})`);
        const response = await fetch(`/api/locations/${encodeURIComponent(name)}/details`);
        if (response.ok) {
          const locationData = await response.json();
          imageUrl = locationData.imageUrl;
          console.log(`🖼️ Image fetched for ${name}:`, imageUrl);
        }
      } catch (error) {
        console.warn(`⚠️ Could not fetch image for ${name}:`, error);
      }
    }

    // Calculate popup position
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    // Create popup element with the exact same styling as Mapbox
    const popup = document.createElement('div');
    popup.id = 'interactive-popup';
    popup.style.cssText = `
      position: fixed;
      z-index: 9999;
      left: ${rect.left + scrollLeft + rect.width / 2}px;
      top: ${rect.bottom + scrollTop + 10}px;
      transform: translate(-50%, 0);
      max-width: 280px;
      pointer-events: auto;
    `;

    // Handle popup hover to keep it visible
    popup.addEventListener('mouseenter', () => {
      clearTimeout((popup as any).hideTimer);
    });

    popup.addEventListener('mouseleave', () => {
      (popup as any).hideTimer = setTimeout(() => {
        popup.remove();
      }, 200);
    });

    // Generate the exact same popup content as Mapbox
    let popupContent = `<div style="position: relative; max-width: 300px; font-family: system-ui, -apple-system, sans-serif; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.2); background-color: white;">`;
    
    // Add image if available (full width)
    if (imageUrl) {
      popupContent += `
        <div style="position: relative; width: 100%; height: 180px;">
          <img 
            src="${imageUrl}" 
            alt="${name}" 
            style="width: 100%; height: 100%; object-fit: cover;" 
            onerror="this.parentElement.style.display='none'"
          />
          <!-- Action icons overlay -->
          <div style="position: absolute; top: 8px; right: 8px; display: flex; gap: 8px;">
            <button 
              id="interactive-heart-btn-${itemId}"
              onclick="interactiveAddToFavorites('${itemId}')"
              style="
                width: 36px; 
                height: 36px; 
                border-radius: 50%; 
                background-color: ${isCurrentlyFavorited ? 'rgba(239,68,68,0.9)' : 'rgba(255,255,255,0.9)'}; 
                border: none; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                cursor: pointer; 
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                transition: all 0.2s;
              "
              onmouseover="this.style.backgroundColor='rgba(239,68,68,0.1)'; this.style.transform='scale(1.1)';"
              onmouseout="this.style.backgroundColor='${isCurrentlyFavorited ? 'rgba(239,68,68,0.9)' : 'rgba(255,255,255,0.9)'}'; this.style.transform='scale(1)';"
              title="${addToFavoritesText}"
            >
              <span style="color: #ef4444; font-size: 18px;">♥</span>
            </button>
            <button 
              onclick="interactiveAddToTrip('${itemId}')"
              style="
                width: 36px; 
                height: 36px; 
                border-radius: 50%; 
                background-color: rgba(255,255,255,0.9); 
                border: none; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                cursor: pointer; 
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                transition: all 0.2s;
              "
              onmouseover="this.style.backgroundColor='rgba(59,130,246,0.1)'; this.style.transform='scale(1.1)';"
              onmouseout="this.style.backgroundColor='rgba(255,255,255,0.9)'; this.style.transform='scale(1)';"
              title="${addToTripText}"
            >
              <span style="color: #3b82f6; font-size: 20px; font-weight: bold;">+</span>
            </button>
          </div>
        </div>`;
    }
    
    // Content area
    popupContent += `<div style="padding: 16px; background-color: white;">`;
    
    // Title and rating
    popupContent += `
      <div style="display: flex; align-items: start; justify-content: space-between; margin-bottom: 8px;">
        <h3 style="font-weight: bold; font-size: 16px; color: #1f2937; margin: 0; line-height: 1.2; max-width: 200px;">${name}</h3>`;
    
    // Add rating if available
    if (data?.rating) {
      popupContent += `
        <div style="display: flex; align-items: center; margin-left: 8px; flex-shrink: 0;">
          <span style="color: #fbbf24;">★</span>
          <span style="font-size: 12px; margin-left: 2px;">${data.rating}</span>
        </div>`;
    }
    
    popupContent += `</div>`;
    
    // Add description
    if (data?.description) {
      const truncatedDescription = data.description.length > 80 ? data.description.substring(0, 80) + '...' : data.description;
      popupContent += `<p style="font-size: 12px; color: #6b7280; margin-bottom: 8px; line-height: 1.4;">${truncatedDescription}</p>`;
    }
    
    // Category - get translations  
    const hotelText = t('hotel');
    const restaurantText = t('restaurant');
    const attractionText = t('attraction');
    const nightText = t('night');
    const categoryText = data?.category || (type === 'hotel' ? hotelText : type === 'restaurant' ? restaurantText : attractionText);
    popupContent += `<div style="font-size: 12px; color: #3b82f6; font-weight: 600;">${categoryText}</div>`;
    
    // Price for hotels
    if (type === 'hotel' && data?.pricePerNight) {
      popupContent += `
        <div style="display: flex; align-items: center; gap: 4px; font-size: 12px; color: #6b7280; margin-top: 4px;">
          <span>€${data.pricePerNight}${nightText}</span>
        </div>`;
    }
    
    popupContent += `</div></div>`;
    
    popup.innerHTML = popupContent;
    document.body.appendChild(popup);

    // Close popup when clicking outside
    const closePopup = (event: Event) => {
      if (!popup.contains(event.target as Node)) {
        popup.remove();
        document.removeEventListener('click', closePopup);
      }
    };
    
    setTimeout(() => {
      document.addEventListener('click', closePopup);
    }, 100);
  };

  // Setup global functions for interactive element popups (similar to Mapbox)
  useEffect(() => {
    // Global function for adding to favorites from interactive popups
    (window as any).interactiveAddToFavorites = async (itemId: string) => {
      console.log('Interactive add to favorites clicked:', itemId);
      const elementData = (window as any).interactiveElementData?.[itemId];
      if (!elementData) return;

      const { name, type, data, toggleFavorite, isFavorited, toast, t } = elementData;

      try {
        await toggleFavorite({
          itemType: type,
          placeId: data?.placeId || itemId, // Use placeId from data or fallback to itemId
          itemName: name,
          itemData: {
            name: name,
            type: type,
            id: data?.placeId || itemId, // Ensure consistency
            placeId: data?.placeId || itemId, // Store placeId
            address: data?.address || data?.vicinity || data?.location || '',
            imageUrl: data?.imageUrl,
            rating: data?.rating,
            description: data?.description,
            category: data?.category,
            pricePerNight: data?.pricePerNight,
            savedAt: new Date().toISOString(),
          },
        });
        
        // Update heart button immediately without closing popup
        setTimeout(() => {
          const heartButton = document.getElementById(`interactive-heart-btn-${itemId}`);
          if (heartButton && itemId) {
            const updatedIsCurrentlyFavorited = isFavorited(itemId);
            heartButton.style.backgroundColor = updatedIsCurrentlyFavorited ? 'rgba(239,68,68,0.9)' : 'rgba(255,255,255,0.9)';
            heartButton.onmouseout = () => {
              heartButton.style.backgroundColor = updatedIsCurrentlyFavorited ? 'rgba(239,68,68,0.9)' : 'rgba(255,255,255,0.9)';
              heartButton.style.transform = 'scale(1)';
            };
          }
        }, 100);
        
        console.log('Interactive favorite toggled successfully');
      } catch (error) {
        console.error('Error toggling interactive favorite:', error);
      }
    };

    // Global function for adding to trip from interactive popups
    (window as any).interactiveAddToTrip = async (itemId: string) => {
      console.log('Interactive add to trip clicked:', itemId);
      const elementData = (window as any).interactiveElementData?.[itemId];
      if (!elementData) return;

      const { name, type, data, chatId, toast, t, queryClient, apiRequest } = elementData;

      try {
        // Ensure trip plan exists
        if (chatId) {
          try {
            const tripPlanResponse = await fetch(`/api/trip-plans/${chatId}`);
            if (!tripPlanResponse.ok) {
              await apiRequest('POST', '/api/trip-plans', {
                chatId,
                destination: data?.location || 'Unknown',
                budget: 'mid-range',
                currency: 'EUR',
                preferences: null,
                status: 'draft',
              });
            }
          } catch (error) {
            console.warn('Trip plan handling warning:', error);
          }
        }
        
        await apiRequest('POST', '/api/itinerary-items', {
          chatId: chatId || 1,
          itemType: type,
          itemId: itemId,
          itemName: name,
          itemData: {
            name: name,
            type: type,
            address: data?.address || data?.vicinity || data?.location || '',
            imageUrl: data?.imageUrl,
            rating: data?.rating,
            description: data?.description,
            category: data?.category,
            pricePerNight: data?.pricePerNight,
            addedAt: new Date().toISOString(),
          },
          day: 1,
          order: 0,
          notes: null,
        });
        
        console.log('Interactive added to trip successfully');
        toast({
          title: t('addedToTrip'),
          description: name,
        });
        
        // Invalidate itinerary cache
        queryClient.invalidateQueries({ queryKey: ['/api/chats', chatId, 'itinerary'] });
        queryClient.invalidateQueries({ queryKey: ['/api/itinerary-items'] });
      } catch (error) {
        console.error('Error adding interactive to trip:', error);
        toast({
          title: t('errorAddingToTrip'),
          variant: 'destructive',
        });
      }
    };

    // Cleanup
    return () => {
      delete (window as any).interactiveAddToFavorites;
      delete (window as any).interactiveAddToTrip;
    };
  }, []);

  const getIcon = () => {
    // Use Google Places icon if available
    if (data?.icon) {
      return (
        <span
          className="inline-block w-4 h-4 mr-1 flex-shrink-0"
          style={{
            backgroundColor: data.iconBackgroundColor || '#757575',
            borderRadius: '50%',
            padding: '2px'
          }}
        >
          <img 
            src={data.icon} 
            alt=""
            className="w-full h-full filter brightness-0 invert"
            style={{ pointerEvents: 'none' }}
            onError={(e) => {
              // Fallback to Lucide icons if Google Places icon fails
              const target = e.target as HTMLElement;
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = type === 'hotel' 
                  ? '<Building2 className="h-3 w-3" />'
                  : '<MapPin className="h-3 w-3" />';
              }
            }}
          />
        </span>
      );
    }
    
    // Fallback to Lucide icons
    switch (type) {
      case 'hotel':
        return <Building2 className="h-3 w-3 mr-1" />;
      case 'attraction':
        return <MapPin className="h-3 w-3 mr-1" />;
      default:
        return <MapPin className="h-3 w-3 mr-1" />;
    }
  };

  return (
    <span
      ref={elementRef}
      className={`cursor-pointer transition-colors relative inline-flex items-center font-bold text-black hover:text-gray-700`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {getIcon()}
      {children}
    </span>
  );
}