import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import UnifiedMap from '../components/UnifiedMap';

const SimpleMapTest = () => {
  const [currentProvider, setCurrentProvider] = useState<'google' | 'mapbox'>('google');
  
  // Munich coordinates and sample markers
  const testCenter = { lat: 48.1351, lng: 11.5820 };
  const testMarkers = [
    {
      position: { lat: 48.1351, lng: 11.5820 },
      title: "München Hauptbahnhof",
      type: 'destination' as const,
      description: "Hauptbahnhof München"
    },
    {
      position: { lat: 48.1629, lng: 11.5524 },
      title: "Test Hotel",
      type: 'hotel' as const,
      rating: 4.2,
      pricePerNight: 150,
      description: "Test Hotel in München"
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Kartenanbieter Test</h1>
        <p className="text-gray-600">Einfacher Test für Google Maps und Mapbox</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Test Karte</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={currentProvider === 'google' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentProvider('google')}
              >
                Google Maps
              </Button>
              <Button
                variant={currentProvider === 'mapbox' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentProvider('mapbox')}
              >
                Mapbox
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div style={{ height: '500px' }}>
            <UnifiedMap
              center={testCenter}
              markers={testMarkers}
              zoom={13}
              height="100%"
              showProviderSwitch={false}
              defaultProvider={currentProvider}
              key={currentProvider} // Force re-render when provider changes
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>Aktueller Anbieter: <strong>{currentProvider === 'google' ? 'Google Maps' : 'Mapbox'}</strong></div>
            <div>Google Maps API: {import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? '✅ Konfiguriert' : '❌ Fehlt'}</div>
            <div>Mapbox Token: {import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ? '✅ Konfiguriert' : '❌ Fehlt'}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleMapTest;