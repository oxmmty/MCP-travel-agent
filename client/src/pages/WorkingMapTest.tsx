import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import GoogleMap from '../components/GoogleMap';
import SimpleMapboxMap from '../components/SimpleMapboxMap';

const WorkingMapTest = () => {
  const [currentProvider, setCurrentProvider] = useState<'google' | 'mapbox'>('google');
  
  const testCenter = { lat: 48.1351, lng: 11.5820 }; // Munich
  const testMarkers = [
    {
      position: { lat: 48.1351, lng: 11.5820 },
      title: "München Hauptbahnhof",
      type: 'destination'
    },
    {
      position: { lat: 48.1629, lng: 11.5524 },
      title: "Hotel Test",
      type: 'hotel'
    }
  ];

  const googleMarkers = testMarkers.map(m => ({
    ...m,
    type: m.type as 'destination' | 'hotel' | 'attraction' | 'restaurant'
  }));

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Funktions-Test: Google Maps vs Mapbox</h1>
        <p className="text-gray-600">Direkter Vergleich ohne komplexe Features</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Kartenanbieter wählen</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={currentProvider === 'google' ? 'default' : 'outline'}
                onClick={() => setCurrentProvider('google')}
              >
                Google Maps
              </Button>
              <Button
                variant={currentProvider === 'mapbox' ? 'default' : 'outline'}
                onClick={() => setCurrentProvider('mapbox')}
              >
                Mapbox
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <strong>Aktuell aktiv:</strong> {currentProvider === 'google' ? 'Google Maps' : 'Mapbox'}
          </div>
          
          <div style={{ height: '500px' }}>
            {currentProvider === 'google' ? (
              <GoogleMap
                center={testCenter}
                markers={googleMarkers}
                zoom={13}
                height="100%"
              />
            ) : (
              <SimpleMapboxMap
                center={testCenter}
                markers={testMarkers}
                zoom={13}
                height="100%"
              />
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-blue-50 rounded">
              <div className="font-semibold text-blue-800">Google Maps</div>
              <div className="text-blue-600">
                {import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? 
                  '✅ API Key konfiguriert' : 
                  '❌ VITE_GOOGLE_MAPS_API_KEY fehlt'
                }
              </div>
            </div>
            <div className="p-3 bg-green-50 rounded">
              <div className="font-semibold text-green-800">Mapbox</div>
              <div className="text-green-600">
                {import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ? 
                  '✅ Access Token konfiguriert' : 
                  '❌ VITE_MAPBOX_ACCESS_TOKEN fehlt'
                }
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nächste Schritte</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>1. Testen Sie beide Anbieter mit den Buttons oben</div>
            <div>2. Prüfen Sie die Marker und Zoom-Funktionen</div>
            <div>3. Bei Problemen: Token in Replit Secrets überprüfen</div>
            <div>4. Beide Implementierungen sind parallel einsatzbereit</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkingMapTest;