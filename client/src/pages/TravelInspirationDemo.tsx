import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TravelInspiration } from "@/components/TravelInspirationFixed";
import { Camera, Play, MapPin } from "lucide-react";

export default function TravelInspirationDemo() {
  const [selectedDestination, setSelectedDestination] = useState<string>("Paris");

  const destinations = [
    { value: "Paris", label: "Paris, Frankreich", emoji: "🇫🇷" },
    { value: "London", label: "London, Großbritannien", emoji: "🇬🇧" },
    { value: "Barcelona", label: "Barcelona, Spanien", emoji: "🇪🇸" },
    { value: "Tokyo", label: "Tokyo, Japan", emoji: "🇯🇵" },
    { value: "New York", label: "New York, USA", emoji: "🇺🇸" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-3xl">
              <Camera className="h-8 w-8 text-blue-600" />
              Travel Inspiration Demo
            </CardTitle>
            <p className="text-gray-600">
              Entdecke inspirierende Inhalte zu verschiedenen Reisezielen mit hochwertigen Fotos von Unsplash 
              und kuratierten Videos von YouTube und TikTok.
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gray-500" />
                <span className="font-medium">Reiseziel wählen:</span>
              </div>
              <Select value={selectedDestination} onValueChange={setSelectedDestination}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Wähle ein Reiseziel" />
                </SelectTrigger>
                <SelectContent>
                  {destinations.map((dest) => (
                    <SelectItem key={dest.value} value={dest.value}>
                      <div className="flex items-center gap-2">
                        <span>{dest.emoji}</span>
                        <span>{dest.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-6 text-center">
              <Camera className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Unsplash Fotos</h3>
              <p className="text-sm text-gray-600">
                Hochwertige Reisefotos mit Fotografen-Attribution und Lazy Loading
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Play className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">YouTube Videos</h3>
              <p className="text-sm text-gray-600">
                Authentische Reise-Vlogs und Destination-Guides
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Component */}
        <div className="h-[800px]">
          <TravelInspiration 
            destination={selectedDestination} 
            className="shadow-lg"
          />
        </div>

        {/* Technical Details */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Technische Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Frontend Features:</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Lazy Loading für Bilder und Videos</li>
                  <li>• Responsive Design mit TailwindCSS</li>
                  <li>• Intersection Observer für Performance</li>
                  <li>• Hover-Effekte und Animationen</li>
                  <li>• Like- und Share-Funktionalität</li>
                  <li>• Automatische Bildoptimierung</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Backend Integration:</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Unsplash API für hochwertige Fotos</li>
                  <li>• Lokale Video-Mappings pro Destination</li>
                  <li>• Automatische Fotografen-Attribution</li>
                  <li>• Error Handling und Fallbacks</li>
                  <li>• Rate Limiting und Caching</li>
                  <li>• TypeScript für Type Safety</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-8 pb-8">
          <p>
            Demo der TravelInspiration-Komponente • 
            Fotos von <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="underline">Unsplash</a> • 
            Videos von YouTube und TikTok
          </p>
        </div>
      </div>
    </div>
  );
}