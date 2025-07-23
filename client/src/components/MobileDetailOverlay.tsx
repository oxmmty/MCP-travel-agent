import { motion, AnimatePresence } from "framer-motion";
import { X, Star, MapPin, Phone, Globe, Clock, Heart, Share, Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MobileDetailOverlayProps {
  marker: any;
  isVisible: boolean;
  onClose: () => void;
  onSaveToFavorites?: (item: any) => void;
  onAddToItinerary?: (item: any) => void;
}

export default function MobileDetailOverlay({ 
  marker, 
  isVisible, 
  onClose, 
  onSaveToFavorites, 
  onAddToItinerary 
}: MobileDetailOverlayProps) {
  if (!marker) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed inset-0 z-50 bg-white dark:bg-gray-900 flex flex-col"
        >
          {/* Header Image */}
          <div className="relative h-64 bg-gray-200 dark:bg-gray-700">
            {marker.imageUrl ? (
              <img 
                src={marker.imageUrl} 
                alt={marker.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <MapPin className="w-16 h-16 text-gray-400" />
              </div>
            )}
            
            {/* Overlay Controls */}
            <div className="absolute top-4 left-4 right-4 flex justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="bg-white/80 hover:bg-white text-gray-900 backdrop-blur-sm"
              >
                <X className="w-4 h-4" />
              </Button>
              
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-white/80 hover:bg-white text-gray-900 backdrop-blur-sm"
                >
                  <Heart className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-white/80 hover:bg-white text-gray-900 backdrop-blur-sm"
                >
                  <Share className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              {/* Title and Rating */}
              <div className="mb-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {marker.title}
                </h1>
                
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="capitalize">
                    {marker.type}
                  </Badge>
                  {marker.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium">{marker.rating}</span>
                      <span className="text-sm text-gray-500">• 328 reviews</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{marker.description || 'Location details'}</span>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
                <div className="flex space-x-6">
                  <button className="py-2 px-1 border-b-2 border-blue-600 text-blue-600 font-medium text-sm">
                    Overview
                  </button>
                  <button className="py-2 px-1 text-gray-500 hover:text-gray-700 font-medium text-sm">
                    Reviews
                  </button>
                  <button className="py-2 px-1 text-gray-500 hover:text-gray-700 font-medium text-sm">
                    Location
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {marker.description || `${marker.title} is located in a beautiful area offering great experiences for visitors. This ${marker.type} provides excellent service and amenities for travelers.`}
                </p>
                
                <Button variant="outline" size="sm" className="mt-3">
                  Read more
                </Button>
              </div>

              {/* Amenities/Features */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  {marker.type === 'hotel' ? 'Amenities' : 'Features'}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Globe className="w-4 h-4" />
                    <span>Free WiFi</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Phone className="w-4 h-4" />
                    <span>24/7 Service</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>Open daily</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="w-4 h-4" />
                    <span>Central location</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex gap-3">
              <Button
                onClick={() => onSaveToFavorites?.(marker)}
                variant="outline"
                className="flex-1"
              >
                <Heart className="w-4 h-4 mr-2" />
                Save
              </Button>
              
              <Button
                onClick={() => onAddToItinerary?.(marker)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add to Trip
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}