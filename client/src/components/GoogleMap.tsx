import { useEffect, useRef } from "react";

interface GoogleMapProps {
  center: { lat: number; lng: number };
  markers?: Array<{
    position: { lat: number; lng: number };
    title: string;
    type: 'hotel' | 'attraction' | 'destination' | 'restaurant' | 'activity';
    imageUrl?: string;
    rating?: number;
    description?: string;
    placeId?: string;
    category?: string;
    vicinity?: string;
    address?: string;
    priceLevel?: number;
    openingHours?: string[];
    phone?: string;
    website?: string;
    icon?: string; // Google Places icon URL
    iconBackgroundColor?: string; // Icon background color
  }>;
  zoom?: number;
  height?: string;
  highlightedElement?: {
    name: string;
    type: 'hotel' | 'attraction';
  } | null;
  onMarkerClick?: (markerData: any) => void;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export default function GoogleMap({ center, markers = [], zoom = 13, height = "250px", highlightedElement, onMarkerClick }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        initializeMap();
        return;
      }

      // Check if script is already loaded or loading
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        if (window.google) {
          initializeMap();
        } else {
          existingScript.addEventListener('load', initializeMap, { once: true });
        }
        return;
      }

      // Load Google Maps script with a fallback API key approach
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCZbjzhMukxj7PhRRkh4EB9BrSM3MXDIfk&libraries=places&callback=initGoogleMap`;
      script.async = true;
      script.defer = true;
      
      // Set global callback
      (window as any).initGoogleMap = () => {
        initializeMap();
      };
      
      script.onerror = () => {
        console.log("Google Maps failed to load, using alternative method");
        // If Google Maps fails, create a clickable link to Google Maps
        if (mapRef.current) {
          mapRef.current.innerHTML = `
            <div class="flex items-center justify-center h-full bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 cursor-pointer" onclick="window.open('https://www.google.com/maps/@${center.lat},${center.lng},14z', '_blank')">
              <div class="text-center p-4">
                <div class="text-slate-600 mb-2">📍 Interactive Map</div>
                <div class="text-sm text-slate-500">Click to open in Google Maps</div>
                <div class="text-xs text-slate-400 mt-1">${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}</div>
              </div>
            </div>
          `;
        }
      };
      
      document.head.appendChild(script);
    };

    const initializeMap = () => {
      if (!mapRef.current || !window.google || !window.google.maps) return;

      try {
        const map = new window.google.maps.Map(mapRef.current, {
          center,
          zoom,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          styles: [
            {
              featureType: "poi.business",
              stylers: [{ visibility: "off" }]
            }
          ]
        });

        mapInstanceRef.current = map;

        // DISABLED: Don't clear existing markers - keep them persistent
        // markersRef.current.forEach(marker => marker.setMap(null));
        // markersRef.current = [];

        // Only add new markers that don't exist yet
        const existingMarkerTitles = markersRef.current.map(m => m.getTitle());
        const newMarkers = markers.filter(marker => !existingMarkerTitles.includes(marker.title));
        
        newMarkers.forEach(marker => {
          const isHighlighted = highlightedElement && 
            marker.title && marker.title.toLowerCase().includes(highlightedElement.name.toLowerCase()) &&
            marker.type === highlightedElement.type;

          // Use Google Places icon if available, otherwise fall back to custom SVG
          const markerIcon = marker.icon ? {
            url: marker.icon,
            scaledSize: new window.google.maps.Size(32, 32),
            anchor: new window.google.maps.Point(16, 32)
          } : {
            path: getMarkerPath(marker.type),
            fillColor: marker.iconBackgroundColor || (isHighlighted ? '#ff4444' : getMarkerColor(marker.type)),
            fillOpacity: 1,
            strokeColor: isHighlighted ? '#ff0000' : '#ffffff',
            strokeWeight: isHighlighted ? 3 : 2,
            scale: isHighlighted ? 1.5 : 1.2
          };

          const mapMarker = new window.google.maps.Marker({
            position: marker.position,
            map,
            title: marker.title,
            icon: markerIcon
          });

          // Add info window with image support and enhanced content
          const createInfoWindowContent = (marker: any) => {
            const imageHtml = marker.imageUrl ? 
              `<img src="${marker.imageUrl}" alt="${marker.title}" style="width: 100%; height: 80px; object-fit: cover; border-radius: 4px; margin-bottom: 8px;" onerror="this.style.display='none'">` : '';
            
            const ratingHtml = marker.rating ? 
              `<div style="display: flex; align-items: center; gap: 4px; margin: 4px 0;">
                <span style="color: #fbbf24;">★</span>
                <span style="font-size: 12px; color: #374151;">${marker.rating}/5</span>
              </div>` : '';
            
            const descriptionHtml = marker.description ? 
              `<p style="margin: 4px 0 0 0; font-size: 11px; color: #6b7280; line-height: 1.3;">${marker.description.substring(0, 100)}${marker.description.length > 100 ? '...' : ''}</p>` : '';
            
            const clickPrompt = `<div style="margin-top: 8px; padding: 4px 8px; background: #f3f4f6; border-radius: 4px; text-align: center;">
              <span style="font-size: 10px; color: #6b7280;">Klicken für Details & TripAdvisor-Bewertungen</span>
            </div>`;
            
            return `
              <div style="padding: 8px; max-width: 220px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                ${imageHtml}
                <h4 style="margin: 0 0 4px 0; font-weight: 600; color: #1f2937; font-size: 14px;">${marker.title}</h4>
                <p style="margin: 0; font-size: 12px; color: #6b7280; text-transform: capitalize;">${marker.type === 'attraction' ? 'Sehenswürdigkeit' : marker.type}</p>
                ${ratingHtml}
                ${descriptionHtml}
                ${clickPrompt}
              </div>
            `;
          };

          const infoWindow = new window.google.maps.InfoWindow({
            content: createInfoWindowContent(marker)
          });

          mapMarker.addListener('click', async (event: any) => {
            // Close all info windows first
            markersRef.current.forEach(m => m.infoWindow?.close());
            
            console.log('Google Maps marker clicked:', marker.title);

            // Enhanced marker data with TripAdvisor integration
            let enhancedMarkerData = {
              id: String(marker.title),
              name: marker.title,
              type: marker.type,
              imageUrl: marker.imageUrl,
              rating: marker.rating,
              description: marker.description,
              category: marker.type === 'attraction' ? 'Sehenswürdigkeit' : marker.type,
              placeId: marker.placeId,
              address: marker.address,
              vicinity: marker.vicinity,
              priceLevel: marker.priceLevel,
              position: {
                lat: marker.position.lat,
                lng: marker.position.lng
              }
            };

            // DISABLED: TripAdvisor API calls causing 1379ms delays
            // Use basic marker data for instant performance
            console.log('Using basic marker data for instant performance:', marker.title);

            // Only open the detail sidebar, no more sticky overlay
            if (onMarkerClick) {
              console.log('Opening detail sidebar for:', enhancedMarkerData.name);
              onMarkerClick(enhancedMarkerData);
            } else {
              console.error('onMarkerClick callback not provided! Cannot open detail sidebar');
            }
          });

          mapMarker.infoWindow = infoWindow;
          markersRef.current.push(mapMarker);
        });

        // DISABLED: Don't auto-fit bounds - keep map position stable
        // if (markers.length > 1) {
        //   const bounds = new window.google.maps.LatLngBounds();
        //   markers.forEach(marker => bounds.extend(marker.position));
        //   map.fitBounds(bounds);
        //   
        //   // Set minimum zoom level
        //   const listener = window.google.maps.event.addListener(map, "idle", function() {
        //     if (map.getZoom() > 16) map.setZoom(16);
        //     window.google.maps.event.removeListener(listener);
        //   });
        // }
      } catch (error) {
        console.error("Error initializing Google Maps:", error);
        // Fallback UI
        if (mapRef.current) {
          mapRef.current.innerHTML = `
            <div class="flex items-center justify-center h-full bg-slate-50 border border-slate-200">
              <div class="text-center p-8">
                <div class="text-2xl text-slate-400 mb-3">🗺️</div>
                <div class="text-slate-600 mb-2">Karte wird geladen...</div>
                <div class="text-xs text-slate-400">${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}</div>
              </div>
            </div>
          `;
        }
      }
    };

    loadGoogleMaps();

    return () => {
      // Cleanup
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    };
  }, [center, markers, zoom, highlightedElement]);

  const getMarkerColor = (type: string) => {
    switch (type) {
      case 'hotel': return '#3B82F6';
      case 'attraction': return '#8B5CF6';
      case 'destination': return '#EF4444';
      case 'restaurant': return '#F97316';
      case 'shopping': return '#EC4899';
      case 'park': return '#10B981';
      case 'cafe': return '#F59E0B';
      case 'transport': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getMarkerPath = (type: string) => {
    // Google Maps SVG marker path
    return 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z';
  };

  return (
    <div className="relative w-full" style={{ height }}>
      <div 
        ref={mapRef} 
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg overflow-hidden border border-slate-200 bg-slate-100"
      />
      

    </div>
  );
}