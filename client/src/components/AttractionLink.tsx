import { useState, useRef } from "react";
import { Plus, MapPin, Clock, Euro } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AttractionLinkProps {
  children: React.ReactNode;
  attractionName: string;
  onAddToItinerary?: (attractionName: string) => void;
}

export default function AttractionLink({ children, attractionName, onAddToItinerary }: AttractionLinkProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const handleMouseEnter = () => {
    setIsHovered(true);
    timeoutRef.current = setTimeout(() => {
      setShowTooltip(true);
    }, 500);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowTooltip(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleAddToItinerary = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToItinerary?.(attractionName);
  };

  // Mock attraction data - in a real app this would come from an API
  const attractionInfo = {
    description: "Historic landmark with guided tours available",
    duration: "1-2 hours",
    cost: "€8-15",
    rating: 4.5
  };

  return (
    <span 
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span 
        className={`underline decoration-blue-500 decoration-2 cursor-pointer transition-colors ${
          isHovered ? 'text-blue-600 bg-blue-50' : 'text-blue-500'
        }`}
      >
        {children}
      </span>
      
      {showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64">
          <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-4">
            {/* Tooltip content */}
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <h4 className="font-semibold text-slate-900 text-sm">{attractionName}</h4>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-blue-600 hover:bg-blue-50"
                  onClick={handleAddToItinerary}
                  title="Add to itinerary"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              
              <p className="text-xs text-slate-600">{attractionInfo.description}</p>
              
              <div className="space-y-2">
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock className="h-3 w-3" />
                  <span>{attractionInfo.duration}</span>
                </div>
                
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Euro className="h-3 w-3" />
                  <span>{attractionInfo.cost}</span>
                </div>
                
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <MapPin className="h-3 w-3" />
                  <span>Historic Center</span>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <span
                    key={i}
                    className={`text-xs ${
                      i < Math.floor(attractionInfo.rating) 
                        ? "text-yellow-400" 
                        : "text-slate-300"
                    }`}
                  >
                    ★
                  </span>
                ))}
                <span className="text-xs text-slate-500 ml-1">
                  {attractionInfo.rating}
                </span>
              </div>
            </div>
            
            {/* Tooltip arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-200"></div>
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white absolute -top-px left-1/2 transform -translate-x-1/2"></div>
            </div>
          </div>
        </div>
      )}
    </span>
  );
}