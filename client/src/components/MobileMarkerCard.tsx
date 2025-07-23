import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, MapPin, Phone, Globe, Clock, Heart, Share } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileMarkerCardProps {
  marker: any;
  isVisible: boolean;
  onClose: () => void;
  onFullView: () => void;
}

export default function MobileMarkerCard({ marker, isVisible, onClose, onFullView }: MobileMarkerCardProps) {
  if (!marker) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg"
        >
          <div className="p-4">
            <div className="flex items-start gap-3">
              {/* Image */}
              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-700">
                {marker.imageUrl ? (
                  <img 
                    src={marker.imageUrl} 
                    alt={marker.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {marker.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {marker.type}
                    </p>
                    {marker.rating && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-current" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {marker.rating}
                        </span>
                      </div>
                    )}
                    {marker.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 line-clamp-2">
                        {marker.description}
                      </p>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="flex-shrink-0 ml-2"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Action Button */}
                <Button
                  onClick={onFullView}
                  className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  View Details
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}