import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Search, Heart, Star, MapPin, Building2, MapIcon, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import LeftSidebar from "@/components/LeftSidebar";

type SavedItem = {
  id: number;
  userId: number;
  itemType: string;
  itemId: string;
  itemName: string;
  itemData: {
    name: string;
    imageUrl?: string;
    rating?: number;
    description?: string;
    address?: string;
    category?: string;
    price?: string;
  };
  createdAt: string;
};

export default function SavedPage() {
  const { t } = useTranslation();
  const [favorites, setFavorites] = useState<SavedItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"places" | "collections" | "guides">("places");
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  const { data: favoritesData, isLoading } = useQuery({
    queryKey: ['/api/favorites'],
    enabled: true
  });

  useEffect(() => {
    if (favoritesData && Array.isArray(favoritesData)) {
      setFavorites(favoritesData);
    }
  }, [favoritesData]);

  const filteredFavorites = favorites.filter(item => {
    const matchesSearch = (item.itemData?.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                         (item.itemData?.address?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === "all" || item.itemType === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'hotel': return <Building2 className="h-4 w-4" />;
      case 'restaurant': return <span className="text-sm">🍽️</span>;
      case 'attraction': return <MapPin className="h-4 w-4" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'hotel': return t('hotel');
      case 'restaurant': return t('restaurant');
      case 'attraction': return t('attraction');
      default: return type;
    }
  };

  const getCategoryDisplayName = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      'historical_landmark': 'Historisches Wahrzeichen',
      'tourist_attraction': 'Touristenattraktion',
      'place_of_worship': 'Gotteshaus',
      'museum': 'Museum',
      'park': 'Park',
      'church': 'Kirche',
      'castle': 'Schloss',
      'monument': 'Denkmal',
      'art_gallery': 'Kunstgalerie',
      'zoo': 'Zoo',
      'amusement_park': 'Vergnügungspark',
      'aquarium': 'Aquarium',
      'stadium': 'Stadion',
      'cemetery': 'Friedhof',
      'hindu_temple': 'Hindu-Tempel',
      'synagogue': 'Synagoge',
      'mosque': 'Moschee'
    };
    
    return categoryMap[category] || category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getFilterCounts = () => {
    const counts = {
      all: favorites.length,
      hotel: favorites.filter(f => f.itemType === 'hotel').length,
      restaurant: favorites.filter(f => f.itemType === 'restaurant').length,
      attraction: favorites.filter(f => f.itemType === 'attraction').length,
      activity: favorites.filter(f => f.itemType === 'activity').length,
    };
    return counts;
  };

  const counts = getFilterCounts();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Collapsible Sidebar */}
      <div className={`${isSidebarExpanded ? 'w-72' : 'w-16'} transition-all duration-300 overflow-hidden`}>
        <LeftSidebar
          onNewChat={() => {}}
          onChatSelect={() => {}}
          isCollapsed={!isSidebarExpanded}
          onExpand={() => setIsSidebarExpanded(true)}
          onCollapse={() => setIsSidebarExpanded(false)}
        />
      </div>
      
      <div className="flex-1 flex flex-col">
        {/* Top Navigation Bar */}
        <div className="h-14 border-b border-gray-100 flex items-center justify-between px-6 bg-white">
          <div className="flex items-center space-x-6">
            <span className="font-medium text-gray-900">{t('saved')}</span>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="text-sm border-gray-200 text-gray-600 hover:text-gray-800 hover:border-gray-300 gap-2">
              <MapIcon className="h-4 w-4" />
              {t('Map')}
            </Button>
            <Button variant="outline" size="sm" className="text-sm border-gray-200 text-gray-600 hover:text-gray-800 hover:border-gray-300 gap-2">
              <Sparkles className="h-4 w-4" />
              {t('Trips')}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto bg-white">
          <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Title Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">{t('Your saved places')}</h1>
          
          {/* View Mode Tabs */}
          <div className="flex items-center gap-8 border-b border-gray-100">
            <button
              onClick={() => setViewMode("places")}
              className={`text-base font-semibold pb-4 border-b-2 transition-colors ${
                viewMode === "places" 
                  ? "text-black border-black" 
                  : "text-gray-500 border-transparent hover:text-gray-700"
              }`}
            >
              Places {counts.all > 0 && <span className="ml-2 text-sm bg-gray-100 px-2 py-0.5 rounded-full">{counts.all}</span>}
            </button>
            <button
              onClick={() => setViewMode("collections")}
              className={`text-base font-semibold pb-4 border-b-2 transition-colors ${
                viewMode === "collections" 
                  ? "text-black border-black" 
                  : "text-gray-500 border-transparent hover:text-gray-700"
              }`}
            >
              Collections <span className="ml-2 text-sm bg-gray-100 px-2 py-0.5 rounded-full">0</span>
            </button>
            <button
              onClick={() => setViewMode("guides")}
              className={`text-base font-semibold pb-4 border-b-2 transition-colors ${
                viewMode === "guides" 
                  ? "text-black border-black" 
                  : "text-gray-500 border-transparent hover:text-gray-700"
              }`}
            >
              Guides <span className="ml-2 text-sm bg-gray-100 px-2 py-0.5 rounded-full">0</span>
            </button>
          </div>
        </div>

        {viewMode === "places" && (
          <>
            {/* Search Bar */}
            <div className="mb-8 mt-8">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search my saved places"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-0 rounded-2xl text-base focus:bg-white focus:ring-2 focus:ring-gray-200 transition-all duration-200 placeholder:text-gray-500 shadow-sm"
                />
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-3 mb-8 flex-wrap">
              <Button
                variant={selectedFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFilter("all")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedFilter === "all" 
                    ? "bg-black text-white hover:bg-gray-800" 
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                }`}
              >
                All
              </Button>
              <Button
                variant={selectedFilter === "hotel" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFilter("hotel")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedFilter === "hotel" 
                    ? "bg-black text-white hover:bg-gray-800" 
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                }`}
              >
                Stays
              </Button>
              <Button
                variant={selectedFilter === "restaurant" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFilter("restaurant")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedFilter === "restaurant" 
                    ? "bg-black text-white hover:bg-gray-800" 
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                }`}
              >
                Restaurants
              </Button>
              <Button
                variant={selectedFilter === "attraction" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFilter("attraction")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedFilter === "attraction" 
                    ? "bg-black text-white hover:bg-gray-800" 
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                }`}
              >
                Attractions
              </Button>
              <Button
                variant={selectedFilter === "activity" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFilter("activity")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedFilter === "activity" 
                    ? "bg-black text-white hover:bg-gray-800" 
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                }`}
              >
                Activities
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="px-4 py-2 rounded-full text-sm font-medium bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
              >
                Locations
              </Button>
            </div>

            {/* Content */}
            {filteredFavorites.length === 0 ? (
              <div className="text-center py-16">
                <Heart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {searchQuery ? "No results found" : "No saved places yet"}
                </h3>
                <p className="text-gray-500">
                  {searchQuery 
                    ? "Try adjusting your search or filters" 
                    : "Start saving places you'd like to visit"
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {filteredFavorites.map((item) => (
                  <Card key={item.id} className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border-0 bg-white rounded-2xl">
                    {/* Image Container */}
                    <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                      {item.itemData.imageUrl ? (
                        <img
                          src={item.itemData.imageUrl}
                          alt={item.itemData.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <div className="p-4 rounded-full bg-white/80">
                            {getTypeIcon(item.itemType)}
                          </div>
                        </div>
                      )}
                      
                      {/* Heart icon overlay */}
                      <button className="absolute top-3 right-3 p-2 rounded-full bg-white/95 hover:bg-white transition-all duration-200 shadow-sm hover:shadow-md">
                        <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                      </button>
                      
                      {/* Type badge */}
                      <div className="absolute bottom-3 left-3">
                        <Badge variant="secondary" className="gap-1.5 bg-white/95 text-gray-700 border-0 px-2.5 py-1 rounded-lg text-xs font-medium">
                          {getTypeIcon(item.itemType)}
                          {getTypeLabel(item.itemType)}
                        </Badge>
                      </div>
                    </div>

                    <CardContent className="p-4">
                      {/* Rating and location row */}
                      <div className="flex items-start justify-between mb-2">
                        {item.itemData.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-semibold text-gray-900">{item.itemData.rating}</span>
                            <span className="text-xs text-gray-500">({Math.floor(Math.random() * 500) + 50})</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Name */}
                      <h3 className="font-semibold text-gray-900 mb-1 text-base leading-tight line-clamp-2">
                        {item.itemData.name}
                      </h3>
                      
                      {/* Location */}
                      {item.itemData.address && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-1">
                          {item.itemData.address.split(',').slice(-2).join(', ')}
                        </p>
                      )}
                      
                      {/* Price */}
                      {item.itemData.price && item.itemType === 'hotel' && (
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-bold text-gray-900">{item.itemData.price}</span>
                          <span className="text-sm text-gray-500">night</span>
                        </div>
                      )}
                      
                      {/* Category for non-hotels */}
                      {item.itemData.category && item.itemType !== 'hotel' && (
                        <p className="text-xs text-gray-500 mt-2 px-2 py-1 bg-gray-50 rounded-md inline-block">
                          {getCategoryDisplayName(item.itemData.category)}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Collections and Guides placeholders */}
        {viewMode === "collections" && (
          <div className="text-center py-16">
            <div className="h-16 w-16 mx-auto mb-4 bg-gray-200 rounded-lg flex items-center justify-center">
              <Heart className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No collections yet</h3>
            <p className="text-gray-500">Create collections to organize your saved places</p>
          </div>
        )}

        {viewMode === "guides" && (
          <div className="text-center py-16">
            <div className="h-16 w-16 mx-auto mb-4 bg-gray-200 rounded-lg flex items-center justify-center">
              <MapPin className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No guides yet</h3>
            <p className="text-gray-500">Save guides to help plan your trips</p>
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
}