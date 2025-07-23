import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink } from "lucide-react";

interface LiteAPIMapProps {
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
  chatId?: number;
  destinationName?: string;
}

interface LiteAPIHotel {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  description?: string;
  amenities: string[];
  images: string[];
  distance?: number;
  pricePerNight?: number;
  currency?: string;
  commission?: number;
}

declare global {
  interface Window {
    google: any;
    initLiteAPIMap: () => void;
  }
}

export default function LiteAPIMap({ 
  center, 
  zoom = 13, 
  height = "400px", 
  searchParams, 
  onHotelSelect, 
  chatId, 
  destinationName 
}: LiteAPIMapProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [widgetUrl, setWidgetUrl] = useState<string>("");

  // Generate LiteAPI Map Widget URL
  useEffect(() => {
    const generateWidgetUrl = () => {
      const params = new URLSearchParams({
        api_key: import.meta.env.VITE_LITEAPI_PUBLIC_KEY || '77aef87e-ca40-4c44-b107-f492fceb7b57',
        latitude: center.lat.toString(),
        longitude: center.lng.toString(),
        radius: (searchParams?.radius || 10).toString(),
        currency: 'EUR',
        language: 'de',
        theme: 'light',
        embed: 'true',
        ...(searchParams?.checkin && { checkin: searchParams.checkin }),
        ...(searchParams?.checkout && { checkout: searchParams.checkout }),
        ...(searchParams?.adults && { adults: searchParams.adults.toString() })
      });

      // Official LiteAPI Map Widget URL based on documentation
      const url = `https://widget.liteapi.travel/map?${params.toString()}`;
      setWidgetUrl(url);
    };

    generateWidgetUrl();
  }, [center, searchParams]);

  // Handle iframe load events
  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    console.log("LiteAPI Widget failed to load");
  };

  if (isLoading) {
    return (
      <div className="relative w-full" style={{ height }}>
        <div className="flex items-center justify-center h-full bg-slate-100 rounded-lg border border-slate-200">
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-slate-600 mb-2">LiteAPI Hotels werden geladen...</div>
            <div className="text-xs text-slate-400">{center.lat.toFixed(4)}, {center.lng.toFixed(4)}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ height }}>
      {/* LiteAPI Hotel Count Header */}
      {hotelsData?.hotels && (
        <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-3 border">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
            <span className="text-sm font-medium">
              {hotelsData.hotels.length} LiteAPI Hotels
            </span>
            {searchParams && (
              <Badge variant="secondary" className="text-xs">
                {searchParams.checkin} - {searchParams.checkout}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Map Container */}
      <div 
        ref={mapRef} 
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg overflow-hidden border border-slate-200 bg-slate-100"
      />
      
      {/* Map Item Overlay */}
      {overlayItem && (
        <MapItemOverlay
          item={overlayItem}
          position={overlayPosition}
          onClose={() => setOverlayItem(null)}
          chatId={chatId}
          destinationName={destinationName}
        />
      )}

      {/* LiteAPI Attribution */}
      <div className="absolute bottom-4 left-4 z-10 bg-white rounded px-2 py-1 text-xs text-gray-500 border">
        Powered by LiteAPI
      </div>
    </div>
  );
}