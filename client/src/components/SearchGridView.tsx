import { useState, useEffect } from 'react';
import { Search, MapPin, Star, Heart, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SearchItem {
  id: string;
  name: string;
  type: 'hotel' | 'restaurant' | 'attraction';
  imageUrl?: string;
  rating?: number;
  description?: string;
  address?: string;
  category?: string;
  location?: {
    lat: number;
    lng: number;
  };
}

interface SearchGridViewProps {
  destinationData?: any;
  searchResults: SearchItem[];
  onItemClick?: (item: SearchItem) => void;
  onLocationClick?: (locationName: string, locationType: 'hotel' | 'attraction') => void;
  onFilterChange?: (filter: string) => void;
}

export default function SearchGridView({
  destinationData,
  searchResults,
  onItemClick,
  onLocationClick,
  onFilterChange
}: SearchGridViewProps) {
  const [activeCategory, setActiveCategory] = useState('attractions');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<SearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch data when category changes
  useEffect(() => {
    if (destinationData?.destination?.coordinates) {
      fetchCategoryData(activeCategory);
      // Trigger map filtering when category changes
      onFilterChange?.(activeCategory === 'stays' ? 'hotels' : activeCategory);
    }
  }, [activeCategory, destinationData]);

  const fetchCategoryData = async (category: string) => {
    if (!destinationData?.destination?.coordinates) return;

    setIsLoading(true);
    try {
      const { lat, lng } = destinationData.destination.coordinates;
      let endpoint = '';
      
      switch (category) {
        case 'stays':
          endpoint = `/api/destinations/search-hotels?lat=${lat}&lng=${lng}`;
          break;
        case 'restaurants':
          endpoint = `/api/destinations/search-restaurants?lat=${lat}&lng=${lng}`;
          break;
        case 'attractions':
          endpoint = `/api/destinations/search-attractions?lat=${lat}&lng=${lng}`;
          break;
        default:
          return;
      }

      const response = await fetch(endpoint);
      if (response.ok) {
        const results = await response.json();
        const formattedResults = results.map((item: any) => ({
          id: item.placeId || item.name,
          name: item.name,
          type: category === 'stays' ? 'hotel' : category === 'restaurants' ? 'restaurant' : 'attraction',
          imageUrl: item.photos?.[0] || item.imageUrl,
          rating: item.rating,
          description: item.vicinity || item.address || item.description,
          address: item.vicinity || item.address,
          category: item.category,
          location: item.location
        }));
        setFilteredItems(formattedResults);
      }
    } catch (error) {
      console.error('Error fetching category data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    fetchCategoryData(activeCategory);
  };

  const handleItemClick = (item: SearchItem) => {
    if (item.type === 'restaurant') {
      // Handle restaurant clicks differently since onLocationClick expects hotel | attraction
      onItemClick?.(item);
    } else {
      onLocationClick?.(item.name, item.type as 'hotel' | 'attraction');
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'stays': return 'Stays';
      case 'restaurants': return 'Restaurants';
      case 'attractions': return 'Attractions';
      case 'activities': return 'Activities';
      default: return category;
    }
  };

  if (!destinationData?.destination) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <Search className="h-16 w-16 mx-auto mb-4" />
          <p className="text-lg font-medium">No destination selected</p>
          <p className="text-sm">Start a conversation to explore destinations</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Search Header */}
      <div className="bg-white p-4 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={`${getCategoryLabel(activeCategory)} name or types`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch} className="bg-black text-white hover:bg-gray-800">
            Search
          </Button>
        </div>

        {/* Location Display */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="h-4 w-4" />
          <span>{destinationData.destination.name}</span>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="bg-white border-b border-gray-200">
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
          <TabsList className="bg-transparent w-full justify-start px-4">
            <TabsTrigger value="stays" className="data-[state=active]:border-b-2 data-[state=active]:border-black rounded-none bg-transparent">
              Stays
            </TabsTrigger>
            <TabsTrigger value="restaurants" className="data-[state=active]:border-b-2 data-[state=active]:border-black rounded-none bg-transparent">
              Restaurants
            </TabsTrigger>
            <TabsTrigger value="attractions" className="data-[state=active]:border-b-2 data-[state=active]:border-black rounded-none bg-transparent">
              Attractions
            </TabsTrigger>
            <TabsTrigger value="activities" className="data-[state=active]:border-b-2 data-[state=active]:border-black rounded-none bg-transparent">
              Activities
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Results Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredItems.map((item) => (
              <Card 
                key={item.id} 
                className="group hover:shadow-lg transition-all cursor-pointer overflow-hidden"
                onClick={() => handleItemClick(item)}
              >
                <div className="relative">
                  {/* Image */}
                  <div className="aspect-square relative overflow-hidden">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <MapPin className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="bg-white/80 hover:bg-white w-8 h-8 p-0 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Save to favorites logic
                        }}
                      >
                        <Heart className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="bg-white/80 hover:bg-white w-8 h-8 p-0 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Add to itinerary logic
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Rating Badge */}
                    {item.rating && (
                      <div className="absolute bottom-2 left-2">
                        <div className="bg-black/80 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {item.rating.toFixed(1)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <CardContent className="p-3">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-sm line-clamp-1">{item.name}</h3>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {item.type === 'hotel' ? 'Hotel' : 
                           item.type === 'restaurant' ? 'Restaurant' : 
                           'Attraction'}
                        </Badge>
                        {item.category && (
                          <span className="text-xs text-gray-500">{item.category}</span>
                        )}
                      </div>

                      {item.address && (
                        <p className="text-xs text-gray-600 line-clamp-1">{item.address}</p>
                      )}
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && filteredItems.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Search className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium">No results found</p>
            <p className="text-sm">Try searching for different {activeCategory}</p>
          </div>
        )}
      </div>
    </div>
  );
}