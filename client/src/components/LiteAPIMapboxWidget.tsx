import React, { useRef, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Helper function to make API requests
const apiRequest = async (method: string, url: string, body?: any) => {
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }
  
  return response;
};

// Mapbox access token - using public demo token
const MAPBOX_TOKEN = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';

interface LiteAPIMapboxWidgetProps {
  center: { lat: number; lng: number };
  zoom?: number;
  height?: string;
  searchParams?: {
    checkin: string;
    checkout: string;
    adults: number;
    radius?: number;
  };
  onHotelSelect?: (hotel: any) => void;
  destinationName?: string;
}

interface LiteAPIHotel {
  id: string;
  name: string;
  address?: string;
  description?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  rating: number;
  images?: string[];
  pricePerNight?: number;
  currency?: string;
  amenities: string[];
  commission?: number;
}

export function LiteAPIMapboxWidget({
  center,
  zoom = 12,
  height = '600px',
  searchParams,
  onHotelSelect,
  destinationName
}: LiteAPIMapboxWidgetProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<LiteAPIHotel | null>(null);

  // Fetch LiteAPI hotels for the location
  const { data: hotelsData, isLoading, error } = useQuery({
    queryKey: ['liteapi-hotels-mapbox', center, searchParams],
    queryFn: async () => {
      const response = await fetch('/api/liteapi/hotels/munich');
      if (!response.ok) {
        throw new Error('Failed to fetch LiteAPI hotels');
      }
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds due to rate limiting
    retry: 3
  });

  // Initialize Mapbox map with LiteAPI hotels
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initializeMap = async () => {
      try {
        // Set Mapbox access token
        mapboxgl.accessToken = MAPBOX_TOKEN;

        // Initialize map
        const map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/marcusburk/cmcnbtrz0009101sh0uvue4t1', // Ihr benutzerdefinierter Stil
          center: [center.lng, center.lat],
          zoom: zoom,
          attributionControl: true
        });

        mapRef.current = map;

        // Add navigation controls
        map.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // Wait for map to load
        map.on('load', () => {
          console.log('Mapbox map loaded successfully');
          addHotelMarkers();
        });

        // Enhanced error handling
        map.on('error', (e) => {
          console.error('LiteAPI Mapbox error:', e);
        });

        map.on('style.error', (e) => {
          console.error('LiteAPI Mapbox style error:', e);
        });

      } catch (error) {
        console.error('Failed to initialize LiteAPI Mapbox map:', error);
      }
    };

    initializeMap().catch(error => {
      console.error('Async initialization error:', error);
    });

    const addHotelMarkers = () => {
      // Clear existing markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      // Add LiteAPI hotel markers
      if (hotelsData?.hotels) {
        console.log(`Adding ${hotelsData.hotels.length} hotel markers to Mapbox map`);
        
        hotelsData.hotels.forEach((hotel: LiteAPIHotel, index: number) => {
          const lat = hotel.coordinates?.lat;
          const lng = hotel.coordinates?.lng;
          
          if (!lat || !lng) {
            console.warn(`Hotel ${hotel.name} has invalid coordinates:`, { lat, lng });
            return;
          }
          
          console.log(`Creating Mapbox marker ${index + 1}: ${hotel.name} at ${lat}, ${lng} - €${hotel.pricePerNight}`);
          
          // Create distinct colored markers for better visibility
          const colors = ['#2563eb', '#dc2626', '#059669', '#7c2d12', '#581c87', '#be185d', '#ea580c', '#0891b2', '#4338ca', '#be123c'];
          const markerColor = colors[index % colors.length];
          
          // Create custom marker element
          const markerElement = document.createElement('div');
          markerElement.className = 'custom-mapbox-marker';
          markerElement.innerHTML = `
            <div style="
              background: ${markerColor}; 
              color: white; 
              padding: 6px 12px; 
              border-radius: 12px; 
              font-size: 12px; 
              font-weight: bold; 
              border: 2px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              cursor: pointer;
            ">
              €${hotel.pricePerNight || '?'}
              <div style="
                position: absolute;
                top: 100%;
                left: 50%;
                transform: translateX(-50%);
                width: 0;
                height: 0;
                border-left: 6px solid transparent;
                border-right: 6px solid transparent;
                border-top: 6px solid ${markerColor};
              "></div>
            </div>
          `;

          // Create Mapbox marker
          const marker = new mapboxgl.Marker(markerElement)
            .setLngLat([lng, lat])
            .addTo(map);

          // Create popup for hotel information
          const popup = new mapboxgl.Popup({
            offset: 25,
            closeButton: true,
            closeOnClick: false
          }).setHTML(`
            <div style="padding: 16px; max-width: 280px; font-family: system-ui, -apple-system, sans-serif;">
              <div style="display: flex; align-items: start; justify-content: space-between; margin-bottom: 12px;">
                <h3 style="font-weight: bold; font-size: 16px; color: #1f2937; margin: 0; line-height: 1.2;">${hotel.name}</h3>
                <div style="display: flex; align-items: center; margin-left: 8px;">
                  <span style="color: #fbbf24;">★</span>
                  <span style="font-size: 12px; margin-left: 4px;">${hotel.rating || 'N/A'}</span>
                </div>
              </div>
              <p style="font-size: 12px; color: #6b7280; margin: 0 0 12px 0;">${hotel.description || hotel.address || 'München'}</p>
              ${hotel.pricePerNight ? `
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; padding: 8px; background: #eff6ff; border-radius: 6px;">
                  <span style="font-size: 18px; font-weight: bold; color: #2563eb;">€${hotel.pricePerNight}</span>
                  <span style="font-size: 12px; color: #6b7280;">pro Nacht</span>
                </div>
              ` : ''}
              ${hotel.commission ? `
                <div style="font-size: 12px; color: #059669; margin-bottom: 12px; font-weight: 500;">
                  Provision: €${hotel.commission.toFixed(2)}
                </div>
              ` : ''}
              <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 12px;">
                ${hotel.amenities.slice(0, 4).map(amenity => `
                  <span style="background: #f3f4f6; font-size: 10px; padding: 2px 6px; border-radius: 4px;">${amenity}</span>
                `).join('')}
              </div>
              <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                <button id="fav-hotel-${hotel.id}" style="
                  flex: 1;
                  background: white;
                  border: 1px solid #d1d5db;
                  color: #374151;
                  padding: 6px 10px;
                  border-radius: 6px;
                  font-size: 11px;
                  font-weight: 500;
                  cursor: pointer;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 4px;
                " onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='white'">
                  ❤️ Favoriten
                </button>
                
                <button id="trip-hotel-${hotel.id}" style="
                  flex: 1;
                  background: #059669;
                  border: 1px solid #059669;
                  color: white;
                  padding: 6px 10px;
                  border-radius: 6px;
                  font-size: 11px;
                  font-weight: 500;
                  cursor: pointer;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 4px;
                " onmouseover="this.style.background='#047857'" onmouseout="this.style.background='#059669'">
                  + Zum Trip
                </button>
              </div>
              
              <button id="select-hotel-${hotel.id}" style="
                width: 100%; 
                background: #2563eb; 
                color: white; 
                font-size: 12px; 
                padding: 8px 12px; 
                border-radius: 6px; 
                border: none; 
                cursor: pointer; 
                font-weight: 500;
              " onmouseover="this.style.background='#1d4ed8'" onmouseout="this.style.background='#2563eb'">
                Preise & Verfügbarkeit prüfen
              </button>
              <div style="font-size: 10px; color: #9ca3af; margin-top: 8px; text-align: center;">
                Powered by LiteAPI
              </div>
            </div>
          `);

          // Add click event to marker
          markerElement.addEventListener('click', () => {
            // Close other popups
            markersRef.current.forEach(m => {
              if (m.getPopup()?.isOpen()) {
                m.getPopup()?.remove();
              }
            });
            
            marker.setPopup(popup);
            popup.addTo(map);
            setSelectedHotel(hotel);
            
            // Setup button event listeners after popup is shown
            setTimeout(() => {
              setupHotelButtonListeners(hotel);
            }, 100);
          });

          markersRef.current.push(marker);
        });

        console.log(`Successfully added ${markersRef.current.length} markers to Mapbox map`);
        
        // Fit bounds to show all hotels
        if (hotelsData.hotels.length > 1) {
          const bounds = new mapboxgl.LngLatBounds();
          hotelsData.hotels.forEach((hotel: LiteAPIHotel) => {
            const lat = hotel.coordinates?.lat;
            const lng = hotel.coordinates?.lng;
            if (lat && lng) {
              bounds.extend([lng, lat]);
            }
          });
          
          map.fitBounds(bounds, { 
            padding: 50,
            maxZoom: 14
          });
        }
      }
    };

    // Add markers when data is available
    if (hotelsData?.hotels) {
      addHotelMarkers();
    }

    // Global hotel selection handler
    (window as any).selectLiteAPIHotel = (hotelId: string) => {
      const hotel = hotelsData?.hotels?.find((h: LiteAPIHotel) => h.id === hotelId);
      if (hotel && onHotelSelect) {
        onHotelSelect(hotel);
      }
      setSelectedHotel(hotel);
    };

    // Setup button event listeners for hotel popup actions
    const setupHotelButtonListeners = (hotel: LiteAPIHotel) => {
      // Add to favorites button
      const favBtn = document.getElementById(`fav-hotel-${hotel.id}`);
      if (favBtn) {
        favBtn.addEventListener('click', async () => {
          try {
            favBtn.innerHTML = '⏳ Speichern...';
            favBtn.style.pointerEvents = 'none';
            
            await apiRequest('POST', '/api/favorites', {
              userId: 1,
              itemType: 'hotel',
              itemId: `liteapi-${hotel.id}`,
              itemName: hotel.name,
              itemData: {
                ...hotel,
                savedAt: new Date().toISOString(),
              },
            });
            
            favBtn.innerHTML = '✅ Gespeichert!';
            favBtn.style.background = '#10b981';
            favBtn.style.color = 'white';
            favBtn.style.borderColor = '#10b981';
            
            setTimeout(() => {
              favBtn.innerHTML = '❤️ Favoriten';
              favBtn.style.background = 'white';
              favBtn.style.color = '#374151';
              favBtn.style.borderColor = '#d1d5db';
              favBtn.style.pointerEvents = 'auto';
            }, 2000);
            
          } catch (error) {
            console.error('Error adding hotel to favorites:', error);
            favBtn.innerHTML = '❌ Fehler';
            favBtn.style.background = '#ef4444';
            favBtn.style.color = 'white';
            favBtn.style.borderColor = '#ef4444';
            
            setTimeout(() => {
              favBtn.innerHTML = '❤️ Favoriten';
              favBtn.style.background = 'white';
              favBtn.style.color = '#374151';
              favBtn.style.borderColor = '#d1d5db';
              favBtn.style.pointerEvents = 'auto';
            }, 2000);
          }
        });
      }
      
      // Add to trip button
      const tripBtn = document.getElementById(`trip-hotel-${hotel.id}`);
      if (tripBtn) {
        tripBtn.addEventListener('click', async () => {
          try {
            tripBtn.innerHTML = '⏳ Hinzufügen...';
            tripBtn.style.pointerEvents = 'none';
            
            // Add to itinerary
            await apiRequest('POST', '/api/itinerary-items', {
              chatId: 1, // Default chat ID for now
              itemType: 'hotel',
              itemId: `liteapi-${hotel.id}`,
              itemName: hotel.name,
              itemData: {
                ...hotel,
                addedAt: new Date().toISOString(),
              },
              day: 1,
              order: 0,
              notes: null,
            });
            
            tripBtn.innerHTML = '✅ Hinzugefügt!';
            tripBtn.style.background = '#10b981';
            tripBtn.style.borderColor = '#10b981';
            
            setTimeout(() => {
              tripBtn.innerHTML = '+ Zum Trip';
              tripBtn.style.background = '#059669';
              tripBtn.style.borderColor = '#059669';
              tripBtn.style.pointerEvents = 'auto';
            }, 2000);
            
          } catch (error) {
            console.error('Error adding hotel to trip:', error);
            tripBtn.innerHTML = '❌ Fehler';
            tripBtn.style.background = '#ef4444';
            tripBtn.style.borderColor = '#ef4444';
            
            setTimeout(() => {
              tripBtn.innerHTML = '+ Zum Trip';
              tripBtn.style.background = '#059669';
              tripBtn.style.borderColor = '#059669';
              tripBtn.style.pointerEvents = 'auto';
            }, 2000);
          }
        });
      }
    };

    return () => {
      // Cleanup
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, [center, hotelsData, zoom]);

  // Handle hotel selection button clicks
  useEffect(() => {
    if (hotelsData?.hotels) {
      hotelsData.hotels.forEach((hotel: LiteAPIHotel) => {
        const button = document.getElementById(`select-hotel-${hotel.id}`);
        if (button) {
          button.onclick = () => {
            if (onHotelSelect) {
              onHotelSelect(hotel);
            }
            setSelectedHotel(hotel);
          };
        }
      });
    }
  }, [hotelsData, onHotelSelect]);

  if (isLoading) {
    return (
      <div className="relative w-full" style={{ height }}>
        <div className="flex items-center justify-center h-full bg-slate-100 rounded-lg border border-slate-200">
          <div className="text-center p-8">
            <Loader2 className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
            <div className="text-slate-600 mb-2">LiteAPI Hotels werden geladen...</div>
            <div className="text-xs text-slate-400">{center.lat.toFixed(4)}, {center.lng.toFixed(4)}</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative w-full" style={{ height }}>
        <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-red-50 to-slate-100 rounded-lg border border-slate-200 p-8">
          <div className="text-center">
            <MapPin className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">LiteAPI Verbindungsfehler</h3>
            <p className="text-sm text-slate-600 mb-4">
              Hotels können momentan nicht geladen werden (Rate Limiting)
            </p>
            <div className="space-y-2 mb-6">
              <Badge variant="outline" className="text-xs">
                📍 {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
              </Badge>
              {searchParams && (
                <Badge variant="secondary" className="text-xs">
                  {searchParams.checkin} - {searchParams.checkout}
                </Badge>
              )}
            </div>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Neu laden
            </Button>
          </div>
        </div>
        
        {/* LiteAPI Attribution */}
        <div className="absolute bottom-4 left-4 bg-white rounded px-2 py-1 text-xs text-gray-500 border">
          Powered by LiteAPI
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ height }}>
      {/* LiteAPI Hotels Header */}
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-3 border">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-600 rounded-full"></div>
          <span className="text-sm font-medium">
            {hotelsData?.hotels?.length || 0} LiteAPI Hotels (Mapbox)
          </span>
          {searchParams && (
            <Badge variant="secondary" className="text-xs">
              {searchParams.checkin} - {searchParams.checkout}
            </Badge>
          )}
        </div>
      </div>

      {/* Mapbox Container with LiteAPI Hotels */}
      <div 
        ref={mapContainerRef} 
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg overflow-hidden border border-slate-200"
      />

      {/* Selected Hotel Info */}
      {selectedHotel && (
        <div className="absolute bottom-4 right-4 z-10 bg-white rounded-lg shadow-lg p-4 border max-w-sm">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-sm">{selectedHotel.name}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedHotel(null)}
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>
          <p className="text-xs text-gray-600 mb-2">{selectedHotel.description || selectedHotel.address}</p>
          {selectedHotel.pricePerNight && (
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-bold text-green-600">€{selectedHotel.pricePerNight}</span>
              <span className="text-xs text-gray-500">pro Nacht</span>
            </div>
          )}
          <Button 
            size="sm" 
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={() => onHotelSelect && onHotelSelect(selectedHotel)}
          >
            Buchen
          </Button>
        </div>
      )}

      {/* LiteAPI Attribution */}
      <div className="absolute bottom-4 left-4 z-10 bg-white rounded px-2 py-1 text-xs text-gray-500 border">
        Powered by LiteAPI + Mapbox
      </div>
    </div>
  );
}

export default LiteAPIMapboxWidget;