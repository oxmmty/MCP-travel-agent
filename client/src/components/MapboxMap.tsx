import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useFavorites } from '@/hooks/useFavorites';

// Mapbox types
export interface MapboxMarker {
  position: { lat: number; lng: number };
  title: string;
  type: 'destination' | 'hotel' | 'attraction' | 'restaurant' | 'recommendation';
  imageUrl?: string;
  rating?: number;
  description?: string;
  pricePerNight?: number;
  isRecommendation?: boolean;
  source?: string;
  mentionContext?: string;
  icon?: string; // Google Places icon URL
  iconBackgroundColor?: string; // Icon background color
  category?: string; // Specific attraction category (museum, park, church, etc.)
}

interface MapboxMapProps {
  center: { lat: number; lng: number };
  markers: MapboxMarker[];
  zoom?: number;
  height?: string;
  highlightedElement?: { type: string; name: string } | null;
  className?: string;
  chatId?: number;
  destinationName?: string;
  onMarkerClick?: (marker: MapboxMarker) => void;
}

const MapboxMap: React.FC<MapboxMapProps> = ({
  center,
  markers = [],
  zoom = 12,
  height = "400px",
  highlightedElement,
  className = "",
  chatId,
  destinationName,
  onMarkerClick
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const popupsRef = useRef<mapboxgl.Popup[]>([]);
  const activePopupRef = useRef<mapboxgl.Popup | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { toggleFavorite, isFavorited } = useFavorites();

  // Get marker color based on type
  const getMarkerColor = (type: string, isRecommendation?: boolean): string => {
    if (isRecommendation) {
      return '#a855f7'; // purple-500 for AI recommendations
    }
    
    switch (type) {
      case 'destination': return '#dc2626'; // red-600 for central city/destination pins
      case 'hotel': return '#2563eb'; // blue-600
      case 'attraction': return '#16a34a'; // green-600
      case 'restaurant': return '#ea580c'; // orange-600
      default: return '#6b7280'; // gray-500
    }
  };



  // Create custom marker element
  const createMarkerElement = (marker: MapboxMarker): HTMLElement => {
    const el = document.createElement('div');
    el.className = 'mapbox-marker';
    el.id = marker.id || `mapbox-${marker.title?.replace(/\s+/g, '-').toLowerCase()}`;
    
    // Special styling for AI recommendations and chat items
    const isChatItem = (marker as any).isChatItem;
    const borderColor = marker.isRecommendation ? '#a855f7' : isChatItem ? '#ff4444' : 'white';
    const boxShadow = marker.isRecommendation ? '0 0 10px rgba(168, 85, 247, 0.6)' : 
                     isChatItem ? '0 0 8px rgba(255, 68, 68, 0.6)' : 
                     '0 2px 6px rgba(0,0,0,0.3)';
    
    // Use Google Places icon background color or fall back to default
    const backgroundColor = marker.iconBackgroundColor || getMarkerColor(marker.type, marker.isRecommendation);
    
    // Let Mapbox handle all positioning - only style the appearance
    el.style.cssText = `
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background-color: ${backgroundColor};
      border: 3px solid ${borderColor};
      box-shadow: ${boxShadow};
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 16px;
      transition: box-shadow 0.2s ease, border-width 0.2s ease;
      overflow: hidden;
      pointer-events: auto;
    `;

    // Always prioritize Google Places icon if available, but handle central destination pins specially
    if (marker.icon) {
      // Create an image element for Google Places icon
      const iconImg = document.createElement('img');
      iconImg.src = marker.icon;
      iconImg.style.cssText = `
        width: 18px;
        height: 18px;
        filter: brightness(0) invert(1);
        pointer-events: none;
        object-fit: contain;
      `;
      
      // Add successful load handler
      iconImg.onload = () => {
        console.log(`✅ Google Places icon loaded: ${marker.icon}`);
      };
      
      iconImg.onerror = () => {
        console.warn(`❌ Google Places icon failed to load: ${marker.icon}, using emoji fallback`);
        // Fallback to emoji if icon fails to load
        el.innerHTML = getEmojiIcon(marker.type, marker.isRecommendation, marker.category);
      };
      
      el.appendChild(iconImg);
    } else {
      console.log(`⚪ No Google Places icon for ${marker.type}, using emoji: ${getEmojiIcon(marker.type, marker.isRecommendation, marker.category)}`);
      // Use emoji icons
      el.innerHTML = getEmojiIcon(marker.type, marker.isRecommendation, marker.category);
    }

    // Add chat indicator for chat items
    if (isChatItem) {
      const chatIndicator = document.createElement('div');
      chatIndicator.style.cssText = `
        position: absolute;
        top: -6px;
        right: -6px;
        width: 16px;
        height: 16px;
        background-color: #ff4444;
        border: 2px solid white;
        border-radius: 50%;
        font-size: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        z-index: 1;
        pointer-events: none;
      `;
      chatIndicator.innerHTML = '💬';
      el.appendChild(chatIndicator);
    }

    // Visual hover effects
    el.addEventListener('mouseenter', () => {
      el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
      el.style.borderWidth = '4px';
    });
    
    el.addEventListener('mouseleave', () => {
      el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
      el.style.borderWidth = '3px';
    });

    return el;
  };

  // Get emoji icon based on type and category
  const getEmojiIcon = (type: string, isRecommendation?: boolean, category?: string): string => {
    if (isRecommendation) {
      return '✨'; // Sparkles for AI recommendations
    }
    
    // For attractions, use specific emojis based on category
    if (type === 'attraction' && category) {
      switch (category) {
        case 'museum': return '🏛️';
        case 'art_gallery': return '🎨';
        case 'park': return '🌳';
        case 'church': return '⛪';
        case 'amusement_park': return '🎢';
        case 'zoo': return '🦁';
        case 'aquarium': return '🐠';
        case 'historical_landmark': return '🏰';
        case 'tourist_attraction': return '🎭';
        default: return '🏰'; // Default for attractions - use castle icon
      }
    }
    
    // For restaurants, use specific emojis based on category
    if (type === 'restaurant' && category) {
      switch (category) {
        case 'cafe': return '☕';
        case 'coffee_shop': return '☕';
        case 'bakery': return '🥖';
        case 'fast_food': return '🍔';
        case 'fine_dining': return '🍷';
        case 'bar': return '🍺';
        case 'ice_cream': return '🍦';
        default: return '🍽️'; // Default restaurant icon
      }
    }
    

    
    // Main type icons
    switch (type) {
      case 'destination': return '🏙️'; // City/destination pin like MindTrip's central pins  
      case 'hotel': return '🏨';
      case 'attraction': return '🎯';
      case 'restaurant': return '🍽️';
      default: return '📍'; // Default pin
    }
  };





  // Initialize Mapbox map
  useEffect(() => {
    if (!mapRef.current) return;

    const initializeMap = async () => {
      try {
        // Check if access token is available
        const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
        if (!accessToken) {
          console.warn('Mapbox Access Token not found, using basic map');
          setError('Mapbox Token fehlt - verwende Basiskarte');
          return;
        }

        // Validate token format
        if (!accessToken.startsWith('pk.')) {
          console.warn('Invalid Mapbox token format');
          setError('Ungültiger Mapbox Token');
          return;
        }

        mapboxgl.accessToken = accessToken;

        // Prevent promise rejection errors during map creation
        const mapOptions = {
          container: mapRef.current!,
          style: 'mapbox://styles/marcusburk/cmcnbtrz0009101sh0uvue4t1', // Custom style mit Fehlerbehandlung
          center: [center.lng, center.lat],
          zoom: zoom,
          attributionControl: true,
          logoPosition: 'bottom-right' as const,
          // Performance optimizations
          renderWorldCopies: false,
          maxZoom: 20,
          minZoom: 1,
          // Disable telemetry to prevent ad-blocker conflicts
          trackResize: false,
          collectResourceTiming: false,
          // Additional network error prevention
          transformRequest: (url: string, resourceType: string) => {
            // Block analytics/telemetry requests that cause ERR_BLOCKED_BY_CLIENT
            if (url.includes('events.mapbox.com') || 
                url.includes('api.mapbox.com/events') ||
                url.includes('/events/v2') ||
                url.includes('analytics') ||
                url.includes('telemetry') ||
                // Block problematic POI data sources from custom style
                url.includes('mapbox.mapbox-landmark-pois-v1') ||
                url.includes('landmark-pois') ||
                url.includes('place-labels')) {
              return null; // Return null to completely skip request
            }
            return { url };
          }
        };

        // Create map with comprehensive error handling
        const map = new mapboxgl.Map(mapOptions);

        mapInstanceRef.current = map;

        // Suppress all map-related promise rejections
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
          return originalFetch.apply(this, args).catch(error => {
            // Suppress mapbox-related fetch errors
            if (args[0] && typeof args[0] === 'string' && 
                (args[0].includes('mapbox.com') || args[0].includes('events'))) {
              return Promise.resolve(new Response('', { status: 200 }));
            }
            throw error;
          });
        };

        // Handle map load success
        map.on('load', () => {
          console.log('Mapbox map loaded successfully');
          setIsLoaded(true);
          setError(null);
          
          // Restore original fetch
          window.fetch = originalFetch;
          
          // Force resize after load to fix initial sizing issues
          setTimeout(() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.resize();
            }
          }, 100);
        });

        // Enhanced error handling with promise rejection prevention
        map.on('error', (e) => {
          console.warn('Mapbox map error (non-critical):', e.error?.message || 'Unknown error');
          // Don't set error for minor issues to prevent UI disruption
          if (e.error?.message?.includes('Source') || e.error?.message?.includes('featureNamespace')) {
            console.log('Ignoring non-critical Mapbox error');
            return;
          }
          setError(`Kartenfehler: ${e.error?.message || 'Unbekannter Fehler'}`);
        });

        // Handle style load errors gracefully
        map.on('style.error', (e) => {
          console.warn('Mapbox style error (non-critical):', e);
          // Only show error for critical style failures
          if (!e.error?.message?.includes('featureNamespace')) {
            setError('Fehler beim Laden des Kartenstils');
          }
        });

        // Handle source errors gracefully 
        map.on('source.error', (e) => {
          console.warn('Mapbox source error (non-critical):', e);
          // Only show error for critical source failures
          if (!e.error?.message?.includes('landmark-pois')) {
            setError('Fehler beim Laden der Kartendaten');
          }
        });

        // Add navigation controls
        map.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // Add scale control
        map.addControl(new mapboxgl.ScaleControl({
          maxWidth: 100,
          unit: 'metric'
        }), 'bottom-left');

        // Global handler for Mapbox-related unhandled promise rejections
        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
          const reason = event.reason?.toString() || '';
          if (reason.includes('mapbox') || 
              reason.includes('featureNamespace') || 
              reason.includes('landmark-pois') ||
              reason.includes('place-labels') ||
              reason.includes('Source')) {
            console.warn('Mapbox-related unhandled rejection suppressed:', reason);
            event.preventDefault();
            return;
          }
        };

        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        // Cleanup handler on unmount
        return () => {
          window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        };

      } catch (err) {
        console.error('Error initializing Mapbox:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler beim Initialisieren der Karte';
        setError(errorMessage);
      }
    };

    // Global error handler for unhandled rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason && event.reason.toString().includes('mapbox')) {
        console.warn('Mapbox-related unhandled rejection caught:', event.reason);
        event.preventDefault();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    // Call initializeMap with catch to handle any async errors
    initializeMap().catch(err => {
      console.error('Async map init error:', err);
      setError('Fehler beim Initialisieren der Karte');
    });

    // Global functions will be set up in a separate useEffect

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      // Cleanup
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markersRef.current = [];
      popupsRef.current = [];
    };
  }, [center.lat, center.lng, zoom]);

  // Add resize observer to handle container size changes
  useEffect(() => {
    if (!mapRef.current || !mapInstanceRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.resize();
      }
    });

    resizeObserver.observe(mapRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [isLoaded]);

  // Setup global functions for popup buttons
  useEffect(() => {
    // Store markers by itemId for access in global functions
    const markerMap = new Map();
    markers.forEach(marker => {
      const markerId = `marker-${(marker.title || 'unknown').replace(/\s+/g, '-').toLowerCase()}`;
      const itemId = marker.id || `mapbox-${markerId}`;
      markerMap.set(itemId, marker); // Use itemId as key for consistency
      markerMap.set(markerId, marker); // Keep legacy markerId for compatibility
    });

    (window as any).mapboxAddToFavorites = async (itemId: string) => {
      console.log('Add to favorites clicked:', itemId);
      const marker = markerMap.get(itemId);
      if (!marker) return;

      try {
        await toggleFavorite({
          itemType: marker.type,
          placeId: marker.placeId || marker.id || itemId, // Use Google PlaceID if available, otherwise fallback
          itemName: marker.title,
          itemData: {
            ...marker,
            id: marker.placeId || marker.id || itemId, // Ensure consistency
            placeId: marker.placeId || marker.id || itemId, // Store placeId
            name: marker.title, // Map title to name for SavedPage compatibility
            address: marker.description || marker.vicinity || '', // Map description/vicinity to address
            savedAt: new Date().toISOString(),
          },
        });
        console.log('Favorite toggled successfully');
        
        // Update heart button immediately without closing popup
        setTimeout(() => {
          const heartButton = document.getElementById(`heart-btn-${itemId}`);
          if (heartButton && itemId) {
            const updatedIsCurrentlyFavorited = isFavorited(itemId);
            heartButton.style.backgroundColor = updatedIsCurrentlyFavorited ? 'rgba(239,68,68,0.9)' : 'rgba(255,255,255,0.9)';
            heartButton.onmouseout = () => {
              heartButton.style.backgroundColor = updatedIsCurrentlyFavorited ? 'rgba(239,68,68,0.9)' : 'rgba(255,255,255,0.9)';
              heartButton.style.transform = 'scale(1)';
            };
          }
        }, 100);
      } catch (error) {
        console.error('Error toggling favorite:', error);
      }
    };

    (window as any).mapboxAddToTrip = async (itemId: string) => {
      console.log('Add to trip clicked:', itemId);
      const marker = markerMap.get(itemId);
      if (!marker) return;

      try {
        // Ensure trip plan exists
        if (chatId && destinationName) {
          try {
            const tripPlanResponse = await fetch(`/api/trip-plans/${chatId}`);
            if (!tripPlanResponse.ok) {
              await apiRequest('POST', '/api/trip-plans', {
                chatId,
                destination: destinationName,
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
          itemType: marker.type,
          itemId: marker.id || itemId, // Use Google Places ID if available, otherwise the passed itemId
          itemName: marker.title,
          itemData: {
            ...marker,
            name: marker.title, // Map title to name for consistency
            address: marker.description || marker.vicinity || '', // Map description/vicinity to address
            addedAt: new Date().toISOString(),
          },
          day: 1,
          order: 0,
          notes: null,
        });
        console.log('Added to trip successfully');
        toast({
          title: t('addedToTrip'),
          description: marker.title,
        });
        // Invalidate itinerary cache
        queryClient.invalidateQueries({ queryKey: ['/api/chats', chatId, 'itinerary'] });
        queryClient.invalidateQueries({ queryKey: ['/api/itinerary-items'] });
      } catch (error) {
        console.error('Error adding to trip:', error);
        toast({
          title: t('errorAddingToTrip'),
          variant: 'destructive',
        });
      }
    };

    // Cleanup
    return () => {
      delete (window as any).mapboxAddToFavorites;
      delete (window as any).mapboxAddToTrip;
    };
  }, [markers, chatId, destinationName, t, toast, queryClient]);

  // Update markers when they change
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;

    console.log(`🗺️ MAP UPDATE: Updating markers. New count: ${markers.length}`);
    
    // Clear all existing markers first for complete refresh
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    
    // Clear all existing popups
    popupsRef.current.forEach(popup => popup.remove());
    popupsRef.current = [];
    
    // Add all new markers
    markers.forEach(markerData => {
      const el = createMarkerElement(markerData);
      
      const marker = new mapboxgl.Marker(el, {
        anchor: 'center',
        offset: [0, 0]
      })
        .setLngLat([markerData.position.lng, markerData.position.lat])
        .addTo(mapInstanceRef.current!);

      // Create hover popup for all markers
      const hoverPopup = new mapboxgl.Popup({ 
        offset: 25,
        closeButton: false,
        closeOnClick: false,
        maxWidth: '280px',
        className: 'hover-popup'
      });

      // Generate popup content based on marker type
      const markerId = `marker-${(markerData.title || 'unknown').replace(/\s+/g, '-').toLowerCase()}`;
      // ALWAYS prefer marker.id (Google Places ID) for consistency with DetailSidebar
      const itemId = markerData.id || `mapbox-${markerId}`;
      const isCurrentlyFavorited = itemId ? isFavorited(itemId) : false;
      
      let popupContent = `<div style="position: relative; max-width: 300px; font-family: system-ui, -apple-system, sans-serif; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.2);">`;
      
      // Add image if available (full width)
      if (markerData.imageUrl) {
        popupContent += `
          <div style="position: relative; width: 100%; height: 180px;">
            <img 
              src="${markerData.imageUrl}" 
              alt="${markerData.title}" 
              style="width: 100%; height: 100%; object-fit: cover;" 
              onerror="this.parentElement.style.display='none'"
            />
            <!-- Action icons overlay -->
            <div style="position: absolute; top: 8px; right: 8px; display: flex; gap: 8px;">
              <button 
                id="heart-btn-${itemId}"
                onclick="mapboxAddToFavorites('${itemId}')"
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
                title="Zu Favoriten hinzufügen"
              >
                <span style="color: #ef4444; font-size: 18px;">♥</span>
              </button>
              <button 
                onclick="mapboxAddToTrip('${itemId}')"
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
                title="Zum Trip hinzufügen"
              >
                <span style="color: #3b82f6; font-size: 20px; font-weight: bold;">+</span>
              </button>
            </div>
          </div>`;
      } else {
        // If no image, show action buttons at top
        popupContent += `
          <div style="position: absolute; top: 8px; right: 8px; display: flex; gap: 8px; z-index: 10;">
            <button 
              onclick="mapboxAddToFavorites('${markerId}')"
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
              onmouseover="this.style.backgroundColor='rgba(239,68,68,0.1)'; this.style.transform='scale(1.1)';"
              onmouseout="this.style.backgroundColor='rgba(255,255,255,0.9)'; this.style.transform='scale(1)';"
              title="Zu Favoriten hinzufügen"
            >
              <span style="color: #ef4444; font-size: 18px;">♥</span>
            </button>
            <button 
              onclick="mapboxAddToTrip('${markerId}')"
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
              title="Zum Trip hinzufügen"
            >
              <span style="color: #3b82f6; font-size: 20px; font-weight: bold;">+</span>
            </button>
          </div>`;
      }
      
      // Content area
      popupContent += `<div style="padding: 16px; background-color: white;">`;
      
      // Header with recommendation badge
      if (markerData.isRecommendation) {
        popupContent += `
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <div style="width: 12px; height: 12px; background-color: #a855f7; border-radius: 50%;"></div>
            <span style="font-weight: 600; color: #7c3aed; font-size: 12px;">KI-Empfehlung</span>
          </div>`;
      }
      
      // Title and rating
      popupContent += `
        <div style="display: flex; align-items: start; justify-content: space-between; margin-bottom: 8px;">
          <h3 style="font-weight: bold; font-size: 16px; color: #1f2937; margin: 0; line-height: 1.2; max-width: 200px;">${markerData.title}</h3>`;
      
      // Add rating if available
      if (markerData.rating) {
        popupContent += `
          <div style="display: flex; align-items: center; margin-left: 8px; flex-shrink: 0;">
            <span style="color: #fbbf24;">★</span>
            <span style="font-size: 12px; margin-left: 2px;">${markerData.rating}</span>
          </div>`;
      }
      
      popupContent += `</div>`;
      
      // Add description
      if (markerData.description) {
        popupContent += `<p style="font-size: 12px; color: #6b7280; margin: 0 0 8px 0; line-height: 1.4;">${markerData.description}</p>`;
      }
      
      // Add price for hotels
      if (markerData.type === 'hotel' && markerData.pricePerNight) {
        popupContent += `
          <div style="margin-bottom: 8px; font-weight: 600; color: #059669; font-size: 14px;">
            €${markerData.pricePerNight}${t('night')}
          </div>`;
      }
      
      // Add mention context for AI recommendations
      if (markerData.mentionContext) {
        popupContent += `<div style="margin-top: 8px; padding: 8px; background-color: #f3f4f6; border-radius: 6px; font-size: 11px; color: #374151;">"${markerData.mentionContext}"</div>`;
      }
      
      popupContent += `</div></div>`;
      
      hoverPopup.setHTML(popupContent);

      let hoverTimeout: NodeJS.Timeout | null = null;
      let isPopupHovered = false;
      
      // Create popup management system
      const showPopup = () => {
        // Close any active popup first
        if (activePopupRef.current && activePopupRef.current !== hoverPopup) {
          activePopupRef.current.remove();
        }
        
        hoverPopup.setLngLat([markerData.position.lng, markerData.position.lat])
          .addTo(mapInstanceRef.current!);
        activePopupRef.current = hoverPopup;
      };
      
      const hidePopup = () => {
        // Only hide on desktop when not hovered
        if (!isTouchDevice && !isPopupHovered) {
          hoverPopup.remove();
          if (activePopupRef.current === hoverPopup) {
            activePopupRef.current = null;
          }
        }
      };
      
      // Detect if device supports touch (mobile)
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      if (isTouchDevice) {
        // On mobile: show popup on tap and keep it open until another marker is tapped
        el.addEventListener('touchstart', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          // Always show this popup and close others
          showPopup();
        });
      } else {
        // Desktop: use hover events with delay
        el.addEventListener('mouseenter', () => {
          if (hoverTimeout) clearTimeout(hoverTimeout);
          showPopup();
        });
        
        el.addEventListener('mouseleave', () => {
          hoverTimeout = setTimeout(hidePopup, 300);
        });
      }
      
      // Keep popup open when interacting with it
      hoverPopup.on('open', () => {
        const popupElement = hoverPopup.getElement();
        if (popupElement) {
          if (!isTouchDevice) {
            // Desktop: hover logic
            popupElement.addEventListener('mouseenter', () => {
              isPopupHovered = true;
              if (hoverTimeout) clearTimeout(hoverTimeout);
            });
            
            popupElement.addEventListener('mouseleave', () => {
              isPopupHovered = false;
              hoverTimeout = setTimeout(hidePopup, 200);
            });
          } else {
            // Mobile: prevent accidental closes
            popupElement.addEventListener('touchstart', (e) => {
              e.stopPropagation(); // Prevent closing when touching popup
            });
          }
        }
      });

      // Add both click and touch events for detail sidebar
      const handleMarkerActivation = (e: Event) => {
        console.log('🔥 PIN ACTIVATED!', markerData.title, markerData.type);
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        // Remove any active popup immediately
        if (activePopupRef.current) {
          activePopupRef.current.remove();
          activePopupRef.current = null;
        }
        hoverPopup.remove();
        
        console.log('🔥 About to call onMarkerClick with:', markerData);
        console.log('🔥 onMarkerClick function exists:', !!onMarkerClick);
        console.log('🔥 onMarkerClick type:', typeof onMarkerClick);
        
        // Call onMarkerClick directly
        if (onMarkerClick && typeof onMarkerClick === 'function') {
          console.log('🔥 Calling onMarkerClick function with:', markerData);
          onMarkerClick(markerData);
          console.log('🔥 onMarkerClick called successfully');
        } else {
          console.log('🔥 onMarkerClick not available, using window.handleLocationClick directly');
          // Try direct global access
          if (window.handleLocationClick) {
            window.handleLocationClick(markerData.title, markerData.type);
          } else {
            console.log('🔥 Dispatching custom event as fallback');
            const event = new CustomEvent('markerClick', { detail: markerData });
            window.dispatchEvent(event);
          }
        }
      };
      
      // Add event listeners for both click and touch
      el.addEventListener('click', handleMarkerActivation);
      el.addEventListener('touchend', handleMarkerActivation);

      markersRef.current.push(marker);
      popupsRef.current.push(hoverPopup);
    });

    console.log('Markers updated. Total markers:', markers.length, 'onMarkerClick:', !!onMarkerClick);

    // Don't automatically zoom when adding markers to prevent marker movement
    // Keep the current view stable for better user experience
  }, [markers, isLoaded, onMarkerClick, t]);

  // Handle highlighted element - highlight marker when hovering chat links
  useEffect(() => {
    if (!highlightedElement || !isLoaded || !highlightedElement.name) {
      // Remove highlighting from all markers - restore original colors
      markersRef.current.forEach((marker) => {
        const element = marker.getElement();
        if (element) {
          // Find the original marker data to restore correct color
          const originalMarker = markers.find(m => {
            const markerId = `mapbox-${m.title?.replace(/\s+/g, '-').toLowerCase()}`;
            return element.id === markerId;
          });
          
          if (originalMarker) {
            const originalColor = originalMarker.iconBackgroundColor || getMarkerColor(originalMarker.type, originalMarker.isRecommendation);
            element.style.backgroundColor = originalColor;
          }
          element.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
          element.style.borderColor = 'white';
        }
      });
      return;
    }

    const highlightedMarker = markers.find(
      marker => marker.title && marker.title.toLowerCase().includes(highlightedElement.name.toLowerCase())
    );
    
    if (highlightedMarker) {
      // Find the corresponding DOM element and highlight it
      const markerElement = markersRef.current.find(marker => {
        const element = marker.getElement();
        return element && element.id === `mapbox-${highlightedMarker.title?.replace(/\s+/g, '-').toLowerCase()}`;
      });
      
      if (markerElement) {
        const element = markerElement.getElement();
        if (element) {
          // Apply highlight styling - only change background color and glow
          element.style.backgroundColor = '#ffd700'; // Golden background
          element.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 215, 0, 0.6)';
          element.style.borderColor = '#ffd700';
        }
      }
    }
  }, [highlightedElement, markers, isLoaded]);

  // Show error state if there's an error
  if (error) {
    return (
      <div 
        style={{ height, width: '100%' }} 
        className={`flex items-center justify-center bg-red-50 border border-red-200 rounded-lg ${className}`}
      >
        <div className="text-center p-8 max-w-md">
          <div className="text-4xl text-red-400 mb-4">⚠️</div>
          <div className="text-red-800 font-semibold mb-2">Mapbox Fehler</div>
          <div className="text-red-600 text-sm mb-4">{error}</div>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm"
          >
            Seite neu laden
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={mapRef} 
      style={{ 
        height, 
        width: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }} 
      className={`mapbox-container ${className || ''}`}
    />
  );
};

export default MapboxMap;