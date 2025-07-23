import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import MainTabs from './MainTabs';
import MapboxMap, { MapboxMarker } from './MapboxMap';
import ActionIcons from './ActionIcons';
import DetailSidebar from './DetailSidebar';
import TripSidebar from './TripSidebar';
import TravelMoodSelector from './TravelMoodSelector';
import { Button } from '@/components/ui/button';
import { Route, Users, Sparkles } from 'lucide-react';

interface SplitScreenLayoutProps {
  chatId?: number;
  destinationData?: any;
  highlightedElement?: {name: string, type: 'hotel' | 'attraction'} | null;
  onHighlightElement?: (name: string, type: 'hotel' | 'attraction') => void;
  onUnhighlightElement?: () => void;
  onDestinationContext?: (metadata: any) => void;
  onChatCreated?: (chatId: number) => void;
}

export default function SplitScreenLayout({
  chatId,
  destinationData,
  highlightedElement,
  onHighlightElement,
  onUnhighlightElement,
  onDestinationContext,
  onChatCreated
}: SplitScreenLayoutProps) {
  const [mapMarkers, setMapMarkers] = useState<MapboxMarker[]>([]); // Use proper type
  const [mapCenter, setMapCenter] = useState({ lat: 48.1351, lng: 11.582 }); // Default to Munich
  const [showActionIcons, setShowActionIcons] = useState(false);
  const [isDetailSidebarOpen, setIsDetailSidebarOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isTripSidebarOpen, setIsTripSidebarOpen] = useState(false);
  const [isMoodSelectorOpen, setIsMoodSelectorOpen] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [showTabs, setShowTabs] = useState(false);
  
  // Unified function to add markers to map - single source of truth
  const addMarkersToMap = (newMarkers: MapboxMarker[]) => {
    setMapMarkers(prev => {
      // Filter out duplicates by checking title and type
      const filtered = newMarkers.filter(newMarker => {
        const existing = prev.find(existingMarker => 
          existingMarker.title?.toLowerCase() === newMarker.title?.toLowerCase() && 
          existingMarker.type === newMarker.type
        );
        return !existing;
      });
      
      if (filtered.length > 0) {
        console.log('📍 Adding markers to map:', filtered.map(m => m.title));
        return [...prev, ...filtered];
      }
      
      return prev;
    });
  };



  // Update map center when destination changes
  useEffect(() => {
    if (destinationData?.destination?.coordinates) {
      setMapCenter(destinationData.destination.coordinates);
      setShowActionIcons(true);
      setShowTabs(true); // Show tabs when destination data is available
      if (!hasAnimated) {
        setHasAnimated(true);
      }
      

    }
  }, [destinationData]);

  const handleSearchQuerySent = () => {
    setShowTabs(true);
  };

  const handleActionClick = async (action: string) => {
    if (!destinationData?.destination) return;

    let newMarkers: any[] = [];

    switch (action) {
      case 'hotels':
        try {
          // Fetch real hotel data from Google Maps API
          const response = await fetch(`/api/destinations/search-hotels?lat=${mapCenter.lat}&lng=${mapCenter.lng}`);
          if (response.ok) {
            const hotels = await response.json();
            newMarkers = hotels.map((hotel: any) => ({
              position: hotel.location || hotel.coordinates,
              title: hotel.name,
              type: 'hotel' as const,
              imageUrl: hotel.photos?.[0] || hotel.imageUrl,
              rating: hotel.rating,
              description: hotel.vicinity || hotel.address || hotel.description,
              pricePerNight: hotel.pricePerNight,
              category: hotel.category,
              source: 'action'
            }));
            
            // Clear existing markers and add new ones
            setMapMarkers(newMarkers);
          } else {
            console.warn('Hotels API response not ok:', response.status);
            // Use existing stored hotels if API fails
            newMarkers = destinationData.hotels?.map((hotel: any) => ({
              position: hotel.coordinates || mapCenter,
              title: hotel.name,
              type: 'hotel' as const,
              imageUrl: hotel.imageUrl,
              rating: hotel.rating,
              description: hotel.description
            })) || [];
          }
        } catch (error) {
          console.error('Error fetching hotels:', error);
          // Use existing stored hotels as fallback
          newMarkers = destinationData.hotels?.map((hotel: any) => ({
            position: hotel.coordinates || mapCenter,
            title: hotel.name,
            type: 'hotel' as const,
            imageUrl: hotel.imageUrl,
            rating: hotel.rating,
            description: hotel.description
          })) || [];
        }
        break;
      
      case 'attractions':
        try {
          // Fetch real attraction data from Google Maps API
          const response = await fetch(`/api/destinations/search-attractions?lat=${mapCenter.lat}&lng=${mapCenter.lng}`);
          if (response.ok) {
            const attractions = await response.json();
            newMarkers = attractions.map((attraction: any) => ({
              position: attraction.location || attraction.coordinates,
              title: attraction.name,
              type: 'attraction' as const,
              imageUrl: attraction.photos?.[0] || attraction.imageUrl,
              rating: attraction.rating,
              description: attraction.vicinity || attraction.address || attraction.description,
              category: attraction.category,
              source: 'action'
            }));
            
            // Clear existing markers and add new ones
            setMapMarkers(newMarkers);
          } else {
            console.warn('Attractions API response not ok:', response.status);
            // Use existing stored attractions if API fails
            newMarkers = destinationData.attractions?.map((attraction: any) => ({
              position: attraction.coordinates || mapCenter,
              title: attraction.name,
              type: 'attraction' as const,
              imageUrl: attraction.imageUrl,
              rating: attraction.rating,
              description: attraction.description,
              category: attraction.category
            })) || [];
          }
        } catch (error) {
          console.error('Error fetching attractions:', error);
          // Use existing stored attractions as fallback
          newMarkers = destinationData.attractions?.map((attraction: any) => ({
            position: attraction.coordinates || mapCenter,
            title: attraction.name,
            type: 'attraction' as const,
            imageUrl: attraction.imageUrl,
            rating: attraction.rating,
            description: attraction.description,
            category: attraction.category
          })) || [];
        }
        break;
      
      case 'restaurants':
        try {
          const response = await fetch(`/api/destinations/search-restaurants?lat=${mapCenter.lat}&lng=${mapCenter.lng}`);
          if (response.ok) {
            const restaurants = await response.json();
            newMarkers = restaurants.map((restaurant: any) => ({
              position: restaurant.location || restaurant.coordinates,
              title: restaurant.name,
              type: 'restaurant' as const,
              imageUrl: restaurant.photos?.[0] || restaurant.imageUrl,
              rating: restaurant.rating,
              description: restaurant.vicinity || restaurant.address || restaurant.description,
              category: restaurant.category,
              source: 'action'
            }));
            
            // Clear existing markers and add new ones
            setMapMarkers(newMarkers);
          } else {
            console.warn('Restaurants API response not ok:', response.status);
            // Fallback if API fails
            console.warn('Using fallback restaurants');
            setMapMarkers([]);
          }
        } catch (error) {
          console.error('Error fetching restaurants:', error);
          // Don't show fallback markers
          setMapMarkers([]);
        }
        break;
      
      case 'shopping':
        try {
          const response = await fetch(`/api/destinations/search-shopping?lat=${mapCenter.lat}&lng=${mapCenter.lng}`);
          if (response.ok) {
            const shopping = await response.json();
            newMarkers = shopping.map((shop: any) => ({
              position: shop.location || shop.coordinates,
              title: shop.name,
              type: 'attraction' as const, // Use attraction type since shopping isn't in MapboxMarker
              imageUrl: shop.photos?.[0] || shop.imageUrl,
              rating: shop.rating,
              description: shop.vicinity || shop.address || shop.description,
              category: 'shopping',
              source: 'action'
            }));
            setMapMarkers(newMarkers);
          } else {
            console.warn('Shopping API response not ok:', response.status);
            setMapMarkers([]);
          }
        } catch (error) {
          console.error('Error fetching shopping:', error);
          setMapMarkers([]);
        }
        break;
      
      case 'parks':
        try {
          const response = await fetch(`/api/destinations/search-parks?lat=${mapCenter.lat}&lng=${mapCenter.lng}`);
          if (response.ok) {
            const parks = await response.json();
            newMarkers = parks.map((park: any) => ({
              position: park.location || park.coordinates,
              title: park.name,
              type: 'attraction' as const, // Use attraction type since park isn't in MapboxMarker
              imageUrl: park.photos?.[0] || park.imageUrl,
              rating: park.rating,
              description: park.vicinity || park.address || park.description,
              category: 'park',
              source: 'action'
            }));
            setMapMarkers(newMarkers);
          } else {
            console.warn('Parks API response not ok:', response.status);
            setMapMarkers([]);
          }
        } catch (error) {
          console.error('Error fetching parks:', error);
          setMapMarkers([]);
        }
        break;
      
      case 'cafes':
        try {
          const response = await fetch(`/api/destinations/search-cafes?lat=${mapCenter.lat}&lng=${mapCenter.lng}`);
          if (response.ok) {
            const cafes = await response.json();
            newMarkers = cafes.map((cafe: any) => ({
              position: cafe.location || cafe.coordinates,
              title: cafe.name,
              type: 'restaurant' as const, // Use restaurant type since cafe isn't in MapboxMarker
              imageUrl: cafe.photos?.[0] || cafe.imageUrl,
              rating: cafe.rating,
              description: cafe.vicinity || cafe.address || cafe.description,
              category: 'cafe',
              source: 'action'
            }));
            setMapMarkers(newMarkers);
          } else {
            console.warn('Cafes API response not ok:', response.status);
            setMapMarkers([]);
          }
        } catch (error) {
          console.error('Error fetching cafes:', error);
          setMapMarkers([]);
        }
        break;
      
      case 'transport':
        try {
          const response = await fetch(`/api/destinations/search-transport?lat=${mapCenter.lat}&lng=${mapCenter.lng}`);
          if (response.ok) {
            const transport = await response.json();
            newMarkers = transport.map((station: any) => ({
              position: station.location || station.coordinates,
              title: station.name,
              type: 'attraction' as const, // Use attraction type since transport isn't in MapboxMarker
              imageUrl: station.photos?.[0] || station.imageUrl,
              rating: station.rating,
              description: station.vicinity || station.address || station.description,
              category: 'transport',
              source: 'action'
            }));
            setMapMarkers(newMarkers);
          } else {
            console.warn('Transport API response not ok:', response.status);
            setMapMarkers([]);
          }
        } catch (error) {
          console.error('Error fetching transport:', error);
          setMapMarkers([]);
        }
        break;
      
      case 'nearby':
        // Fetch all types of places nearby
        try {
          const [hotelsRes, attractionsRes, restaurantsRes] = await Promise.all([
            fetch(`/api/destinations/search-hotels?lat=${mapCenter.lat}&lng=${mapCenter.lng}`),
            fetch(`/api/destinations/search-attractions?lat=${mapCenter.lat}&lng=${mapCenter.lng}`),
            fetch(`/api/destinations/search-restaurants?lat=${mapCenter.lat}&lng=${mapCenter.lng}`)
          ]);
          
          newMarkers = [];
          
          if (hotelsRes.ok) {
            const hotels = await hotelsRes.json();
            newMarkers.push(...hotels.map((hotel: any) => ({
              position: hotel.location || hotel.coordinates,
              title: hotel.name,
              type: 'hotel' as const,
              imageUrl: hotel.photos?.[0] || hotel.imageUrl,
              rating: hotel.rating,
              description: hotel.vicinity || hotel.address || hotel.description,
              pricePerNight: hotel.pricePerNight,
              source: 'action'
            })));
          }
          
          if (attractionsRes.ok) {
            const attractions = await attractionsRes.json();
            newMarkers.push(...attractions.map((attraction: any) => ({
              position: attraction.location || attraction.coordinates,
              title: attraction.name,
              type: 'attraction' as const,
              imageUrl: attraction.photos?.[0] || attraction.imageUrl,
              rating: attraction.rating,
              description: attraction.vicinity || attraction.address || attraction.description,
              category: attraction.category,
              source: 'action'
            })));
          }
          
          if (restaurantsRes.ok) {
            const restaurants = await restaurantsRes.json();
            newMarkers.push(...restaurants.map((restaurant: any) => ({
              position: restaurant.location || restaurant.coordinates,
              title: restaurant.name,
              type: 'restaurant' as const,
              imageUrl: restaurant.photos?.[0] || restaurant.imageUrl,
              rating: restaurant.rating,
              description: restaurant.vicinity || restaurant.address || restaurant.description,
              category: restaurant.category,
              source: 'action'
            })));
          }
          
          setMapMarkers(newMarkers);
        } catch (error) {
          console.error('Error fetching nearby places:', error);
          setMapMarkers([]);
        }
        break;
    }

    // Markers are already set in each case using setMapMarkers(newMarkers)
  };

  const sendActionResultToChat = async (action: string, results: any[]) => {
    if (!chatId) return;

    let message = '';
    switch (action) {
      case 'hotels':
        message = `Ich habe ${results.length} Hotels in der Nähe gefunden:\n\n${results.slice(0, 10).map((hotel: any, i: number) => 
          `${i + 1}. **${hotel.name}**\n   📍 ${hotel.address || hotel.vicinity || 'Adresse nicht verfügbar'}\n   ⭐ ${hotel.rating ? `${hotel.rating}/5` : 'Keine Bewertung'}\n`
        ).join('\n')}`;
        break;
      case 'attractions':
        message = `Ich habe ${results.length} Sehenswürdigkeiten gefunden:\n\n${results.slice(0, 10).map((attraction: any, i: number) => 
          `${i + 1}. **${attraction.name}**\n   📍 ${attraction.address || attraction.vicinity || 'Adresse nicht verfügbar'}\n   🏛️ ${attraction.category || 'Sehenswürdigkeit'}\n`
        ).join('\n')}`;
        break;
    }

    try {
      const response = await fetch(`/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'assistant',
          content: message,
        }),
      });

      if (!response.ok) {
        console.error('Failed to send action result to chat');
      }
    } catch (error) {
      console.error('Error sending action result to chat:', error);
    }
  };

  const handleDestinationContext = (metadata: any) => {
    onDestinationContext?.(metadata);
  };

  // Function to resolve coordinates for an item using Google Places API
  const resolveCoordinates = async (itemName: string, locationType: string): Promise<{lat: number, lng: number} | null> => {
    try {
      const destinationName = destinationData?.destination?.name || 'Munich';
      const searchQuery = `${itemName}, ${destinationName}`;
      
      const response = await fetch(`/api/destinations/geocode?query=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          return data.results[0].geometry.location;
        }
      } else {
        console.warn('Geocoding API response not ok:', response.status);
      }
    } catch (error) {
      console.error('Geocoding failed for:', itemName, error);
    }
    
    // Fallback to destination coordinates
    return destinationData?.destination?.coordinates || mapCenter;
  };

  // Unified function to handle chat item extraction
  const handleChatItemsExtracted = async (items: Array<{name: string, type: string, coordinates?: any}>) => {
    console.log('🔍 Chat items extracted:', items);
    
    // Simply find the items in destinationData and add them as markers
    const newMarkers: MapboxMarker[] = [];
    
    for (const item of items) {
      // Try to find in existing destination data
      let found = null;
      
      if (item.type === 'hotel' && destinationData?.hotels) {
        found = destinationData.hotels.find((h: any) => 
          h.name?.toLowerCase() === item.name.toLowerCase()
        );
      } else if (item.type === 'attraction' && destinationData?.attractions) {
        found = destinationData.attractions.find((a: any) => 
          a.name?.toLowerCase() === item.name.toLowerCase()
        );
      } else if (item.type === 'restaurant' && destinationData?.restaurants) {
        found = destinationData.restaurants.find((r: any) => 
          r.name?.toLowerCase() === item.name.toLowerCase()
        );
      }
      
      if (found) {
        // Use the same marker format as action clicks
        const marker: MapboxMarker = {
          position: found.coordinates || found.location,
          title: found.name,
          type: item.type as any,
          imageUrl: found.imageUrl || found.photos?.[0],
          rating: found.rating,
          description: found.description || found.address || found.vicinity,
          category: found.category,
          source: 'chat'
        };
        
        // For hotels, add price if available
        if (item.type === 'hotel' && found.pricePerNight) {
          marker.pricePerNight = found.pricePerNight;
        }
        
        newMarkers.push(marker);
      }
    }
    
    // Add to map markers using unified function
    if (newMarkers.length > 0) {
      addMarkersToMap(newMarkers);
    }
  };



  const handleLocationClick = async (placeId: string, locationType: 'hotel' | 'attraction' | 'restaurant') => {
    console.log('🔗 Chat item clicked (PlaceID):', placeId, locationType);
    
    // Find the location in destination data using PlaceID
    let location = null;
    let coordinates = null;
    
    if (locationType === 'hotel' && destinationData?.hotels) {
      location = destinationData.hotels.find((hotel: any) => 
        hotel.placeId === placeId || hotel.id === placeId || 
        (hotel.name && placeId.includes(hotel.name.toLowerCase().replace(/\s+/g, '-')))
      );
      if (location) coordinates = location.coordinates;
    } else if (locationType === 'attraction' && destinationData?.attractions) {
      location = destinationData.attractions.find((attraction: any) => 
        attraction.placeId === placeId || attraction.id === placeId ||
        (attraction.name && placeId.includes(attraction.name.toLowerCase().replace(/\s+/g, '-')))
      );
      if (location) coordinates = location.coordinates;
    } else if (locationType === 'restaurant' && destinationData?.restaurants) {
      location = destinationData.restaurants.find((restaurant: any) => 
        restaurant.placeId === placeId || restaurant.id === placeId ||
        (restaurant.name && placeId.includes(restaurant.name.toLowerCase().replace(/\s+/g, '-')))
      );
      if (location) coordinates = location.coordinates;
    }

    // If no coordinates found, try to resolve them
    if (!coordinates && location?.name) {
      coordinates = await resolveCoordinates(location.name, locationType);
    }

    // If we found the full location data, show details
    if (location) {
      // Enrich hotel with LiteAPI booking data if it's a hotel
      if (locationType === 'hotel') {
        try {
          const liteApiResponse = await fetch('/api/liteapi/hotels/munich');
          if (liteApiResponse.ok) {
            const liteApiData = await liteApiResponse.json();
            if (liteApiData.success && liteApiData.hotels.length > 0) {
              // Find matching hotel or use first available
              const matchedHotel = liteApiData.hotels.find((h: any) => 
                h.name && location.name && h.name.toLowerCase().includes(location.name.toLowerCase().split(' ')[0])
              ) || liteApiData.hotels[0];
              
              // Add LiteAPI booking data to location
              location.liteApiData = {
                id: matchedHotel.liteApiId,
                bookable: true,
                commission: matchedHotel.commission,
                rates: [
                  {
                    roomTypeId: 'standard',
                    roomTypeName: 'Standard Doppelzimmer',
                    boardType: 'Nur Übernachtung',
                    pricePerNight: matchedHotel.pricePerNight,
                    cancellationPolicy: 'Kostenlose Stornierung bis 24h vor Anreise',
                    commission: { amount: matchedHotel.commission, percentage: 12 }
                  },
                  {
                    roomTypeId: 'deluxe',
                    roomTypeName: 'Deluxe Zimmer mit Stadtblick',
                    boardType: 'Frühstück inklusive',
                    pricePerNight: matchedHotel.pricePerNight + 50,
                    cancellationPolicy: 'Kostenlose Stornierung bis 24h vor Anreise',
                    commission: { amount: matchedHotel.commission + 8, percentage: 12 }
                  }
                ],
                amenities: ['WiFi', 'Restaurant', 'Fitnessstudio', 'Parkplatz'],
                checkInTime: '15:00',
                checkOutTime: '11:00'
              };
            }
          }
        } catch (error) {
          console.log('LiteAPI enrichment failed for:', location.name);
        }
      }
      
      // Open DetailSidebar with location details
      setSelectedItem(location);
      setIsDetailSidebarOpen(true);
      
      // Highlight the element (only for hotel/attraction types)
      if (locationType === 'hotel' || locationType === 'attraction') {
        onHighlightElement?.(location.name, locationType);
      }
    } else {
      console.log('No location found in destinationData, showing basic view');
      // Show a basic detail view even if no data is found
      const basicItem = {
        id: placeId,
        name: placeId,
        type: locationType,
        description: `Information about ${placeId} is being loaded...`,
        location: {
          address: 'Address information not available'
        }
      };
      console.log('Setting selectedItem (basic):', basicItem);
      setSelectedItem(basicItem);
      console.log('Opening detail sidebar (basic)');
      setIsDetailSidebarOpen(true);
    }
  };

  // Create marker click handler AFTER handleLocationClick is defined
  const handleMarkerClick = (marker: any) => {
    console.log('🚀 MARKER CLICK: Pin clicked, calling handleLocationClick directly:', marker.title, marker.type);
    const placeId = marker.placeId || marker.id || `generated-${marker.title?.toLowerCase().replace(/\s+/g, '-')}`;
    handleLocationClick(placeId, marker.type as 'hotel' | 'attraction' | 'restaurant');
  };

  // Also make handleLocationClick globally available for MapboxMap
  useEffect(() => {
    (window as any).handleLocationClick = handleLocationClick;
    return () => {
      delete (window as any).handleLocationClick;
    };
  }, []);
  

  return (
    <div className="flex h-full bg-white">
      {/* Left side - Main Tabs (Chat/Search/Saved) */}
      <div className="w-2/5 flex flex-col border-r border-gray-200 h-full overflow-hidden">
        <MainTabs
          chatId={chatId}
          destinationData={destinationData}
          onDestinationContext={handleDestinationContext}
          onHighlightElement={onHighlightElement}
          onUnhighlightElement={onUnhighlightElement}
          onLocationClick={handleLocationClick}
          onActionClick={handleActionClick}
          showTabs={showTabs}
          onSearchQuerySent={handleSearchQuerySent}
          onChatCreated={onChatCreated}
          onChatItemsExtracted={handleChatItemsExtracted}
        />
      </div>

      {/* Right side - Map with Header */}
      <motion.div 
        className="w-3/5 relative flex flex-col h-full overflow-hidden"
        initial={hasAnimated ? { x: 0 } : { x: "100%" }}
        animate={{ x: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >

        
        {/* Map Container */}
        <div className="flex-1 relative">
          <MapboxMap
            center={mapCenter}
            markers={mapMarkers}
            zoom={13}
            height="100%"
            highlightedElement={highlightedElement}
            chatId={chatId}
            destinationName={destinationData?.destination?.name}
            onMarkerClick={handleMarkerClick}
          />
          
          {/* Action Icons Overlay */}
          {showActionIcons && destinationData?.destination && (
            <div className="absolute top-4 left-4 z-10">
              <ActionIcons 
                onActionClick={handleActionClick}
              />
            </div>
          )}
        </div>
        
        {/* Detail Sidebar */}
        <DetailSidebar
          isOpen={isDetailSidebarOpen}
          onClose={() => {
            setIsDetailSidebarOpen(false);
            setSelectedItem(null);
          }}
          item={selectedItem}
          chatId={chatId}
          onSaveToFavorites={(item) => {
            console.log('Saved to favorites:', item);
          }}
          onAddToItinerary={(item) => {
            console.log('Added to itinerary:', item);
          }}
        />
      </motion.div>

      {/* Trip Sidebar */}
      <TripSidebar
        isOpen={isTripSidebarOpen}
        onClose={() => setIsTripSidebarOpen(false)}
        chatId={chatId}
        destinationName={destinationData?.destination?.name}
      />

      {/* Mood Selector Sidebar */}
      {isMoodSelectorOpen && (
        <motion.div 
          className="fixed inset-0 z-50 flex"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsMoodSelectorOpen(false)}
          />
          
          {/* Sidebar */}
          <motion.div 
            className="ml-auto w-1/3 bg-white h-full shadow-xl relative overflow-y-auto"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Travel Mood Selector</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMoodSelectorOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </Button>
              </div>
              
              <TravelMoodSelector
                chatId={chatId || 1}
                destination={destinationData?.destination?.name}
                onMoodSelected={(mood) => {
                  console.log('Mood selected:', mood);
                  // Close the sidebar after selection
                  setIsMoodSelectorOpen(false);
                }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}