import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useSidebarManager } from "@/hooks/useSidebarManager";
import { useTripPlanning } from "@/contexts/TripPlanningContext";
import LeftSidebar from "@/components/LeftSidebar";
import ChatOverlay from "@/components/ChatOverlay";
import SplitScreenLayout from "@/components/SplitScreenLayout";
import ChatInterface from "@/components/ChatInterface";
import MapModal from "@/components/MapModal";
import MapboxMap from "@/components/MapboxMap";
import ActionIcons from "@/components/ActionIcons";
import DetailSidebar from "@/components/DetailSidebar";
import TripSidebar from "@/components/TripSidebar";
import TravelMoodSelector from "@/components/TravelMoodSelector";
import MobileLayout from "@/components/MobileLayout";
import MobileMarkerCard from "@/components/MobileMarkerCard";
import MobileDetailOverlay from "@/components/MobileDetailOverlay";
import { WhereOverlay, WhenOverlay, TravelersOverlay, BudgetOverlay } from "@/components/TripPlanningOverlays";
import InvitePanel from "@/components/InvitePanel";
import { getMapMarkersWithMoodFilter } from "@/lib/moodFilters";
import { Route, Users, X, Map, Sparkles, Briefcase, Copy, Share, Link as LinkIcon, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

import type { Chat } from "@shared/schema";

export default function Home() {
  const { i18n, t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedChatId, setSelectedChatId] = useState<number | undefined>();
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [destinationData, setDestinationData] = useState<any>(null);
  const [highlightedElement, setHighlightedElement] = useState<{name: string, type: 'hotel' | 'attraction'} | null>(null);
  
  // Define the highlight functions with correct signatures
  const handleHighlightElement = (item: {name: string, type: 'hotel' | 'attraction'} | null) => {
    setHighlightedElement(item);
  };
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isMapSidebarOpen, setIsMapSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  // Map state
  const [mapMarkers, setMapMarkers] = useState<any[]>([]);
  const [mapCenter, setMapCenter] = useState({ lat: 48.1351, lng: 11.582 }); // Default to Munich
  const [showActionIcons, setShowActionIcons] = useState(false);
  const [isDetailSidebarOpen, setIsDetailSidebarOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const { toggleSidebar: toggleSecondarySidebar, isSidebarOpen } = useSidebarManager();
  const { tripData, loadTripPlan, tripPlanId, setCurrentChatId } = useTripPlanning();
  const [isMoodSelectorOpen, setIsMoodSelectorOpen] = useState(false);
  const [chatMood, setChatMood] = useState<any>(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  // Mobile marker card states
  const [selectedMobileMarker, setSelectedMobileMarker] = useState<any>(null);
  const [showMobileDetailOverlay, setShowMobileDetailOverlay] = useState(false);
  const [showTabs, setShowTabs] = useState(false);
  
  // Trip planning overlays state
  const [showWhereOverlay, setShowWhereOverlay] = useState(false);
  const [showWhenOverlay, setShowWhenOverlay] = useState(false);
  const [showTravelersOverlay, setShowTravelersOverlay] = useState(false);
  const [showBudgetOverlay, setShowBudgetOverlay] = useState(false);
  
  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  // Legacy trip planning data (now using context)
  // These will be removed once fully migrated to context
  
  // Chat overlay state
  const [isChatOverlayOpen, setIsChatOverlayOpen] = useState(false);
  
  const queryClient = useQueryClient();

  // Fetch user's chats
  const { data: chats = [] } = useQuery<Chat[]>({
    queryKey: ["/api/chats"],
    enabled: !!user, // Only fetch if user is authenticated
  });

  // Auto-select first chat if no chat is selected and chats are available
  useEffect(() => {
    if (!selectedChatId && chats.length > 0 && user) {
      setSelectedChatId(chats[0].id);
      setCurrentChatId(chats[0].id);
    }
  }, [chats, selectedChatId, user, setCurrentChatId]);

  const createChatMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/chats", {
        title: "New Trip",
        language: i18n.language,
      });
      return response.json();
    },
    onSuccess: (chat: Chat) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
      setSelectedChatId(chat.id);
      setCurrentChatId(chat.id);
      setDestinationData(null);
    },
  });

  const handleNewChat = () => {
    createChatMutation.mutate();
  };

  const handleChatSelect = async (chatId: number) => {
    setSelectedChatId(chatId);
    setDestinationData(null);
    
    // Set current chat ID in trip planning context immediately
    setCurrentChatId(chatId);
    
    // Load trip plan data for this chat
    await loadTripPlan(chatId);
    
    // Fetch chat details and set language
    try {
      const response = await apiRequest("GET", `/api/chats/${chatId}`);
      if (response.ok) {
        const chat = await response.json();
        if (chat.language && chat.language !== i18n.language) {
          await i18n.changeLanguage(chat.language);
          localStorage.setItem('i18nextLng', chat.language);
          // Force a small delay to ensure translation updates
          setTimeout(() => {
            window.dispatchEvent(new Event('languageChanged'));
          }, 100);
        }
      }
    } catch (error) {
      console.error("Failed to fetch chat details:", error);
    }
  };

  const handleChatCreated = (newChatId: number) => {
    setSelectedChatId(newChatId);
    // Use invalidateQueries instead of refetchQueries to prevent unnecessary API calls
    queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
  };

  const toggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded);
  };

  const handleDestinationContext = (metadata: any) => {
    setDestinationData(metadata);
    
    // Handle AI recommendations for map markers
    if (metadata?.aiRecommendations) {
      console.log('[Home] Processing AI recommendations for map:', metadata.aiRecommendations);
      
      // Convert AI recommendations to map markers with MindTrip-style destination pins
      const allMarkers: any[] = [];
      
      // Group recommendations by location to create central destination pins
      const locationGroups = new Map<string, any>();
      metadata.aiRecommendations.forEach((rec: any) => {
        const key = `${rec.lat.toFixed(3)},${rec.lng.toFixed(3)}`;
        if (!locationGroups.has(key)) {
          locationGroups.set(key, {
            position: { lat: rec.lat, lng: rec.lng },
            name: rec.destination || rec.city || 'Location',
            recommendations: []
          });
        }
        locationGroups.get(key).recommendations.push(rec);
      });
      
      // Create central destination pins and individual POI pins for each location
      locationGroups.forEach((location: any, key: string) => {
        // 1. Add central DESTINATION pin (like MindTrip's city pin)
        if (location.recommendations.length > 1) {
          allMarkers.push({
            position: location.position,
            title: location.name,
            type: 'destination' as const,
            description: `Explore ${location.name} with ${location.recommendations.length} recommendations`,
            isRecommendation: true,
            isCentralPin: true,
            source: 'central_recommendation'
          });
          console.log(`🏙️ MINDTRIP STYLE: Added central destination pin for "${location.name}"`);
        }
        
        // 2. Add individual POI pins
        location.recommendations.forEach((rec: any) => {
          allMarkers.push({
            position: { lat: rec.lat, lng: rec.lng },
            title: rec.name,
            type: rec.type,
            description: rec.description,
            isRecommendation: true,
            source: rec.source,
            mentionContext: rec.mentionContext
          });
        });
      });
      
      // Add to existing markers or create new marker set
      const existingMarkers = mapMarkers.filter((m: any) => !m.isRecommendation);
      setMapMarkers([...existingMarkers, ...allMarkers]);
      console.log(`🗺️ MINDTRIP STYLE: Added ${allMarkers.length} recommendation markers (central + individual)`);
    }
    
    // Automatically open map sidebar when destination data is available (only on desktop)
    if (metadata?.destination && !isMobile) {
      setIsMapSidebarOpen(true);
      // Update map center when destination changes
      if (metadata.destination.coordinates) {
        setMapCenter(metadata.destination.coordinates);
        setShowActionIcons(true);
        if (!hasAnimated) {
          setHasAnimated(true);
        }
        
        // MindTrip-style: Add central destination pin for the main destination
        const centralDestinationPin = {
          position: metadata.destination.coordinates,
          title: metadata.destination.name,
          type: 'destination' as const,
          imageUrl: metadata.destination.imageUrl,
          rating: metadata.destination.rating || 4.5,
          description: `Explore ${metadata.destination.name} - your travel destination`,
          source: 'main_destination',
          isCentralPin: true
        };
        
        // Also fetch the actual city/locality pin from Google Places API
        const fetchCityPin = async () => {
          try {
            const response = await fetch(`/api/destinations/search-city?query=${encodeURIComponent(metadata.destination.name)}`);
            if (response.ok) {
              const cityData = await response.json();
              if (cityData && cityData.location) {
                const cityPin = {
                  position: cityData.location,
                  title: cityData.name || metadata.destination.name,
                  type: 'destination' as const,
                  placeId: cityData.placeId,
                  imageUrl: cityData.photos?.[0] || metadata.destination.imageUrl,
                  rating: cityData.rating || 4.5,
                  description: cityData.description || `${cityData.name} - Stadt und Region`,
                  source: 'google_city_pin',
                  isCentralPin: true,
                  address: cityData.vicinity || cityData.address
                };
                
                setMapMarkers(prevMarkers => {
                  const filtered = prevMarkers.filter(m => (m as any).source !== 'google_city_pin' && (m as any).source !== 'main_destination');
                  return [cityPin, ...filtered];
                });
                console.log(`🏙️ GOOGLE PLACES: Added authentic city pin for "${cityData.name}"`);
              }
            }
          } catch (error) {
            console.warn('Could not fetch authentic city pin, using destination data');
            // Fallback to original central pin
            setMapMarkers(prevMarkers => {
              const nonDestinationMarkers = prevMarkers.filter(m => (m as any).source !== 'main_destination');
              return [centralDestinationPin, ...nonDestinationMarkers];
            });
          }
        };
        
        fetchCityPin();
      }
    } else if (metadata?.destination && isMobile) {
      // On mobile, just update map center and action icons without opening map
      if (metadata.destination.coordinates) {
        setMapCenter(metadata.destination.coordinates);
        setShowActionIcons(true);
        if (!hasAnimated) {
          setHasAnimated(true);
        }
      }
    }
  };

  const handleToggleMap = () => {
    setIsMapModalOpen(!isMapModalOpen);
  };

  // Load chat mood when chat changes
  const handleSearchQuerySent = () => {
    setShowTabs(true);
  };

  const loadChatMood = async (chatId: number) => {
    // Don't load mood for temporary chats
    if (!chatId || chatId <= 0) {
      return;
    }
    
    try {
      const response = await fetch(`/api/chats/${chatId}/mood`);
      if (response.ok) {
        const moodData = await response.json();
        setChatMood(moodData);
      }
    } catch (error) {
      console.error('Error loading chat mood:', error);
    }
  };

  // DISABLED: Mood filtering causing markers to disappear
  const applyMoodFilter = (markers: any[]) => {
    // Always return all markers - no filtering
    return markers;
  };

  const handleActionClick = async (action: string) => {
    if (!destinationData?.destination) return;

    let newMarkers: any[] = [];

    switch (action) {
      case 'hotels':
        try {
          const response = await fetch(`/api/destinations/search-hotels?lat=${mapCenter.lat}&lng=${mapCenter.lng}`);
          if (response.ok) {
            const hotels = await response.json();
            newMarkers = hotels.map((hotel: any) => {
              console.log(`🏨 Hotel: ${hotel.name} - Icon: ${hotel.icon || 'none'} - Color: ${hotel.iconBackgroundColor || 'none'}`);
              return {
                position: hotel.location,
                title: hotel.name,
                type: 'hotel' as const,
                imageUrl: hotel.photos?.[0] || hotel.imageUrl,
                rating: hotel.rating,
                description: hotel.vicinity || hotel.address,
                icon: hotel.icon,
                iconBackgroundColor: hotel.iconBackgroundColor
              };
            });
          } else {
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
          const response = await fetch(`/api/destinations/search-attractions?lat=${mapCenter.lat}&lng=${mapCenter.lng}`);
          if (response.ok) {
            const attractions = await response.json();
            newMarkers = attractions.map((attraction: any) => {
              console.log(`🔍 Attraction: ${attraction.name} - Icon: ${attraction.icon || 'none'} - Color: ${attraction.iconBackgroundColor || 'none'}`);
              return {
                position: attraction.location,
                title: attraction.name,
                type: 'attraction' as const,
                imageUrl: attraction.photos?.[0] || attraction.imageUrl,
                rating: attraction.rating,
                description: attraction.vicinity || attraction.address,
                icon: attraction.icon,
                iconBackgroundColor: attraction.iconBackgroundColor
              };
            });
          } else {
            newMarkers = destinationData.attractions?.map((attraction: any) => ({
              position: attraction.coordinates || mapCenter,
              title: attraction.name,
              type: 'attraction' as const,
              imageUrl: attraction.imageUrl,
              rating: attraction.rating,
              description: attraction.description
            })) || [];
          }
        } catch (error) {
          console.error('Error fetching attractions:', error);
          newMarkers = destinationData.attractions?.map((attraction: any) => ({
            position: attraction.coordinates || mapCenter,
            title: attraction.name,
            type: 'attraction' as const,
            imageUrl: attraction.imageUrl,
            rating: attraction.rating,
            description: attraction.description
          })) || [];
        }
        break;

      case 'restaurants':
        try {
          const response = await fetch(`/api/destinations/search-restaurants?lat=${mapCenter.lat}&lng=${mapCenter.lng}`);
          if (response.ok) {
            const restaurants = await response.json();
            newMarkers = restaurants.map((restaurant: any) => {
              console.log(`🍽️ Restaurant: ${restaurant.name} - Icon: ${restaurant.icon || 'none'} - Color: ${restaurant.iconBackgroundColor || 'none'}`);
              return {
                position: restaurant.location,
                title: restaurant.name,
                type: 'restaurant' as const,
                imageUrl: restaurant.photos?.[0] || restaurant.imageUrl,
                rating: restaurant.rating,
                description: restaurant.vicinity || restaurant.address,
                icon: restaurant.icon,
                iconBackgroundColor: restaurant.iconBackgroundColor
              };
            });
          } else {
            newMarkers = [{ position: mapCenter, title: 'Restaurants in der Nähe', type: 'restaurant' as const }];
          }
        } catch (error) {
          newMarkers = [{ position: mapCenter, title: 'Restaurants in der Nähe', type: 'restaurant' as const }];
        }
        break;

      case 'shopping':
        try {
          const response = await fetch(`/api/destinations/search-shopping?lat=${mapCenter.lat}&lng=${mapCenter.lng}`);
          if (response.ok) {
            const shopping = await response.json();
            newMarkers = shopping.map((place: any) => ({
              position: place.location,
              title: place.name,
              type: 'attraction' as const,
              imageUrl: place.photos?.[0] || place.imageUrl,
              rating: place.rating,
              description: place.vicinity || place.address,
              icon: place.icon,
              iconBackgroundColor: place.iconBackgroundColor
            }));
          } else {
            newMarkers = [{ position: mapCenter, title: 'Shopping in der Nähe', type: 'attraction' as const }];
          }
        } catch (error) {
          console.error('Error fetching shopping:', error);
          newMarkers = [{ position: mapCenter, title: 'Shopping in der Nähe', type: 'attraction' as const }];
        }
        break;

      case 'parks':
        try {
          const response = await fetch(`/api/destinations/search-parks?lat=${mapCenter.lat}&lng=${mapCenter.lng}`);
          if (response.ok) {
            const parks = await response.json();
            newMarkers = parks.map((place: any) => ({
              position: place.location,
              title: place.name,
              type: 'attraction' as const,
              imageUrl: place.photos?.[0] || place.imageUrl,
              rating: place.rating,
              description: place.vicinity || place.address,
              icon: place.icon,
              iconBackgroundColor: place.iconBackgroundColor
            }));
          } else {
            newMarkers = [{ position: mapCenter, title: 'Parks in der Nähe', type: 'attraction' as const }];
          }
        } catch (error) {
          console.error('Error fetching parks:', error);
          newMarkers = [{ position: mapCenter, title: 'Parks in der Nähe', type: 'attraction' as const }];
        }
        break;

      case 'cafes':
        try {
          const response = await fetch(`/api/destinations/search-cafes?lat=${mapCenter.lat}&lng=${mapCenter.lng}`);
          if (response.ok) {
            const cafes = await response.json();
            newMarkers = cafes.map((place: any) => ({
              position: place.location,
              title: place.name,
              type: 'restaurant' as const,
              imageUrl: place.photos?.[0] || place.imageUrl,
              rating: place.rating,
              description: place.vicinity || place.address,
              icon: place.icon,
              iconBackgroundColor: place.iconBackgroundColor
            }));
          } else {
            newMarkers = [{ position: mapCenter, title: 'Cafés in der Nähe', type: 'restaurant' as const }];
          }
        } catch (error) {
          console.error('Error fetching cafes:', error);
          newMarkers = [{ position: mapCenter, title: 'Cafés in der Nähe', type: 'restaurant' as const }];
        }
        break;

      case 'transport':
        try {
          const response = await fetch(`/api/destinations/search-transport?lat=${mapCenter.lat}&lng=${mapCenter.lng}`);
          if (response.ok) {
            const transport = await response.json();
            newMarkers = transport.map((place: any) => ({
              position: place.location,
              title: place.name,
              type: 'attraction' as const,
              imageUrl: place.photos?.[0] || place.imageUrl,
              rating: place.rating,
              description: place.vicinity || place.address,
              icon: place.icon,
              iconBackgroundColor: place.iconBackgroundColor
            }));
          } else {
            newMarkers = [{ position: mapCenter, title: 'Transport in der Nähe', type: 'attraction' as const }];
          }
        } catch (error) {
          console.error('Error fetching transport:', error);
          newMarkers = [{ position: mapCenter, title: 'Transport in der Nähe', type: 'attraction' as const }];
        }
        break;

      case 'nearby':
        // For 'nearby', show all available categories
        try {
          const [hotelsResponse, attractionsResponse, restaurantsResponse] = await Promise.all([
            fetch(`/api/destinations/search-hotels?lat=${mapCenter.lat}&lng=${mapCenter.lng}`),
            fetch(`/api/destinations/search-attractions?lat=${mapCenter.lat}&lng=${mapCenter.lng}`),
            fetch(`/api/destinations/search-restaurants?lat=${mapCenter.lat}&lng=${mapCenter.lng}`)
          ]);

          const markersFromAllCategories = [];

          if (hotelsResponse.ok) {
            const hotels = await hotelsResponse.json();
            markersFromAllCategories.push(...hotels.map((hotel: any) => ({
              position: hotel.location,
              title: hotel.name,
              type: 'hotel' as const,
              imageUrl: hotel.photos?.[0] || hotel.imageUrl,
              rating: hotel.rating,
              description: hotel.vicinity || hotel.address,
              icon: hotel.icon,
              iconBackgroundColor: hotel.iconBackgroundColor
            })));
          }

          if (attractionsResponse.ok) {
            const attractions = await attractionsResponse.json();
            markersFromAllCategories.push(...attractions.map((attraction: any) => ({
              position: attraction.location,
              title: attraction.name,
              type: 'attraction' as const,
              imageUrl: attraction.photos?.[0] || attraction.imageUrl,
              rating: attraction.rating,
              description: attraction.vicinity || attraction.address,
              icon: attraction.icon,
              iconBackgroundColor: attraction.iconBackgroundColor
            })));
          }

          if (restaurantsResponse.ok) {
            const restaurants = await restaurantsResponse.json();
            markersFromAllCategories.push(...restaurants.map((restaurant: any) => ({
              position: restaurant.location,
              title: restaurant.name,
              type: 'restaurant' as const,
              imageUrl: restaurant.photos?.[0] || restaurant.imageUrl,
              rating: restaurant.rating,
              description: restaurant.vicinity || restaurant.address,
              icon: restaurant.icon,
              iconBackgroundColor: restaurant.iconBackgroundColor
            })));
          }

          newMarkers = markersFromAllCategories;
        } catch (error) {
          console.error('Error fetching nearby data:', error);
          // Fallback to destination data
          newMarkers = [
            ...(destinationData.hotels?.map((hotel: any) => ({
              position: hotel.coordinates || mapCenter,
              title: hotel.name,
              type: 'hotel' as const,
              imageUrl: hotel.imageUrl,
              rating: hotel.rating,
              description: hotel.description
            })) || []),
            ...(destinationData.attractions?.map((attraction: any) => ({
              position: attraction.coordinates || mapCenter,
              title: attraction.name,
              type: 'attraction' as const,
              imageUrl: attraction.imageUrl,
              rating: attraction.rating,
              description: attraction.description
            })) || [])
          ];
        }
        break;
    }

    // Replace markers instead of adding to them (exclusive filtering)
    console.log(`🔄 FILTER DEBUG: Action "${action}" - Setting ${newMarkers.length} markers`);
    console.log('🔄 FILTER DEBUG: Previous markers count:', mapMarkers.length);
    setMapMarkers(applyMoodFilter(newMarkers));
    console.log('🔄 FILTER DEBUG: New markers set, should be visible on map');
  };

  const handleLocationClick = async (locationName: string, locationType: 'hotel' | 'attraction') => {
    let location = null;
    
    if (locationType === 'hotel' && destinationData?.hotels) {
      const foundHotel = destinationData.hotels.find((hotel: any) => 
        hotel.name.toLowerCase().includes(locationName.toLowerCase()) ||
        locationName.toLowerCase().includes(hotel.name.toLowerCase())
      );
      if (foundHotel) {
        location = foundHotel;
      }
    } else if (locationType === 'attraction' && destinationData?.attractions) {
      const foundAttraction = destinationData.attractions.find((attraction: any) => 
        attraction.name.toLowerCase().includes(locationName.toLowerCase()) ||
        locationName.toLowerCase().includes(attraction.name.toLowerCase())
      );
      if (foundAttraction) {
        location = foundAttraction;
      }
    }

    if (location) {
      setSelectedItem(location);
      setIsDetailSidebarOpen(true);
      
      // DON'T change map center to avoid marker reloading
      // Keep all markers visible for smooth browsing between pins
    }
  };

  const handleMarkerClick = (marker: any) => {
    console.log('🚀 MARKER CLICK: Pin clicked:', marker.title, marker.type);
    
    if (isMobile) {
      // On mobile, show the bottom card
      setSelectedMobileMarker(marker);
      // Don't change map center to avoid marker reload
    } else {
      // On desktop, use the detail sidebar
      handleLocationClick(marker.title, marker.type as 'hotel' | 'attraction');
    }
    
    // Clear any highlighted element that might interfere
    setHighlightedElement(null);
    
    // Debug: Log current map state
    console.log('🚀 MARKER CLICK DEBUG: Current mapMarkers count:', mapMarkers.length);
    console.log('🚀 MARKER CLICK DEBUG: Clicked marker:', marker.title, marker.type);
  };

  const handleMobileMarkerCardClose = () => {
    setSelectedMobileMarker(null);
  };

  const handleMobileMarkerCardFullView = () => {
    setShowMobileDetailOverlay(true);
  };

  const handleMobileDetailOverlayClose = () => {
    setShowMobileDetailOverlay(false);
  };

  const toggleChatOverlay = () => {
    setIsChatOverlayOpen(!isChatOverlayOpen);
  };



  // Fetch dynamic trip image from Unsplash
  const getTripImage = () => {
    const location = tripData.location || destinationData?.destination?.name || 'travel';
    const sanitizedLocation = location.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    return `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D`;
    // Alternative: Use Unsplash Source API for location-specific images
    // return `https://source.unsplash.com/800x400/?${sanitizedLocation},travel`;
  };



  // Mobile detection
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Set English as fallback if detected language is not supported
  useEffect(() => {
    const supportedLanguages = ['en', 'de', 'es', 'fr'];
    const currentLang = i18n.language;
    
    if (!supportedLanguages.includes(currentLang)) {
      i18n.changeLanguage('en');
      localStorage.setItem('i18nextLng', 'en');
    }
  }, []);

  // Create temporary chat ID for first interaction (don't save to DB yet)
  useEffect(() => {
    if (!selectedChatId && !createChatMutation.isPending) {
      // Use a temporary ID that indicates this chat isn't saved yet
      setSelectedChatId(-1); // -1 indicates temporary/unsaved chat
    }
  }, []);

  // Load chat mood when selected chat changes (but not for temporary chats)
  useEffect(() => {
    if (selectedChatId && selectedChatId > 0) {
      loadChatMood(selectedChatId);
    }
  }, [selectedChatId]);

  // Render mobile layout
  if (isMobile) {
    return (
      <div className="h-screen overflow-hidden bg-background">
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isSidebarExpanded && (
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed inset-0 z-50 flex"
            >
              <div className="w-72 bg-background border-r border-border">
                <LeftSidebar
                  onNewChat={handleNewChat}
                  onChatSelect={handleChatSelect}
                  selectedChatId={selectedChatId}
                  isCollapsed={false}
                  onChatOverlayToggle={toggleChatOverlay}
                  isChatOverlayOpen={isChatOverlayOpen}
                />
              </div>
              <div 
                className="flex-1 bg-black/20" 
                onClick={() => setIsSidebarExpanded(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <MobileLayout
          chatId={selectedChatId}
          destinationData={destinationData}
          onDestinationContext={handleDestinationContext}
          onHighlightElement={(name: string, type: 'hotel' | 'attraction') => handleHighlightElement({name, type})}
          onUnhighlightElement={() => setHighlightedElement(null)}
          mapMarkers={mapMarkers}
          mapCenter={mapCenter}
          showActionIcons={showActionIcons}
          onActionClick={handleActionClick}
          onLocationClick={handleLocationClick}
          onMarkerClick={handleMarkerClick}
          onNewChat={handleNewChat}
          onMenuClick={toggleSidebar}
          showTabs={showTabs}
          onSearchQuerySent={handleSearchQuerySent}
          onChatCreated={handleChatCreated}
        />

        {/* Mobile Marker Card */}
        <MobileMarkerCard
          marker={selectedMobileMarker}
          isVisible={!!selectedMobileMarker && !showMobileDetailOverlay}
          onClose={handleMobileMarkerCardClose}
          onFullView={handleMobileMarkerCardFullView}
        />

        {/* Mobile Detail Overlay */}
        <MobileDetailOverlay
          marker={selectedMobileMarker}
          isVisible={showMobileDetailOverlay}
          onClose={handleMobileDetailOverlayClose}
          onSaveToFavorites={(item) => {
            console.log('Saved to favorites:', item);
          }}
          onAddToItinerary={(item) => {
            console.log('Added to itinerary:', item);
          }}
        />

        {/* Chat Overlay */}
        <ChatOverlay
          isOpen={isChatOverlayOpen}
          onClose={() => setIsChatOverlayOpen(false)}
          onNewChat={handleNewChat}
          onChatSelect={handleChatSelect}
          selectedChatId={selectedChatId}
        />
      </div>
    );
  }

  // Render desktop layout
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Collapsible Sidebar */}
      <div className={`${isSidebarExpanded ? 'w-72' : 'w-16'} transition-all duration-300 overflow-hidden`}>
        <LeftSidebar
          onNewChat={handleNewChat}
          onChatSelect={handleChatSelect}
          selectedChatId={selectedChatId}
          isCollapsed={!isSidebarExpanded}
          onExpand={toggleSidebar}
          onCollapse={toggleSidebar}
          onChatOverlayToggle={toggleChatOverlay}
          isChatOverlayOpen={isChatOverlayOpen}
        />
      </div>
      
      <div className="flex-1 flex flex-col">
        {/* Top Navigation Bar */}
        <div className="h-14 border-b border-gray-100 flex items-center justify-between px-6 bg-white">
          <div className="flex items-center space-x-6">
            <span className="font-medium text-gray-900">{t("newChat")}</span>
          </div>

          <div className="flex items-center rounded-full border border-gray-200/60 overflow-hidden bg-transparent">
            <button
              onClick={() => setShowWhereOverlay(true)}
              className="px-4 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50/50 transition-all duration-200 border-r border-gray-200/60 last:border-r-0"
            >
              {tripData.location || t("where")}
            </button>
            <button
              onClick={() => setShowWhenOverlay(true)}
              className="px-4 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50/50 transition-all duration-200 border-r border-gray-200/60 last:border-r-0"
            >
              {tripData.startDate && tripData.endDate 
                ? `${tripData.startDate.toLocaleDateString()} - ${tripData.endDate.toLocaleDateString()}`
                : t("when")}
            </button>
            <button
              onClick={() => setShowTravelersOverlay(true)}
              className="px-4 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50/50 transition-all duration-200 border-r border-gray-200/60 last:border-r-0"
            >
              {tripData.travelers} {t("travelers")}
            </button>
            <button
              onClick={() => setShowBudgetOverlay(true)}
              className="px-4 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50/50 transition-all duration-200"
            >
              {tripData.budget}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-sm border-gray-200 text-gray-600 hover:text-gray-800 hover:border-gray-300"
              onClick={() => setShowInviteModal(true)}
            >
              {t("invite")}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-sm border-gray-200 text-gray-600 hover:text-gray-800 hover:border-gray-300"
              onClick={() => toggleSecondarySidebar('trip', { 
                chatId: selectedChatId, 
                destinationName: destinationData?.destination?.name 
              })}
            >
              <Briefcase className="w-4 h-4 mr-2" />
              Trip
            </Button>
          </div>
        </div>

        {/* Main Content - Always Split Layout */}
        <div className="flex-1 overflow-hidden relative">
          <SplitScreenLayout
            chatId={selectedChatId}
            destinationData={destinationData}
            highlightedElement={highlightedElement}
            onHighlightElement={(name: string, type: 'hotel' | 'attraction') => handleHighlightElement({name, type})}
            onUnhighlightElement={() => setHighlightedElement(null)}
            onDestinationContext={handleDestinationContext}
            onChatCreated={handleChatCreated}
          />
        </div>
      </div>
      
      <MapModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        destination={destinationData?.destination?.name}
        destinationData={destinationData}
        highlightedElement={highlightedElement}
        chatId={selectedChatId}
      />

      {/* Trip Planning Overlays */}
      <WhereOverlay
        isOpen={showWhereOverlay}
        onClose={() => setShowWhereOverlay(false)}
      />

      <WhenOverlay
        isOpen={showWhenOverlay}
        onClose={() => setShowWhenOverlay(false)}
      />

      <TravelersOverlay
        isOpen={showTravelersOverlay}
        onClose={() => setShowTravelersOverlay(false)}
      />

      <BudgetOverlay
        isOpen={showBudgetOverlay}
        onClose={() => setShowBudgetOverlay(false)}
      />

      {/* Advanced Invite Panel */}
      <InvitePanel
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        tripTitle={tripData.location || destinationData?.destination?.name || 'Your Amazing Trip'}
        tripDuration={tripData.startDate && tripData.endDate 
          ? `${Math.ceil((tripData.endDate.getTime() - tripData.startDate.getTime()) / (1000 * 60 * 60 * 24))} days`
          : '5 days'}
        tripImage={destinationData?.image || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=200&fit=crop'}
        tripPlanId={tripPlanId}
      />

      {/* Trip Sidebar */}
      <TripSidebar
        isOpen={isSidebarOpen('trip')}
        onClose={() => toggleSecondarySidebar('trip')}
        chatId={selectedChatId}
        destinationName={destinationData?.destination?.name}
      />

      {/* Chat Overlay */}
      <ChatOverlay
        isOpen={isChatOverlayOpen}
        onClose={() => setIsChatOverlayOpen(false)}
        onNewChat={handleNewChat}
        onChatSelect={handleChatSelect}
        selectedChatId={selectedChatId}
        isSidebarExpanded={isSidebarExpanded}
      />
    </div>
  );
}
