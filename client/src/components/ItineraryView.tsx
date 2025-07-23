import { Clock, MapPin, Euro, Timer } from "lucide-react";
import { useItineraryTranslation } from "@/lib/itinerary-translator";
import type { ItineraryItem } from "@shared/schema";

interface ItineraryViewProps {
  title: string;
  day: number;
  items: ItineraryItem[];
}

export default function ItineraryView({ title, day, items }: ItineraryViewProps) {
  const { translateItinerary, t } = useItineraryTranslation();
  
  const translatedItinerary = translateItinerary({ title, day, items });
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">{translatedItinerary.title}</h3>
        <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-medium">
          {t('itinerary.day')} {translatedItinerary.day}
        </span>
      </div>
      
      <div className="space-y-4">
        {translatedItinerary.items.map((item, index) => (
          <div key={index} className="flex gap-3">
            <div className="flex-shrink-0 w-12 text-right">
              <span className="text-red-500 font-medium text-sm">{item.time}</span>
            </div>
            
            <div className="flex-1 border-l-2 border-slate-100 pl-4 pb-4 last:pb-0">
              <div className="relative">
                <div className="absolute -left-6 w-2 h-2 bg-red-500 rounded-full mt-1"></div>
                
                <h4 className="font-semibold text-slate-900 mb-1">{item.title}</h4>
                <p className="text-slate-600 text-sm mb-2 leading-relaxed">{item.description}</p>
                
                <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{item.location}</span>
                  </div>
                  
                  {item.duration && (
                    <div className="flex items-center gap-1">
                      <Timer className="w-3 h-3" />
                      <span>{item.duration}</span>
                    </div>
                  )}
                  
                  {item.cost && (
                    <div className="flex items-center gap-1">
                      <Euro className="w-3 h-3" />
                      <span>{item.cost}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}