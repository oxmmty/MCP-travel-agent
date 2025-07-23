import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { X, Plus, Minus } from "lucide-react";
import MapboxMap from "./MapboxMap";

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  destination?: string;
  destinationData?: {
    destination: any;
    hotels: any[];
    attractions: any[];
  };
  highlightedElement?: {
    name: string;
    type: 'hotel' | 'attraction';
  } | null;
  chatId?: number;
}

export default function MapModal({ isOpen, onClose, destination = "Munich", destinationData, highlightedElement, chatId }: MapModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      <div className="absolute inset-4 bg-background rounded-xl overflow-hidden">
        <div className="h-full relative">
          {/* Map Header */}
          <div className="absolute top-0 left-0 right-0 bg-background border-b border-border p-4 z-10">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                {t("munichMap")}
              </h3>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Map Content */}
          <div className="h-full pt-20">
            {destinationData ? (
              <MapboxMap
                center={destinationData.destination.coordinates}
                markers={[
                  // Destination marker
                  {
                    position: destinationData.destination.coordinates,
                    title: destinationData.destination.name,
                    type: 'destination'
                  },
                  // Hotel markers
                  ...destinationData.hotels.map(hotel => ({
                    position: hotel.coordinates || destinationData.destination.coordinates,
                    title: hotel.name,
                    type: 'hotel' as const,
                    imageUrl: hotel.imageUrl,
                    rating: hotel.rating,
                    description: hotel.description
                  })),
                  // Attraction markers
                  ...destinationData.attractions.map(attraction => ({
                    position: attraction.coordinates || destinationData.destination.coordinates,
                    title: attraction.name,
                    type: 'attraction' as const,
                    imageUrl: attraction.imageUrl,
                    rating: attraction.rating,
                    description: attraction.description
                  }))
                ]}
                zoom={12}
                height="100%"
                highlightedElement={highlightedElement}
                chatId={chatId}
                destinationName={destinationData.destination.name}
              />
            ) : (
              <div className="h-full bg-slate-100 flex items-center justify-center">
                <p className="text-slate-500">Loading map data...</p>
              </div>
            )}
          </div>

          {/* Map Controls */}
          <div className="absolute bottom-4 right-4 space-y-2">
            <Button
              variant="secondary"
              size="icon"
              className="bg-background shadow-lg hover:shadow-xl"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="bg-background shadow-lg hover:shadow-xl"
            >
              <Minus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
