import { useState, useEffect } from "react";
import { X, Star, Heart, Plus, MapPin, Clock, Phone, Globe, Camera, Eye, Users, Trophy, Award, DollarSign, Shield, Check, Utensils, Euro, Calendar, Bed, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
// Removed motion and AnimatePresence for instant performance
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useFavorites } from "@/hooks/useFavorites";
import { HotelBookingWidget } from "@/components/HotelBookingWidget";

interface TripAdvisorReview {
  id: string;
  rating: number;
  title: string;
  text: string;
  publishedDate: string;
  user?: {
    username: string;
    userLocation?: string;
  };
}

interface TripAdvisorPhoto {
  id: string;
  caption?: string;
  images: {
    thumbnail?: string;
    small?: string;
    medium?: string;
    large?: string;
  };
}

interface TripAdvisorData {
  locationId?: string;
  rating?: number;
  numReviews?: number;
  reviews?: TripAdvisorReview[];
  photos?: TripAdvisorPhoto[];
  awards?: string[];
  amenities?: string[];
  cuisine?: string[];
  priceLevel?: string;
  rankingData?: {
    ranking: number;
    rankingString: string;
  };
}

interface DetailItem {
  id: string;
  name: string;
  type: 'hotel' | 'attraction' | 'restaurant';
  description?: string;
  images?: string[];
  imageUrl?: string;
  rating?: number;
  location?: {
    address?: string;
    coordinates?: { lat: number; lng: number };
  };
  contact?: {
    phone?: string;
    website?: string;
  };
  tripAdvisor?: TripAdvisorData;
  liteApiData?: {
    id: string;
    bookable: boolean;
    commission: number;
    rates: Array<{
      roomTypeId: string;
      roomTypeName: string;
      boardType: string;
      pricePerNight: number;
      cancellationPolicy: string;
      commission?: { amount: number; percentage: number };
    }>;
    amenities?: string[];
    checkInTime?: string;
    checkOutTime?: string;
  };
}

interface NearbyItem {
  id: string;
  name: string;
  type: 'hotel' | 'attraction' | 'restaurant';
  imageUrl?: string;
  rating?: number;
  category?: string;
  distance?: string;
  priceInfo?: string;
}

interface DetailSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  item: DetailItem | null;
  nearbyItems?: {
    hotels?: NearbyItem[];
    attractions?: NearbyItem[];
    restaurants?: NearbyItem[];
  };
  onSaveToFavorites?: (item: DetailItem) => void;
  onAddToItinerary?: (item: DetailItem) => void;
  chatId?: number;
}

// Function to generate typical questions based on location type
function getTypicalQuestions(type: string, name: string) {
  const baseQuestions = {
    hotel: [
      { question: "Was ist die beste Zeit für einen Besuch?", answer: "Die beste Reisezeit hängt von der Saison und Ihren Aktivitäten ab. Generell sind Frühling und Herbst ideal." },
      { question: "Sind Haustiere erlaubt?", answer: "Bitte kontaktieren Sie das Hotel direkt für Informationen zur Haustierpolitik." },
      { question: "Gibt es Parkplätze?", answer: "Die meisten Hotels bieten Parkplätze. Verfügbarkeit und Kosten variieren je nach Standort." },
      { question: "Wie weit ist es zum Zentrum?", answer: "Die Entfernung zum Stadtzentrum hängt vom spezifischen Standort ab. Prüfen Sie die Lage auf der Karte." }
    ],
    attraction: [
      { question: "Wie lange dauert ein Besuch?", answer: "Planen Sie 2-3 Stunden für einen ausführlichen Besuch ein, abhängig von Ihrem Interesse." },
      { question: "Gibt es Führungen?", answer: "Viele Sehenswürdigkeiten bieten Führungen an. Informieren Sie sich vor Ort oder online." },
      { question: "Ist es für Kinder geeignet?", answer: "Die meisten Attraktionen sind familienfreundlich. Prüfen Sie spezifische Altersempfehlungen." },
      { question: "Welche Öffnungszeiten gelten?", answer: "Öffnungszeiten variieren saisonal. Prüfen Sie die aktuellen Zeiten vor Ihrem Besuch." }
    ],
    restaurant: [
      { question: "Ist eine Reservierung nötig?", answer: "Für beliebte Restaurants empfehlen wir eine Reservierung, besonders am Wochenende." },
      { question: "Gibt es vegetarische Optionen?", answer: "Die meisten modernen Restaurants bieten vegetarische und vegane Optionen." },
      { question: "Wie sind die Preise?", answer: "Die Preise variieren je nach Restaurant und Gericht. Prüfen Sie die Menüpreise vor Ort." },
      { question: "Ist es kinderfreundlich?", answer: "Viele Restaurants heißen Familien willkommen und bieten Kindermenüs an." }
    ]
  };
  
  return baseQuestions[type] || baseQuestions.attraction;
}

