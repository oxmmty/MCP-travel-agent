import React from 'react';
import { LiteAPIMapboxWidget } from '@/components/LiteAPIMapboxWidget';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin } from 'lucide-react';
import { Link } from 'wouter';

export function LiteAPIMapboxTest() {
  const munichCenter = { lat: 48.1351, lng: 11.5820 };
  
  const handleHotelSelect = (hotel: any) => {
    console.log('Hotel selected:', hotel);
    alert(`Hotel ausgewählt: ${hotel.name} - €${hotel.pricePerNight}/Nacht`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Zurück
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-green-600" />
                <h1 className="text-xl font-semibold text-gray-900">
                  LiteAPI Mapbox Integration
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Mapbox Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Section */}
        <div className="mb-8 bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <MapPin className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                LiteAPI + Mapbox Integration
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Diese Karte verwendet <strong>Mapbox</strong> als Basis-Kartendienst mit echten 
                <strong> LiteAPI-Hoteldaten</strong> als Overlay. Die Hotels zeigen Live-Preise 
                und können direkt gebucht werden. Die Karte bietet moderne Mapbox-Funktionen 
                wie smoothe Navigation und anpassbare Stile.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Mapbox GL JS
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  LiteAPI Hotels
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Live Preise
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  Direkte Buchung
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="bg-white rounded-lg shadow-lg border overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  München Hotels - Mapbox Karte
                </h3>
                <p className="text-sm text-gray-600">
                  Echte LiteAPI-Hoteldaten auf Mapbox-Karte
                </p>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>📍 München, Deutschland</span>
              </div>
            </div>
          </div>
          
          <LiteAPIMapboxWidget
            center={munichCenter}
            height="600px"
            zoom={12}
            searchParams={{
              checkin: '2025-07-01',
              checkout: '2025-07-03',
              adults: 2,
              radius: 10000
            }}
            onHotelSelect={handleHotelSelect}
            destinationName="München"
          />
        </div>

        {/* Comparison Info */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Mapbox Vorteile
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Moderne, anpassbare Kartenstile</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Bessere Performance bei vielen Markern</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Smoothe Animationen und Übergänge</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Kosteneffizient für hohe Nutzung</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Erweiterte Styling-Möglichkeiten</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Technische Details
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Mapbox GL JS v2.x Integration</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Dieselben LiteAPI-Datenquellen</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Custom Marker mit SVG-Icons</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Responsive Popup-Informationen</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Automatisches Bounds-Fitting</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex items-center justify-center space-x-4">
          <Link href="/liteapi-map">
            <Button variant="outline">
              Google Maps Version vergleichen
            </Button>
          </Link>
          <Button 
            onClick={() => window.location.reload()}
            className="bg-green-600 hover:bg-green-700"
          >
            Karte neu laden
          </Button>
        </div>
      </div>
    </div>
  );
}

export default LiteAPIMapboxTest;