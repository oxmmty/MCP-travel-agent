import { useState } from 'react';
import GoogleMap from './GoogleMap';
import MapboxMap from './MapboxMap';
import { useMapProvider, MapProvider } from '../hooks/useMapProvider';
import { Button } from './ui/button';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { Badge } from './ui/badge';

// Unified marker interface that works with both providers
export interface UnifiedMarker {
  position: { lat: number; lng: number };
  title: string;
  type: 'destination' | 'hotel' | 'attraction' | 'restaurant';
  imageUrl?: string;
  rating?: number;
  description?: string;
  pricePerNight?: number;
}

interface UnifiedMapProps {
  center: { lat: number; lng: number };
  markers: UnifiedMarker[];
  zoom?: number;
  height?: string;
  highlightedElement?: { type: string; name: string } | null;
  className?: string;
  showProviderSwitch?: boolean;
  defaultProvider?: MapProvider;
  onMarkerClick?: (markerData: any) => void;
  chatId?: number;
  destinationName?: string;
}

const UnifiedMap: React.FC<UnifiedMapProps> = ({
  center,
  markers = [],
  zoom = 12,
  height = "400px",
  highlightedElement,
  className = "",
  showProviderSwitch = true,
  defaultProvider = 'google',
  onMarkerClick,
  chatId,
  destinationName
}) => {
  const { 
    provider, 
    switchProvider, 
    availableProviders, 
    isProviderAvailable 
  } = useMapProvider(defaultProvider);

  const [showProviderInfo, setShowProviderInfo] = useState(false);

  const getProviderDisplayName = (providerType: MapProvider): string => {
    switch (providerType) {
      case 'google': return 'Google Maps';
      case 'mapbox': return 'Mapbox';
      default: return providerType;
    }
  };

  const getProviderStatus = (providerType: MapProvider): string => {
    if (isProviderAvailable(providerType)) {
      return 'Verfügbar';
    }
    return 'API-Schlüssel erforderlich';
  };

  const renderMap = () => {
    try {
      switch (provider) {
        case 'mapbox':
          if (!isProviderAvailable('mapbox')) {
            return (
              <div className="flex items-center justify-center h-full bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="text-center p-8">
                  <div className="text-2xl text-yellow-600 mb-3">⚠️</div>
                  <div className="text-yellow-800 font-semibold mb-2">Mapbox nicht verfügbar</div>
                  <div className="text-yellow-700 text-sm mb-3">VITE_MAPBOX_ACCESS_TOKEN fehlt</div>
                  <div className="text-xs text-yellow-600">Fallback zu Google Maps...</div>
                </div>
              </div>
            );
          }
          return (
            <MapboxMap
              center={center}
              markers={markers}
              zoom={zoom}
              height={height}
              highlightedElement={highlightedElement}
              className={className}
              onMarkerClick={onMarkerClick}
              chatId={chatId}
              destinationName={destinationName}
            />
          );
        case 'google':
        default:
          if (!isProviderAvailable('google')) {
            return (
              <div className="flex items-center justify-center h-full bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="text-center p-8">
                  <div className="text-2xl text-yellow-600 mb-3">⚠️</div>
                  <div className="text-yellow-800 font-semibold mb-2">Google Maps nicht verfügbar</div>
                  <div className="text-yellow-700 text-sm mb-3">VITE_GOOGLE_MAPS_API_KEY fehlt</div>
                  <div className="text-xs text-yellow-600">Bitte API-Schlüssel konfigurieren</div>
                </div>
              </div>
            );
          }
          return (
            <GoogleMap
              center={center}
              markers={markers}
              zoom={zoom}
              height={height}
              highlightedElement={highlightedElement}
              className={className}
              onMarkerClick={onMarkerClick}
            />
          );
      }
    } catch (error) {
      console.error('Error rendering map:', error);
      return (
        <div className="flex items-center justify-center h-full bg-red-50 border border-red-200 rounded-lg">
          <div className="text-center p-8">
            <div className="text-2xl text-red-600 mb-3">❌</div>
            <div className="text-red-800 font-semibold mb-2">Kartenfehler</div>
            <div className="text-red-700 text-sm">Unerwarteter Fehler beim Laden der Karte</div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="relative">
      {/* Provider Switch Controls */}
      {showProviderSwitch && availableProviders.length > 1 && (
        <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3 border">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Karten-Anbieter:</span>
            <ToggleGroup
              type="single"
              value={provider}
              onValueChange={(value) => value && switchProvider(value as MapProvider)}
              className="h-8"
            >
              {availableProviders.map((providerType) => (
                <ToggleGroupItem
                  key={providerType}
                  value={providerType}
                  aria-label={`Switch to ${getProviderDisplayName(providerType)}`}
                  className="text-xs px-3 py-1 h-8"
                >
                  {getProviderDisplayName(providerType)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowProviderInfo(!showProviderInfo)}
              className="h-8 w-8 p-0"
              title="Provider-Informationen anzeigen"
            >
              ℹ️
            </Button>
          </div>

          {/* Provider Information Panel */}
          {showProviderInfo && (
            <div className="mt-3 pt-3 border-t space-y-2">
              <div className="text-xs text-gray-600 font-medium">Verfügbare Anbieter:</div>
              {(['google', 'mapbox'] as MapProvider[]).map((providerType) => (
                <div key={providerType} className="flex items-center justify-between">
                  <span className="text-xs text-gray-700">
                    {getProviderDisplayName(providerType)}
                  </span>
                  <Badge 
                    variant={isProviderAvailable(providerType) ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {getProviderStatus(providerType)}
                  </Badge>
                </div>
              ))}
              <div className="text-xs text-gray-500 mt-2">
                Aktuell aktiv: <strong>{getProviderDisplayName(provider)}</strong>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Current Provider Badge */}
      {showProviderSwitch && (
        <div className="absolute top-4 right-4 z-10">
          <Badge 
            variant="outline" 
            className="bg-white/90 backdrop-blur-sm text-xs"
          >
            {getProviderDisplayName(provider)}
          </Badge>
        </div>
      )}

      {/* Map Component */}
      {renderMap()}

      {/* No Providers Available */}
      {availableProviders.length === 0 && (
        <div className="absolute inset-0 z-20 bg-white/95 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center p-8 max-w-md">
            <div className="text-4xl mb-4">🗺️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Kein Kartenanbieter verfügbar
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Bitte konfigurieren Sie einen API-Schlüssel für Google Maps oder Mapbox, 
              um die interaktive Karte zu nutzen.
            </p>
            <div className="space-y-2 text-xs text-gray-500">
              <div>• Google Maps: VITE_GOOGLE_MAPS_API_KEY</div>
              <div>• Mapbox: VITE_MAPBOX_ACCESS_TOKEN</div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => window.open('https://www.openstreetmap.org', '_blank')}
            >
              OpenStreetMap öffnen
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedMap;