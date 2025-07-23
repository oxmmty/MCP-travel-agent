import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import GoogleMap from '../components/GoogleMap';
import MapboxMap from '../components/MapboxMap';
import UnifiedMap from '../components/UnifiedMap';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const MapComparison = () => {
  const { t } = useTranslation();
  
  // Sample data for testing
  const testCenter = { lat: 48.1351, lng: 11.5820 }; // Munich
  const testMarkers = [
    {
      position: { lat: 48.1351, lng: 11.5820 },
      title: "München Hauptbahnhof",
      type: 'destination' as const,
      description: "Hauptbahnhof München - zentraler Verkehrsknotenpunkt"
    },
    {
      position: { lat: 48.1629, lng: 11.5524 },
      title: "Hotel München Palace",
      type: 'hotel' as const,
      rating: 4.2,
      pricePerNight: 189,
      description: "Luxushotel im Herzen von München"
    },
    {
      position: { lat: 48.1486, lng: 11.5678 },
      title: "Englischer Garten",
      type: 'attraction' as const,
      rating: 4.6,
      description: "Einer der größten Stadtparks der Welt"
    },
    {
      position: { lat: 48.1374, lng: 11.5755 },
      title: "Augustiner Bräu",
      type: 'restaurant' as const,
      rating: 4.4,
      description: "Traditionelle bayerische Küche und Bier"
    }
  ];

  const [view, setView] = useState<'unified' | 'side-by-side' | 'google-only' | 'mapbox-only'>('unified');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Karten-Anbieter Vergleich</h1>
        <p className="text-gray-600 mb-6">
          Testen Sie Google Maps vs. Mapbox Integration - beide Implementierungen sind parallel verfügbar
        </p>
      </div>

      {/* View Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ansicht wählen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={view === 'unified' ? 'default' : 'outline'}
              onClick={() => setView('unified')}
            >
              Einheitliche Karte (mit Umschalter)
            </Button>
            <Button
              variant={view === 'side-by-side' ? 'default' : 'outline'}
              onClick={() => setView('side-by-side')}
            >
              Nebeneinander Vergleich
            </Button>
            <Button
              variant={view === 'google-only' ? 'default' : 'outline'}
              onClick={() => setView('google-only')}
            >
              Nur Google Maps
            </Button>
            <Button
              variant={view === 'mapbox-only' ? 'default' : 'outline'}
              onClick={() => setView('mapbox-only')}
            >
              Nur Mapbox
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Map Views */}
      {view === 'unified' && (
        <Card>
          <CardHeader>
            <CardTitle>Einheitliche Karte mit Provider-Umschalter</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: '500px' }}>
              <UnifiedMap
                center={testCenter}
                markers={testMarkers}
                zoom={13}
                height="100%"
                showProviderSwitch={true}
                defaultProvider="google"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {view === 'side-by-side' && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Google Maps
                <Badge variant="outline">Original</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ height: '400px' }}>
                <GoogleMap
                  center={testCenter}
                  markers={testMarkers}
                  zoom={13}
                  height="100%"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Mapbox GL JS
                <Badge variant="outline">Alternative</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ height: '400px' }}>
                <MapboxMap
                  center={testCenter}
                  markers={testMarkers}
                  zoom={13}
                  height="100%"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {view === 'google-only' && (
        <Card>
          <CardHeader>
            <CardTitle>Google Maps (Vollbild)</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: '600px' }}>
              <GoogleMap
                center={testCenter}
                markers={testMarkers}
                zoom={13}
                height="100%"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {view === 'mapbox-only' && (
        <Card>
          <CardHeader>
            <CardTitle>Mapbox GL JS (Vollbild)</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: '600px' }}>
              <MapboxMap
                center={testCenter}
                markers={testMarkers}
                zoom={13}
                height="100%"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feature Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Feature-Vergleich</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 p-3 text-left">Feature</th>
                  <th className="border border-gray-200 p-3 text-center">Google Maps</th>
                  <th className="border border-gray-200 p-3 text-center">Mapbox GL JS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-200 p-3 font-medium">API-Schlüssel erforderlich</td>
                  <td className="border border-gray-200 p-3 text-center">✅ GOOGLE_MAPS_API_KEY</td>
                  <td className="border border-gray-200 p-3 text-center">✅ MAPBOX_ACCESS_TOKEN</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-200 p-3 font-medium">3D-Unterstützung</td>
                  <td className="border border-gray-200 p-3 text-center">✅ Basic</td>
                  <td className="border border-gray-200 p-3 text-center">✅ Erweitert</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 p-3 font-medium">Anpassung des Stils</td>
                  <td className="border border-gray-200 p-3 text-center">⚠️ Begrenzt</td>
                  <td className="border border-gray-200 p-3 text-center">✅ Vollständig</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-200 p-3 font-medium">Performance</td>
                  <td className="border border-gray-200 p-3 text-center">✅ Gut</td>
                  <td className="border border-gray-200 p-3 text-center">✅ Sehr gut</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 p-3 font-medium">WebGL-Anforderung</td>
                  <td className="border border-gray-200 p-3 text-center">❌ Optional</td>
                  <td className="border border-gray-200 p-3 text-center">✅ Erforderlich</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-200 p-3 font-medium">Offline-Karten</td>
                  <td className="border border-gray-200 p-3 text-center">❌ Nein</td>
                  <td className="border border-gray-200 p-3 text-center">✅ Möglich</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 p-3 font-medium">Kostenmodell</td>
                  <td className="border border-gray-200 p-3 text-center">💰 Pro Aufruf</td>
                  <td className="border border-gray-200 p-3 text-center">💰 Pro Aufruf</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Implementation Status */}
      <Card>
        <CardHeader>
          <CardTitle>Implementierungsstatus</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge variant="default">Vollständig</Badge>
              <span>Google Maps Integration (bestehend)</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="default">Vollständig</Badge>
              <span>Mapbox GL JS Integration (neu)</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="default">Vollständig</Badge>
              <span>Einheitliche Map-Komponente mit Provider-Umschalter</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">Konfiguration erforderlich</Badge>
              <span>VITE_MAPBOX_ACCESS_TOKEN in Umgebungsvariablen</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Nächste Schritte</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Mapbox-Account erstellen auf <a href="https://www.mapbox.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">mapbox.com</a></li>
            <li>Access Token in den Replit Secrets als <code className="bg-gray-100 px-1 py-0.5 rounded">VITE_MAPBOX_ACCESS_TOKEN</code> hinzufügen</li>
            <li>Den Provider-Umschalter in der einheitlichen Karte testen</li>
            <li>Beide Implementierungen parallel nutzen und vergleichen</li>
            <li>Bei Zufriedenheit optional auf einen Provider standardisieren</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};

export default MapComparison;