export default function DetailSidebar({
  isOpen,
  onClose,
  item,
  nearbyItems,
  onSaveToFavorites,
  onAddToItinerary,
  chatId
}: DetailSidebarProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [enrichedItem, setEnrichedItem] = useState<DetailItem | null>(null);
  const [allImages, setAllImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { toggleFavorite, isFavorited } = useFavorites();

  // Fetch enhanced data including TripAdvisor data only
  useEffect(() => {
    if (!item || !isOpen) {
      setEnrichedItem(null);
      setAllImages([]);
      return;
    }

    const fetchEnhancedData = async () => {
      try {
        // Pass all available cached data to avoid unnecessary API calls
        const params = new URLSearchParams();
        if (item.location?.coordinates) {
          params.append('lat', item.location.coordinates.lat.toString());
          params.append('lng', item.location.coordinates.lng.toString());
        }
        if (item.location?.address) {
          params.append('address', item.location.address);
        }
        if (item.rating) {
          params.append('rating', item.rating.toString());
        }
        if (item.images && item.images.length > 0) {
          params.append('photos', encodeURIComponent(JSON.stringify(item.images)));
        }
        if (item.id) {
          params.append('placeId', item.id);
        }
        
        setIsLoadingImages(true);
        const response = await fetch(`/api/locations/${encodeURIComponent(item.name)}/details?${params}`);
        let enhancedData = {};
        
        if (response.ok) {
          enhancedData = await response.json();
        }
        
        // Combine images from existing data and TripAdvisor only
        const existingImages = item.images || (item.imageUrl ? [item.imageUrl] : []);
        const tripAdvisorImages = enhancedData.tripAdvisor?.photos?.map(photo => 
          photo.images?.large?.url || photo.images?.medium?.url || photo.images?.small?.url
        ).filter(Boolean) || [];
        
        const combinedImages = [...existingImages, ...tripAdvisorImages].filter(Boolean);
        setAllImages(combinedImages);
        setCurrentImageIndex(0);
        setIsLoadingImages(false);
        
        // Merge enhanced data with original item
        const enhanced = {
          ...item,
          tripAdvisor: enhancedData.tripAdvisor,
          description: enhancedData.description || item.description,
          contact: enhancedData.contact || item.contact,
          hours: enhancedData.hours,
          imageUrl: combinedImages[0] || item.imageUrl,
          images: combinedImages
        };
        
        setEnrichedItem(enhanced);
      } catch (error) {
        console.log('Enhanced data fetch failed, using basic data:', error);
        setEnrichedItem(item);
        setAllImages(item.images || (item.imageUrl ? [item.imageUrl] : []));
        setIsLoadingImages(false);
      }
    };

    fetchEnhancedData();
  }, [item, isOpen]);

  // Use enriched item for display
  const displayItem = enrichedItem || item;



  const addToItineraryMutation = useMutation({
    mutationFn: async (data: { chatId: number; itemName: string; itemType: string; day: number }) => {
      const response = await apiRequest('POST', `/api/chats/${data.chatId}/itinerary`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chats', chatId, 'itinerary'] });
    },
  });

  // LiteAPI External Checkout
  const externalCheckoutMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      const response = await apiRequest('POST', '/api/liteapi/checkout-url', bookingData);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.checkoutUrl) {
        toast({
          title: "Weiterleitung zu LiteAPI",
          description: "Sie werden zur sicheren Buchungsseite weitergeleitet.",
        });

        window.open(data.checkoutUrl, '_blank');
      }
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Checkout konnte nicht gestartet werden.",
        variant: "destructive"
      });
    },
  });

  // LiteAPI Direct Booking
  const directBookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      const response = await apiRequest('POST', '/api/liteapi/direct-booking', bookingData);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Buchung erfolgreich!",
          description: `Buchungsnummer: ${data.booking.confirmation_number}. Provision: €${data.booking.commission?.amount || 0}`,
        });
      }
    },
    onError: () => {
      toast({
        title: "Buchungsfehler",
        description: "Die direkte Buchung konnte nicht verarbeitet werden.",
        variant: "destructive"
      });
    },
  });

  const handleSaveToFavorites = async () => {
    if (!displayItem) return;

    try {
      // Ensure placeId is always a string - use Google PlaceID or generate from name
      const placeId = displayItem.placeId || displayItem.id || `generated-${displayItem.name?.toLowerCase().replace(/\s+/g, '-')}`;
      
      // Use the exact same format as the MapboxMap component
      await toggleFavorite({
        itemType: displayItem.type || 'attraction',
        placeId: placeId,
        itemName: displayItem.name,
        itemData: {
          ...displayItem,
          id: placeId, // Ensure consistency 
          placeId: placeId, // Ensure placeId is stored
          name: displayItem.name, // Map title to name for SavedPage compatibility
          address: displayItem.description || displayItem.location?.address || displayItem.vicinity || '', // Map description/vicinity to address
          savedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleAddToItinerary = () => {
    if (!displayItem || !chatId) return;

    addToItineraryMutation.mutate({
      chatId,
      itemName: displayItem.name,
      itemType: displayItem.type,
      day: 1 // Default to day 1 for now
    });
  };

  const handleExternalCheckout = () => {
    if (!displayItem?.liteApiData) return;

    externalCheckoutMutation.mutate({
      hotelId: displayItem.liteApiData.id,
      checkIn: '2025-08-01',
      checkOut: '2025-08-03',
      guests: { adults: 2 },
      rooms: 1
    });
  };

  const handleDirectBooking = () => {
    if (!displayItem?.liteApiData) return;

    directBookingMutation.mutate({
      hotelId: displayItem.liteApiData.id,
      rateId: 'standard',
      checkIn: '2025-08-01',
      checkOut: '2025-08-03',
      guests: { adults: 2 },
      guestDetails: [{
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com'
      }],
      paymentMethod: 'credit_card'
    });
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />);
    }

    if (hasHalfStar) {
      stars.push(<Star key="half" className="h-3 w-3 fill-yellow-400/50 text-yellow-400" />);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-3 w-3 text-gray-300" />);
    }

    return stars;
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'hotel': return 'Hotel';
      case 'attraction': return 'Sehenswürdigkeit';
      case 'restaurant': return 'Restaurant';
      default: return type;
    }
  };

  if (!isOpen || !displayItem) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-1/3 bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-white">
          <h2 className="text-lg font-semibold text-gray-900 truncate pr-4">
            {displayItem.name}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Image Gallery */}
        {allImages.length > 0 && (
          <div className="relative h-48 bg-gray-100 overflow-hidden">
            <img
              src={allImages[currentImageIndex]}
              alt={`${displayItem.name} - Bild ${currentImageIndex + 1}`}
              className="w-full h-full object-cover"
            />
            
            {/* Navigation arrows */}
            {allImages.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImageIndex(prev => prev === 0 ? allImages.length - 1 : prev - 1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCurrentImageIndex(prev => prev === allImages.length - 1 ? 0 : prev + 1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-all"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
            
            {/* Image counter */}
            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
              {currentImageIndex + 1} / {allImages.length}
            </div>
            
            {/* Loading overlay */}
            {isLoadingImages && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <div className="text-white text-sm">Lade Bilder...</div>
              </div>
            )}
          </div>
        )}

        {/* Image Thumbnails Grid */}
        {allImages.length > 1 && (
          <div className="px-4 py-2 border-b">
            <div className="flex space-x-2 overflow-x-auto">
              {allImages.slice(0, 6).map((imageUrl, index) => (
                <div
                  key={index}
                  className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden cursor-pointer transition-all ${
                    index === currentImageIndex ? 'ring-2 ring-blue-500' : 'opacity-70 hover:opacity-100'
                  }`}
                  onClick={() => setCurrentImageIndex(index)}
                >
                  <img
                    src={imageUrl}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {index === currentImageIndex && (
                    <div className="absolute inset-0 bg-blue-500/20" />
                  )}
                </div>
              ))}
              {allImages.length > 6 && (
                <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-500">
                  +{allImages.length - 6}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Info & Actions */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              {displayItem.rating && (
                <div className="flex items-center space-x-1">
                  <div className="flex">{renderStars(displayItem.rating)}</div>
                  <span className="text-sm font-medium">{displayItem.rating}</span>
                </div>
              )}
              <Badge variant="secondary">{getTypeLabel(displayItem.type)}</Badge>
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant={displayItem?.id && isFavorited(displayItem.id) ? "default" : "outline"}
                onClick={handleSaveToFavorites}
                className="flex items-center space-x-1"
              >
                <Heart className={`h-4 w-4 ${displayItem?.placeId && isFavorited(displayItem.placeId) ? 'fill-current text-red-500' : ''}`} />
                <span className="text-xs">
                  {displayItem?.placeId && isFavorited(displayItem.placeId) ? 'Gespeichert' : 'Speichern'}
                </span>
              </Button>
              {chatId && (
                <Button
                  size="sm"
                  variant={addToItineraryMutation.isSuccess ? "default" : "outline"}
                  onClick={handleAddToItinerary}
                  className="flex items-center space-x-1"
                  disabled={addToItineraryMutation.isPending}
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-xs">
                    {addToItineraryMutation.isPending ? 'Adding...' : addToItineraryMutation.isSuccess ? 'Added!' : 'Add to Trip'}
                  </span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="border-b">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Übersicht</TabsTrigger>
                <TabsTrigger value="reviews">Bewertungen</TabsTrigger>
                <TabsTrigger value="nearby">In der Nähe</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4">
                  <TabsContent value="overview" className="space-y-4 mt-0">
                    {/* Hotel Booking Widget - Show for hotels */}
                    {displayItem.type === 'hotel' && displayItem.liteApiData?.bookable && (
                      <div>
                        <HotelBookingWidget
                          hotel={{
                            id: displayItem.id,
                            name: displayItem.name,
                            description: displayItem.description || "",
                            rating: displayItem.rating || 0,
                            pricePerNight: displayItem.liteApiData.rates?.[0]?.pricePerNight || 0,
                            imageUrl: displayItem.imageUrl || displayItem.images?.[0] || null,
                            coordinates: displayItem.location?.coordinates || { lat: 0, lng: 0 },
                            amenities: displayItem.liteApiData.amenities || [],
                            liteApiId: displayItem.liteApiData.id,
                            bookable: displayItem.liteApiData.bookable,
                            commission: displayItem.liteApiData.commission,
                            liteApiData: {
                              id: displayItem.liteApiData.id,
                              rates: displayItem.liteApiData.rates,
                              amenities: displayItem.liteApiData.amenities || [],
                              checkInTime: displayItem.liteApiData.checkInTime || "15:00",
                              checkOutTime: displayItem.liteApiData.checkOutTime || "11:00"
                            }
                          }}
                          checkIn="2025-08-01"
                          checkOut="2025-08-03"
                          guests={{ adults: 2 }}
                          onBookingRequest={(bookingData) => {
                            console.log('Booking request from sidebar:', bookingData);
                            // Handle booking request
                          }}
                        />
                      </div>
                    )}

                    {/* Enhanced Description Section */}
                    {displayItem.description && (
                      <div>
                        <h3 className="font-semibold mb-2">Beschreibung</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">{displayItem.description}</p>
                      </div>
                    )}

                    {/* TripAdvisor Awards and Recognition */}
                    {displayItem.tripAdvisor?.awards && displayItem.tripAdvisor.awards.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">Auszeichnungen & Anerkennung</h3>
                        <div className="space-y-2">
                          {displayItem.tripAdvisor.awards.map((award, index) => (
                            <div key={index} className="flex items-center space-x-2 p-2 bg-yellow-50 rounded-lg">
                              <Award className="h-4 w-4 text-yellow-600" />
                              <div>
                                <p className="text-sm font-medium">{award.display_name}</p>
                                <p className="text-xs text-gray-500">{award.year}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Cuisine Information for Restaurants */}
                    {displayItem.tripAdvisor?.cuisine && displayItem.tripAdvisor.cuisine.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">Küche</h3>
                        <div className="flex flex-wrap gap-2">
                          {displayItem.tripAdvisor.cuisine.map((cuisine, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {cuisine.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Amenities for Hotels */}
                    {displayItem.tripAdvisor?.amenities && displayItem.tripAdvisor.amenities.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">Ausstattung</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {displayItem.tripAdvisor.amenities.slice(0, 6).map((amenity, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <Check className="h-3 w-3 text-green-600" />
                              <span className="text-sm">{amenity.name}</span>
                            </div>
                          ))}
                          {displayItem.tripAdvisor.amenities.length > 6 && (
                            <div className="text-sm text-gray-500">
                              +{displayItem.tripAdvisor.amenities.length - 6} weitere
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Price Level */}
                    {displayItem.tripAdvisor?.priceLevel && (
                      <div>
                        <h3 className="font-semibold mb-2">Preisklasse</h3>
                        <div className="flex items-center space-x-2">
                          <Euro className="h-4 w-4 text-gray-500" />
                          <div className="flex">
                            {Array.from({ length: 4 }, (_, i) => (
                              <Euro 
                                key={i} 
                                className={`h-4 w-4 ${i < parseInt(displayItem.tripAdvisor.priceLevel) ? 'text-green-600' : 'text-gray-300'}`} 
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* FAQ Section moved from Reviews */}
                    <div>
                      <h3 className="font-semibold mb-2">Häufig gestellte Fragen</h3>
                      <div className="space-y-2">
                        {getTypicalQuestions(displayItem.type, displayItem.name).map((question, index) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-lg">
                            <h5 className="font-medium text-sm text-gray-900 mb-1">{question.question}</h5>
                            <p className="text-sm text-gray-600">{question.answer}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Contact Information */}
                    {(displayItem.location?.address || displayItem.contact?.phone || displayItem.contact?.website) && (
                      <div className="space-y-2">
                        <h3 className="font-semibold">Kontakt & Lage</h3>

                        {displayItem.location?.address && (
                          <div className="flex items-start space-x-2">
                            <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Adresse</p>
                              <p className="text-sm text-gray-600">{displayItem.location.address}</p>
                            </div>
                          </div>
                        )}

                        {displayItem.contact?.phone && (
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium">Telefon</p>
                              <p className="text-sm text-gray-600">{displayItem.contact.phone}</p>
                            </div>
                          </div>
                        )}

                        {displayItem.contact?.website && (
                          <div className="flex items-center space-x-2">
                            <Globe className="h-4 w-4 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium">Website</p>
                              <a
                                href={displayItem.contact.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline"
                              >
                                {displayItem.contact.website}
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="reviews" className="space-y-4 mt-0">
                    {displayItem.tripAdvisor?.reviews && displayItem.tripAdvisor.reviews.length > 0 ? (
                      <div className="space-y-4">
                        {/* TripAdvisor Header */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <Trophy className="h-5 w-5 text-green-600" />
                              <div>
                                <h3 className="font-semibold text-green-800">TripAdvisor Bewertungen</h3>
                                <p className="text-xs text-green-600">Echte Reisendenerfahrungen</p>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                              <div className="flex items-center justify-center space-x-1 mb-1">
                                <div className="flex">{renderStars(displayItem.tripAdvisor.rating || 0)}</div>
                              </div>
                              <p className="text-lg font-bold text-green-800">{displayItem.tripAdvisor.rating}/5</p>
                              <p className="text-xs text-green-600">Gesamtbewertung</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold text-green-800">{displayItem.tripAdvisor.numReviews?.toLocaleString('de-DE')}</p>
                              <p className="text-xs text-green-600">Bewertungen</p>
                            </div>
                          </div>

                          {displayItem.tripAdvisor.rankingData && (
                            <div className="mt-3 p-2 bg-green-100 rounded">
                              <p className="text-xs font-medium text-green-800">{displayItem.tripAdvisor.rankingData.rankingString}</p>
                            </div>
                          )}
                        </div>



                        {/* Detailed Reviews */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-sm">Neueste Bewertungen</h4>
                          {displayItem.tripAdvisor.reviews.map((review, index) => (
                            <div key={review.id}>
                              <Card className="border-l-4 border-l-green-500">
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center space-x-2">
                                      <div className="flex">{renderStars(review.rating)}</div>
                                      <span className="text-sm font-bold text-green-700">{review.rating}/5</span>
                                      <Badge variant="outline" className="text-xs">Verifiziert</Badge>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                      {new Date(review.publishedDate).toLocaleDateString('de-DE', {
                                        day: '2-digit',
                                        month: 'long',
                                        year: 'numeric'
                                      })}
                                    </span>
                                  </div>

                                  <h5 className="font-medium text-sm mb-2 text-gray-900">{review.title}</h5>
                                  <p className="text-sm text-gray-600 leading-relaxed mb-3">{review.text}</p>

                                  {review.user && (
                                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                                      <Users className="h-3 w-3" />
                                      <span>{review.user.username}</span>
                                      {review.user.userLocation && (
                                        <>
                                          <span>•</span>
                                          <span>{review.user.userLocation}</span>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Eye className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">Keine Bewertungen verfügbar</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="nearby" className="space-y-4 mt-0">
                    {nearbyItems && (
                      <div className="space-y-6">
                        {nearbyItems?.hotels && nearbyItems.hotels.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-sm flex items-center space-x-2">
                                <MapPin className="h-4 w-4 text-green-600" />
                                <span>Hotels</span>
                              </h4>
                              <Badge variant="outline" className="text-xs">
                                {nearbyItems.hotels.length} verfügbar
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              {nearbyItems.hotels.slice(0, 3).map((hotel, index) => (
                                <div key={hotel.id}>
                                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                                    <CardContent className="p-3">
                                      <div className="flex items-center space-x-3">
                                        {hotel.imageUrl && (
                                          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                            <img
                                              src={hotel.imageUrl}
                                              alt={hotel.name}
                                              className="w-full h-full object-cover"
                                              loading="lazy"
                                            />
                                          </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <h5 className="font-medium text-sm text-gray-900 line-clamp-1">
                                            {hotel.name}
                                          </h5>
                                          <div className="flex items-center space-x-2 mt-1">
                                            {hotel.rating && (
                                              <div className="flex items-center space-x-1">
                                                <div className="flex">
                                                  {Array.from({ length: 5 }, (_, i) => (
                                                    <Star
                                                      key={i}
                                                      className={`h-3 w-3 ${
                                                        i < hotel.rating! ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                                      }`}
                                                    />
                                                  ))}
                                                </div>
                                                <span className="text-xs text-gray-600">{hotel.rating}</span>
                                              </div>
                                            )}
                                            {hotel.distance && (
                                              <span className="text-xs text-gray-500">• {hotel.distance}</span>
                                            )}
                                          </div>
                                          {hotel.priceInfo && (
                                            <p className="text-xs text-green-600 font-medium mt-1">{hotel.priceInfo}</p>
                                          )}
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {nearbyItems?.attractions && nearbyItems.attractions.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-sm flex items-center space-x-2">
                                <Camera className="h-4 w-4 text-blue-600" />
                                <span>Sehenswürdigkeiten</span>
                              </h4>
                              <Badge variant="outline" className="text-xs">
                                {nearbyItems.attractions.length} verfügbar
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              {nearbyItems.attractions.slice(0, 3).map((attraction, index) => (
                                <div key={attraction.id}>
                                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                                    <CardContent className="p-3">
                                      <div className="flex items-center space-x-3">
                                        {attraction.imageUrl && (
                                          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                            <img
                                              src={attraction.imageUrl}
                                              alt={attraction.name}
                                              className="w-full h-full object-cover"
                                              loading="lazy"
                                            />
                                          </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <h5 className="font-medium text-sm text-gray-900 line-clamp-1">
                                            {attraction.name}
                                          </h5>
                                          <div className="flex items-center space-x-2 mt-1">
                                            {attraction.category && (
                                              <Badge variant="secondary" className="text-xs">
                                                {attraction.category}
                                              </Badge>
                                            )}
                                            {attraction.rating && (
                                              <div className="flex items-center space-x-1">
                                                <div className="flex">
                                                  {Array.from({ length: 5 }, (_, i) => (
                                                    <Star
                                                      key={i}
                                                      className={`h-3 w-3 ${
                                                        i < attraction.rating! ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                                      }`}
                                                    />
                                                  ))}
                                                </div>
                                                <span className="text-xs text-gray-600">{attraction.rating}</span>
                                              </div>
                                            )}
                                          </div>
                                          {attraction.distance && (
                                            <p className="text-xs text-gray-500 mt-1">{attraction.distance}</p>
                                          )}
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {nearbyItems?.restaurants && nearbyItems.restaurants.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-sm flex items-center space-x-2">
                                <Utensils className="h-4 w-4 text-orange-600" />
                                <span>Restaurants</span>
                              </h4>
                              <Badge variant="outline" className="text-xs">
                                {nearbyItems.restaurants.length} verfügbar
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              {nearbyItems.restaurants.slice(0, 3).map((restaurant, index) => (
                                <div key={restaurant.id}>
                                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                                    <CardContent className="p-3">
                                      <div className="flex items-center space-x-3">
                                        {restaurant.imageUrl && (
                                          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                            <img
                                              src={restaurant.imageUrl}
                                              alt={restaurant.name}
                                              className="w-full h-full object-cover"
                                              loading="lazy"
                                            />
                                          </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <h5 className="font-medium text-sm text-gray-900 line-clamp-1">
                                            {restaurant.name}
                                          </h5>
                                          <div className="flex items-center space-x-2 mt-1">
                                            {restaurant.category && (
                                              <Badge variant="secondary" className="text-xs">
                                                {restaurant.category}
                                              </Badge>
                                            )}
                                            {restaurant.rating && (
                                              <div className="flex items-center space-x-1">
                                                <div className="flex">
                                                  {Array.from({ length: 5 }, (_, i) => (
                                                    <Star
                                                      key={i}
                                                      className={`h-3 w-3 ${
                                                        i < restaurant.rating! ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                                      }`}
                                                    />
                                                  ))}
                                                </div>
                                                <span className="text-xs text-gray-600">{restaurant.rating}</span>
                                              </div>
                                            )}
                                          </div>
                                          {restaurant.distance && (
                                            <p className="text-xs text-gray-500 mt-1">{restaurant.distance}</p>
                                          )}
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>
                </div>
              </ScrollArea>
            </div>
          </Tabs>
        </div>
    </div>
  );
}