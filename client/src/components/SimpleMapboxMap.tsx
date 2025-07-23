import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface SimpleMapboxProps {
  center: { lat: number; lng: number };
  markers?: Array<{
    position: { lat: number; lng: number };
    title: string;
    type: string;
  }>;
  zoom?: number;
  height?: string;
  className?: string;
}

const SimpleMapboxMap: React.FC<SimpleMapboxProps> = ({
  center,
  markers = [],
  zoom = 12,
  height = "400px",
  className = ""
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!mapRef.current) return;

    const initMap = async () => {
      try {
        const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
        if (!token) {
          throw new Error('VITE_MAPBOX_ACCESS_TOKEN nicht konfiguriert');
        }

        if (!token.startsWith('pk.')) {
          throw new Error('Ungültiger Mapbox Token - muss mit "pk." beginnen');
        }

        mapboxgl.accessToken = token;

        const map = new mapboxgl.Map({
          container: mapRef.current!,
          style: 'mapbox://styles/marcusburk/cmcnbtrz0009101sh0uvue4t1', // Custom style mit Fehlerbehandlung
          center: [center.lng, center.lat],
          zoom: zoom,
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
        });

        mapInstanceRef.current = map;

        map.on('load', () => {
          console.log('Mapbox loaded successfully');
          setStatus('success');
          
          // Add markers
          markers.forEach(marker => {
            try {
              new mapboxgl.Marker()
                .setLngLat([marker.position.lng, marker.position.lat])
                .setPopup(new mapboxgl.Popup().setHTML(`<h3>${marker.title}</h3>`))
                .addTo(map);
            } catch (markerError) {
              console.warn('Failed to add marker:', markerError);
            }
          });
        });

        map.on('error', (e) => {
          console.error('Mapbox error:', e);
          setStatus('error');
          setError('Mapbox Ladefehler');
        });

        // Global error handler for unhandled rejections
        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
          if (event.reason && event.reason.toString().includes('mapbox')) {
            console.warn('Mapbox-related unhandled rejection caught:', event.reason);
            event.preventDefault();
          }
        };

        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        return () => {
          window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        };

      } catch (err) {
        console.error('Map init error:', err);
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
      }
    };

    initMap().catch(err => {
      console.error('Async map init error:', err);
      setStatus('error');
      setError('Fehler beim Initialisieren der Karte');
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [center.lat, center.lng, zoom, markers]);

  if (status === 'error') {
    return (
      <div 
        className={`flex items-center justify-center bg-red-50 border border-red-200 rounded ${className}`}
        style={{ height }}
      >
        <div className="text-center p-4">
          <div className="text-red-600 font-semibold">Mapbox Fehler</div>
          <div className="text-red-500 text-sm mt-1">{error}</div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
          >
            Neu laden
          </button>
        </div>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-50 border border-gray-200 rounded ${className}`}
        style={{ height }}
      >
        <div className="text-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <div className="text-gray-600">Mapbox wird geladen...</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={mapRef} 
      style={{ height }} 
      className={`w-full rounded overflow-hidden ${className}`}
    />
  );
};

export default SimpleMapboxMap;