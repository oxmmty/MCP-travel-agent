import { useState } from "react";
import LiteAPIMapWidget from "@/components/LiteAPIMapWidget";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Users } from "lucide-react";

export default function LiteAPIMapTest() {
  const [selectedLocation, setSelectedLocation] = useState({
    name: "München",
    lat: 48.1351,
    lng: 11.5820
  });

  const [searchParams, setSearchParams] = useState({
    checkin: "2025-08-01",
    checkout: "2025-08-03",
    adults: 2,
    radius: 10
  });

  const locations = [
    { name: "München", lat: 48.1351, lng: 11.5820 },
    { name: "Berlin", lat: 52.5200, lng: 13.4050 },
    { name: "Hamburg", lat: 53.5511, lng: 9.9937 },
    { name: "Frankfurt", lat: 50.1109, lng: 8.6821 },
    { name: "Köln", lat: 50.9375, lng: 6.9603 }
  ];

  const handleLocationChange = (location: typeof selectedLocation) => {
    setSelectedLocation(location);
  };

  const handleHotelSelect = (hotel: any) => {
    console.log("Hotel ausgewählt:", hotel);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">LiteAPI Map Widget Test</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Teste das neue LiteAPI Map Widget mit echten Hoteldaten und Buchungsfunktionalität.
          Das Widget zeigt Hotels direkt von LiteAPI mit Preisen und Verfügbarkeit an.
        </p>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Map-Einstellungen
          </CardTitle>
          <CardDescription>
            Wähle Ort und Suchparameter für die LiteAPI Hotelsuche
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Location Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">Standort:</label>
            <div className="flex flex-wrap gap-2">
              {locations.map((location) => (
                <Button
                  key={location.name}
                  variant={selectedLocation.name === location.name ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleLocationChange(location)}
                >
                  {location.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Search Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Check-in:</label>
              <input
                type="date"
                value={searchParams.checkin}
                onChange={(e) => setSearchParams(prev => ({ ...prev, checkin: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Check-out:</label>
              <input
                type="date"
                value={searchParams.checkout}
                onChange={(e) => setSearchParams(prev => ({ ...prev, checkout: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Gäste:</label>
              <select
                value={searchParams.adults}
                onChange={(e) => setSearchParams(prev => ({ ...prev, adults: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value={1}>1 Erwachsener</option>
                <option value={2}>2 Erwachsene</option>
                <option value={3}>3 Erwachsene</option>
                <option value={4}>4 Erwachsene</option>
              </select>
            </div>
          </div>

          {/* Current Settings Display */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {selectedLocation.name}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {searchParams.checkin} - {searchParams.checkout}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {searchParams.adults} Gäste
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* LiteAPI Map Widget */}
      <Card>
        <CardHeader>
          <CardTitle>LiteAPI Hotels Map</CardTitle>
          <CardDescription>
            Interaktive Karte mit Hotels von LiteAPI. Klicke auf Hotels für Details und Buchung.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LiteAPIMapWidget
            center={selectedLocation}
            height="500px"
            searchParams={searchParams}
            onHotelSelect={handleHotelSelect}
            destinationName={selectedLocation.name}
          />
        </CardContent>
      </Card>

      {/* Features Info */}
      <Card>
        <CardHeader>
          <CardTitle>Widget-Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">LiteAPI Integration:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Echte Hoteldaten von LiteAPI</li>
                <li>• Live-Preise und Verfügbarkeit</li>
                <li>• Provisionsbasierte Monetarisierung</li>
                <li>• Mehrsprachige Unterstützung</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Map-Features:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Interaktive Hotelmarker</li>
                <li>• Preisanzeige pro Nacht</li>
                <li>• Direkter Buchungslink</li>
                <li>• Responsive Design</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}