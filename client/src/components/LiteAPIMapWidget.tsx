import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, MapPin, Star, Euro } from "lucide-react";

interface LiteAPIMapWidgetProps {
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
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  images: string[];
  pricePerNight?: number;
  currency?: string;
  commission?: number;
  amenities: string[];
}

declare global {
  interface Window {
    google: any;
    initLiteAPIMap: () => void;
  }
}

export default function LiteAPIMapWidget({ 
  center, 
  zoom = 13, 
  height = "400px", 
  searchParams, 
  onHotelSelect, 
  destinationName 
}: LiteAPIMapWidgetProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<LiteAPIHotel | null>(null);

  // Fetch LiteAPI hotels for the location
  const { data: hotelsData, isLoading, error } = useQuery({
    queryKey: ['liteapi-hotels-map', center, searchParams],
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

  // Initialize Google Maps with LiteAPI hotels
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        initializeMap();
        return;
      }

      // Check if script is already loaded
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        if (window.google) {
          initializeMap();
        } else {
          existingScript.addEventListener('load', initializeMap, { once: true });
        }
        return;
      }

      // Load Google Maps script
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCZbjzhMukxj7PhRRkh4EB9BrSM3MXDIfk&libraries=places&callback=initLiteAPIMap`;
      script.async = true;
      script.defer = true;
      
      (window as any).initLiteAPIMap = () => {
        initializeMap();
      };
      
      script.onerror = () => {
        console.log("Google Maps failed to load");
      };
      
      document.head.appendChild(script);
    };

    const initializeMap = () => {
      if (!mapRef.current || !window.google || !window.google.maps) return;

      try {
        // Initialize map with clean styling
        const map = new window.google.maps.Map(mapRef.current, {
          center: center,
          zoom: zoom,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            }
          ],
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true
        });

        mapInstanceRef.current = map;

        // Clear existing markers
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];

        // Add LiteAPI hotel markers
        if (hotelsData?.hotels) {
          console.log(`Adding ${hotelsData.hotels.length} hotel markers to map`);
          
          hotelsData.hotels.forEach((hotel: LiteAPIHotel, index: number) => {
            // Validate coordinates - LiteAPI uses coordinates object
            const lat = hotel.coordinates?.lat;
            const lng = hotel.coordinates?.lng;
            
            if (!lat || !lng) {
              console.warn(`Hotel ${hotel.name} has invalid coordinates:`, { lat, lng });
              return;
            }
            
            const position = { lat: lat, lng: lng };
            console.log(`Creating marker ${index + 1}: ${hotel.name} at ${lat}, ${lng} - €${hotel.pricePerNight}`);
            
            // Create distinct colored markers for better visibility
            const colors = ['#2563eb', '#dc2626', '#059669', '#7c2d12', '#581c87', '#be185d', '#ea580c', '#0891b2', '#4338ca', '#be123c'];
            const markerColor = colors[index % colors.length];
            
            // Create standard Google Maps marker with custom icon
            const marker = new window.google.maps.Marker({
              position: position,
              map: map,
              title: `${hotel.name} - €${hotel.pricePerNight}`,
              icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg width="90" height="45" xmlns="http://www.w3.org/2000/svg">
                    <rect x="5" y="5" width="80" height="30" rx="15" fill="${markerColor}" stroke="#ffffff" stroke-width="2"/>
                    <text x="45" y="24" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">
                      €${hotel.pricePerNight || '?'}
                    </text>
                    <polygon points="40,35 50,35 45,45" fill="${markerColor}"/>
                  </svg>
                `),
                size: new window.google.maps.Size(90, 45),
                anchor: new window.google.maps.Point(45, 45),
                scaledSize: new window.google.maps.Size(90, 45)
              },
              zIndex: 1000 + index
            });

            // LiteAPI hotel info window
            const infoWindow = new window.google.maps.InfoWindow({
              content: `
                <div class="p-4 max-w-sm">
                  <div class="flex items-start justify-between mb-3">
                    <h3 class="font-bold text-lg text-gray-900">${hotel.name}</h3>
                    <div class="flex items-center ml-2">
                      <span class="text-yellow-500">★</span>
                      <span class="text-sm ml-1">${hotel.rating || 'N/A'}</span>
                    </div>
                  </div>
                  <p class="text-sm text-gray-600 mb-3">${hotel.address}</p>
                  ${hotel.pricePerNight ? `
                    <div class="flex items-center justify-between mb-3 p-2 bg-blue-50 rounded">
                      <span class="text-xl font-bold text-blue-600">€${hotel.pricePerNight}</span>
                      <span class="text-sm text-gray-500">pro Nacht</span>
                    </div>
                  ` : ''}
                  ${hotel.commission ? `
                    <div class="text-sm text-green-600 mb-3 font-medium">
                      Provision: €${hotel.commission.toFixed(2)}
                    </div>
                  ` : ''}
                  <div class="flex flex-wrap gap-1 mb-3">
                    ${hotel.amenities.slice(0, 4).map(amenity => `
                      <span class="bg-gray-100 text-xs px-2 py-1 rounded">${amenity}</span>
                    `).join('')}
                  </div>
                  <button class="w-full bg-blue-600 text-white text-sm py-2 px-3 rounded-lg hover:bg-blue-700 font-medium" 
                          onclick="window.selectLiteAPIHotel('${hotel.id}')">
                    Preise & Verfügbarkeit prüfen
                  </button>
                  <div class="text-xs text-gray-400 mt-2 text-center">
                    Powered by LiteAPI
                  </div>
                </div>
              `
            });

            marker.addListener('click', () => {
              // Close other info windows
              markersRef.current.forEach(m => m.infoWindow?.close());
              infoWindow.open(map, marker);
              setSelectedHotel(hotel);
            });

            marker.infoWindow = infoWindow;
            markersRef.current.push(marker);
          });

          console.log(`Successfully added ${markersRef.current.length} markers to map`);
          
          // Fit bounds to show all hotels
          if (hotelsData.hotels.length > 1) {
            const bounds = new window.google.maps.LatLngBounds();
            hotelsData.hotels.forEach((hotel: LiteAPIHotel) => {
              const lat = hotel.coordinates?.lat;
              const lng = hotel.coordinates?.lng;
              if (lat && lng) {
                bounds.extend({ lat, lng });
              }
            });
            
            // Add some padding and fit bounds
            map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
            
            // Set minimum zoom level after a delay
            setTimeout(() => {
              if (map.getZoom() > 14) {
                map.setZoom(14);
              }
            }, 1000);
          } else {
            // If only one hotel or no valid coordinates, center on Munich
            map.setCenter(center);
            map.setZoom(12);
          }
        }

        // Global hotel selection handler
        (window as any).selectLiteAPIHotel = (hotelId: string) => {
          const hotel = hotelsData?.hotels?.find((h: LiteAPIHotel) => h.id === hotelId);
          if (hotel && onHotelSelect) {
            onHotelSelect(hotel);
          }
          setSelectedHotel(hotel);
        };

      } catch (error) {
        console.error("Error initializing LiteAPI Map:", error);
      }
    };

    loadGoogleMaps();

    return () => {
      // Cleanup
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    };
  }, [center, hotelsData, zoom]);

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
          <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
          <span className="text-sm font-medium">
            {hotelsData?.hotels?.length || 0} LiteAPI Hotels
          </span>
          {searchParams && (
            <Badge variant="secondary" className="text-xs">
              {searchParams.checkin} - {searchParams.checkout}
            </Badge>
          )}
        </div>
      </div>

      {/* Google Maps Container with LiteAPI Hotels */}
      <div 
        ref={mapRef} 
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg overflow-hidden border border-slate-200 bg-slate-100"
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
          <p className="text-xs text-gray-600 mb-2">{selectedHotel.address}</p>
          {selectedHotel.pricePerNight && (
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-bold text-blue-600">€{selectedHotel.pricePerNight}</span>
              <span className="text-xs text-gray-500">pro Nacht</span>
            </div>
          )}
          <Button 
            size="sm" 
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={() => onHotelSelect && onHotelSelect(selectedHotel)}
          >
            Buchen
          </Button>
        </div>
      )}

      {/* LiteAPI Attribution */}
      <div className="absolute bottom-4 left-4 z-10 bg-white rounded px-2 py-1 text-xs text-gray-500 border">
        Powered by LiteAPI
      </div>
    </div>
  );
}