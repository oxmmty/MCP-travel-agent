import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTripPlanning } from '@/contexts/TripPlanningContext';
import { WhereOverlay, WhenOverlay, TravelersOverlay, BudgetOverlay } from './TripPlanningOverlays';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import SidebarContainer from './SidebarContainer';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  X,
  Plus,
  GripVertical,
  MapPin,
  Clock,
  Euro,
  Calendar,
  Users,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Route,
  Save,
  Trash2,
  Calculator,
  List,
  Star,
  Edit2,
  Search,
  Upload,
  Heart,
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import SolverValidationPanel from './SolverValidationPanel';
import DistanceIndicator from './DistanceIndicator';
import TripGenerationLoader from './TripGenerationLoader';

interface TripSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  chatId?: number;
  destinationName?: string;
}

interface TripItem {
  id: string;
  type: 'hotel' | 'attraction' | 'restaurant' | 'activity';
  name: string;
  description?: string;
  location?: string;
  time?: string;
  duration?: string;
  cost?: string;
  day: number;
  order: number;
  coordinates?: { lat: number; lng: number };
  imageUrl?: string;
  rating?: number;
}

interface DraggableTripItemProps {
  item: TripItem;
  onEdit: (item: TripItem) => void;
  onDelete: (id: string) => void;
}

function DraggableTripItem({ item, onEdit, onDelete }: DraggableTripItemProps) {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'hotel': return '🏨';
      case 'attraction': return '🎯';
      case 'restaurant': return '🍽️';
      case 'activity': return '🎪';
      default: return '📍';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'hotel': return 'bg-blue-100 text-blue-800';
      case 'attraction': return 'bg-green-100 text-green-800';
      case 'restaurant': return 'bg-orange-100 text-orange-800';
      case 'activity': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'hotel': return t('trip.hotel');
      case 'attraction': return t('trip.attraction');
      case 'restaurant': return t('trip.restaurant');
      case 'activity': return t('trip.activity');
      default: return t('trip.other');
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group"
    >
      <div className={`bg-white border rounded-md shadow-sm hover:shadow transition-all ${
        isDragging ? 'ring-2 ring-blue-400 shadow-lg' : 'border-gray-200'
      } ${getTypeColor(item.type).split(' ')[0]} border-l-4`}>
        <div className="flex items-center gap-2 p-2">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>

          {/* Icon */}
          <div className="text-lg flex-shrink-0">
            {getTypeIcon(item.type)}
          </div>
          
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-medium text-sm text-gray-900 truncate">{item.name}</h4>
              {item.time && (
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {item.time}
                </span>
              )}
            </div>
            
            {/* Compact Info Row */}
            <div className="flex items-center gap-3 text-xs text-gray-600 mt-0.5">
              {item.duration && (
                <div className="flex items-center gap-0.5">
                  <Clock className="w-3 h-3" />
                  <span>{item.duration}</span>
                </div>
              )}
              {item.cost && (
                <div className="flex items-center gap-0.5">
                  <Euro className="w-3 h-3" />
                  <span>{item.cost.replace(/[€$]/, '')}</span>
                </div>
              )}
              {item.rating && (
                <div className="flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span>{item.rating}</span>
                </div>
              )}
            </div>
            
            {/* Location if exists */}
            {item.location && (
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5 truncate">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{item.location}</span>
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(item)}
              className="h-6 w-6 p-0"
            >
              <Edit2 className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(item.id)}
              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TripSidebar({ isOpen, onClose, chatId, destinationName }: TripSidebarProps) {
  const { t, i18n } = useTranslation();
  const { tripData, updateTripData, saveTripPlan, loadTripPlan } = useTripPlanning();
  
  // Overlay states for consistent design
  const [showWhereOverlay, setShowWhereOverlay] = useState(false);
  const [showWhenOverlay, setShowWhenOverlay] = useState(false);
  const [showTravelersOverlay, setShowTravelersOverlay] = useState(false);
  const [showBudgetOverlay, setShowBudgetOverlay] = useState(false);
  const [tripItems, setTripItems] = useState<TripItem[]>([]);
  
  // Undo/Redo functionality
  const [history, setHistory] = useState<TripItem[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [selectedDay, setSelectedDay] = useState(1);
  const [tripDays, setTripDays] = useState([1, 2, 3]);
  const [isGeneratingItinerary, setIsGeneratingItinerary] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<{
    agent: string;
    action: string;
    details?: string;
    progress?: number;
  } | null>(null);
  const [expandedDays, setExpandedDays] = useState<number[]>([1]);
  const [editingItem, setEditingItem] = useState<TripItem | null>(null);
  const [activeTab, setActiveTab] = useState<'itinerary' | 'calendar' | 'bookings'>('itinerary');
  const [showDistances, setShowDistances] = useState(true);
  const [tripTitle, setTripTitle] = useState<string>('');
  
  // Add Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalTab, setAddModalTab] = useState<'search' | 'saved' | 'receipt' | 'custom'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemType, setSelectedItemType] = useState<'attraction' | 'hotel' | 'restaurant' | 'activity'>('attraction');
  const [selectedDay_Modal, setSelectedDay_Modal] = useState(1);
  const [selectedTime, setSelectedTime] = useState('10:00 AM');
  const [selectedDuration, setSelectedDuration] = useState('1h');
  const [selectedTimezone, setSelectedTimezone] = useState('Europe/Berlin');
  const [customLocation, setCustomLocation] = useState({
    city: '',
    state: '',
    postalCode: '',
    country: '',
    people: 2,
    confirmation: '',
    phone: ''
  });
  
  const queryClient = useQueryClient();

  // Generate trip title based on location
  const generateTripTitle = (location: string) => {
    if (!location) return 'My Trip';
    return `${location} Travel Tips`;
  };

  // Update trip title when destination changes
  useEffect(() => {
    if (destinationName && !tripTitle) {
      setTripTitle(generateTripTitle(destinationName));
    }
  }, [destinationName, tripTitle]);

  // Save trip title changes to the trip planning context
  const handleTripTitleChange = (newTitle: string) => {
    setTripTitle(newTitle);
    // You could save this to the database/context if needed
    // updateTripData({ title: newTitle });
  };
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load trip plan data when sidebar opens or chat changes
  useEffect(() => {
    if (isOpen && chatId) {
      loadTripPlan(chatId);
    }
  }, [isOpen, chatId, loadTripPlan]);

  // Update trip days when duration changes
  useEffect(() => {
    setTripDays(Array.from({ length: tripData.duration }, (_, i) => i + 1));
  }, [tripData.duration]);

  // Fetch existing trip plan
  const { data: tripPlan } = useQuery({
    queryKey: [`/api/trip-plans/${chatId}`],
    enabled: !!chatId && isOpen,
  });

  // Fetch itinerary items
  const { data: itineraryItems = [], refetch: refetchItinerary } = useQuery({
    queryKey: ['/api/chats', chatId, 'itinerary'],
    queryFn: () => fetch(`/api/chats/${chatId}/itinerary`).then(res => res.json()),
    enabled: !!chatId && isOpen,
    refetchInterval: 3000, // Refresh every 3 seconds to catch new generated plans
  });

  // Load trip items from itinerary AND from generated trip plan
  useEffect(() => {
    let items: TripItem[] = [];
    
    // Load from itinerary items first
    if (Array.isArray(itineraryItems) && itineraryItems.length > 0) {
      items = (itineraryItems as any[]).map((item: any) => ({
        id: item.id.toString(),
        type: item.itemType,
        name: item.itemName,
        description: item.itemData?.description || '',
        location: item.itemData?.location || item.itemData?.address,
        time: item.itemData?.time,
        duration: item.itemData?.duration,
        cost: item.itemData?.cost,
        day: item.day || 1,
        order: item.order || 0,
        coordinates: item.itemData?.coordinates,
        imageUrl: item.itemData?.imageUrl,
        rating: item.itemData?.rating,
      }));
    }
    
    // If no itinerary items but there's a generated plan, extract from it directly
    if (items.length === 0 && tripPlan && typeof tripPlan === 'object' && tripPlan !== null) {
      const planData = tripPlan as any;
      if (planData.generatedPlan) {
        const plan = planData.generatedPlan;
        console.log('Full generated plan structure:', JSON.stringify(plan, null, 2));
        console.log('Extracting from generated plan structure:', Object.keys(plan));
      
      // Try different possible structures for the generated plan
      let extractedItems = 0;
      
      // Primary extraction: Check if plan.destination exists (most likely structure from agent)
      if (plan.destination) {
        const dest = plan.destination;
        console.log('Found destination object with keys:', Object.keys(dest));
        
        // Extract hotels from various possible locations
        const hotelSources = [
          dest.accommodations?.hotels,
          dest.hotels,
          plan.accommodations?.hotels,
          plan.hotels
        ].filter(Boolean);
        
        hotelSources.forEach(hotelArray => {
          if (Array.isArray(hotelArray)) {
            console.log(`Found ${hotelArray.length} hotels`);
            hotelArray.forEach((hotel: any, index: number) => {
              items.push({
                id: `hotel-${index}`,
                type: 'hotel',
                name: hotel.name || 'Hotel',
                description: hotel.description || '',
                location: hotel.address || hotel.vicinity || '',
                cost: hotel.pricePerNight ? `€${hotel.pricePerNight}/Nacht` : '',
                day: 1,
                order: index,
                rating: hotel.rating,
              });
              extractedItems++;
            });
          }
        });
        
        // Extract attractions from various possible locations
        const attractionSources = [
          dest.attractions?.places,
          dest.attractions,
          plan.attractions?.places,
          plan.attractions
        ].filter(Boolean);
        
        attractionSources.forEach(attractionArray => {
          if (Array.isArray(attractionArray)) {
            console.log(`Found ${attractionArray.length} attractions`);
            attractionArray.forEach((attraction: any, index: number) => {
              items.push({
                id: `attraction-${index}`,
                type: 'attraction',
                name: attraction.name || 'Attraction',
                description: attraction.description || '',
                location: attraction.address || attraction.vicinity || '',
                day: Math.ceil((index + 1) / 3),
                order: index % 3,
                rating: attraction.rating,
              });
              extractedItems++;
            });
          }
        });
        
        // Extract restaurants from various possible locations
        const restaurantSources = [
          dest.dining?.restaurants,
          dest.restaurants,
          plan.dining?.restaurants,
          plan.restaurants
        ].filter(Boolean);
        
        restaurantSources.forEach(restaurantArray => {
          if (Array.isArray(restaurantArray)) {
            console.log(`Found ${restaurantArray.length} restaurants`);
            restaurantArray.forEach((restaurant: any, index: number) => {
              items.push({
                id: `restaurant-${index}`,
                type: 'restaurant',
                name: restaurant.name || 'Restaurant',
                description: restaurant.description || '',
                location: restaurant.address || restaurant.vicinity || '',
                cost: restaurant.priceLevel ? `€${'€'.repeat(restaurant.priceLevel)}` : '',
                day: Math.ceil((index + 1) / 2),
                order: index % 2 + 10,
                rating: restaurant.rating,
              });
              extractedItems++;
            });
          }
        });
      }
      
      // Secondary extraction: Try to extract from itinerary structure
      if (plan.itinerary && typeof plan.itinerary === 'object') {
        console.log('Found itinerary structure:', Object.keys(plan.itinerary));
        Object.entries(plan.itinerary).forEach(([dayKey, dayData]: [string, any]) => {
          const dayNum = parseInt(dayKey.replace(/\D/g, '')) || 1;
          console.log(`Processing day ${dayNum}:`, dayData);
          
          if (dayData && typeof dayData === 'object') {
            // Check for activities array
            if (dayData.activities && Array.isArray(dayData.activities)) {
              dayData.activities.forEach((activity: any, index: number) => {
                items.push({
                  id: `itinerary-${dayNum}-${index}`,
                  type: activity.type || 'activity',
                  name: activity.title || activity.name || 'Activity',
                  description: activity.description || '',
                  location: activity.location || '',
                  time: activity.time || '',
                  duration: activity.duration || '',
                  cost: activity.cost || '',
                  day: dayNum,
                  order: index,
                  coordinates: activity.coordinates,
                });
                extractedItems++;
              });
            }
            
            // Also check for direct properties like hotels, attractions, restaurants in day data
            ['hotels', 'attractions', 'restaurants'].forEach(type => {
              if (dayData[type] && Array.isArray(dayData[type])) {
                dayData[type].forEach((item: any, index: number) => {
                  items.push({
                    id: `${type}-${dayNum}-${index}`,
                    type: type.slice(0, -1) as any, // Remove 's' to get singular
                    name: item.name || item.title || 'Place',
                    description: item.description || '',
                    location: item.address || item.vicinity || item.location || '',
                    time: item.time || '',
                    duration: item.duration || '',
                    cost: item.cost || (item.pricePerNight ? `€${item.pricePerNight}/Nacht` : ''),
                    day: dayNum,
                    order: index + 100, // Offset to avoid conflicts
                    rating: item.rating,
                  });
                  extractedItems++;
                });
              }
            });
          }
        });
      }
      
      console.log(`Extracted ${extractedItems} items from generated plan`);
      }
    }
    
    if (items.length > 0) {
      // Limit items to the configured duration
      const limitedItems = items.map(item => ({
        ...item,
        day: item.day > tripData.duration ? ((item.day - 1) % tripData.duration) + 1 : item.day
      }));
      
      setTripItems(limitedItems.sort((a, b) => a.day - b.day || a.order - b.order));
      
      // Set trip days based on configured duration, not items
      setTripDays(Array.from({ length: tripData.duration }, (_, i) => i + 1));
    }
  }, [itineraryItems, tripPlan, tripData.duration]);

  // Generate itinerary using AI agents
  const generateItineraryMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/agents/plan-trip', {
        destination: destinationName,
        chatId,
        userId: 1,
        duration: tripData.duration,
        budget: tripData.budget,
        preferences: ['sightseeing', 'culture', 'dining'],
        language: i18n.language,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.tripPlan?.generatedPlan) {
        const plan = data.tripPlan.generatedPlan;
        const newItems: TripItem[] = [];
        
        // Parse generated itinerary
        if (plan.itinerary) {
          Object.entries(plan.itinerary).forEach(([dayKey, dayData]: [string, any]) => {
            const dayNum = parseInt(dayKey.replace('day', ''));
            if (dayData.activities) {
              dayData.activities.forEach((activity: any, index: number) => {
                newItems.push({
                  id: `generated-${dayNum}-${index}`,
                  type: activity.type || 'activity',
                  name: activity.title || activity.name,
                  description: activity.description,
                  location: activity.location,
                  time: activity.time,
                  duration: activity.duration,
                  cost: activity.cost,
                  day: dayNum,
                  order: index,
                  coordinates: activity.coordinates,
                });
              });
            }
          });
        }
        
        setTripItems(newItems);
        queryClient.invalidateQueries({ queryKey: [`/api/itinerary-items/${chatId}`] });
        
        // Wait a bit for UI to update before hiding loading animation
        setTimeout(() => {
          setIsGeneratingItinerary(false);
        }, 1000);
      } else {
        setIsGeneratingItinerary(false);
      }
    },
    onError: () => {
      setIsGeneratingItinerary(false);
    },
  });

  const handleGenerateItinerary = () => {
    setIsGeneratingItinerary(true);
    setGenerationStatus(null);
    
    // Start polling for generation status
    const statusInterval = setInterval(async () => {
      if (!chatId) return;
      
      try {
        const response = await fetch(`/api/chats/${chatId}/generation-status`);
        if (response.ok) {
          const data = await response.json();
          if (data.status) {
            setGenerationStatus(data.status);
          }
        }
      } catch (error) {
        console.error('Failed to get generation status:', error);
      }
    }, 1000);

    // Stop polling when generation is complete
    const originalMutate = generateItineraryMutation.mutate;
    generateItineraryMutation.mutate = () => {
      originalMutate();
      setTimeout(() => {
        clearInterval(statusInterval);
      }, 30000); // Stop after 30 seconds max
    };
    
    generateItineraryMutation.mutate();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    if (active.id !== over.id) {
      const oldIndex = tripItems.findIndex(item => item.id === active.id);
      const newIndex = tripItems.findIndex(item => item.id === over.id);
      
      const newItems = arrayMove(tripItems, oldIndex, newIndex);
      
      // Update order based on new positions
      const updatedItems = newItems.map((item, index) => ({ ...item, order: index }));
      setTripItems(updatedItems);
      saveToHistory(updatedItems);
      
      // TODO: Save to backend
    }
  };

  // Initialize history with empty state
  useEffect(() => {
    if (history.length === 0) {
      setHistory([[]]);
      setHistoryIndex(0);
    }
  }, [history.length]);

  // Save state to history for undo/redo
  const saveToHistory = (newItems: TripItem[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newItems]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setTripItems([...history[historyIndex - 1]]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setTripItems([...history[historyIndex + 1]]);
    }
  };

  const handleAddItem = () => {
    const newItem: TripItem = {
      id: `new-${Date.now()}`,
      type: 'activity',
      name: t('trip.newActivity'),
      day: selectedDay,
      order: tripItems.filter(item => item.day === selectedDay).length,
    };
    const newItems = [...tripItems, newItem];
    setTripItems(newItems);
    saveToHistory(newItems);
    setEditingItem(newItem);
  };

  const handleEditItem = (item: TripItem) => {
    setEditingItem(item);
  };

  const handleDeleteItem = (id: string) => {
    const newItems = tripItems.filter(item => item.id !== id);
    setTripItems(newItems);
    saveToHistory(newItems);
  };

  const handleSaveItem = (updatedItem: TripItem) => {
    const newItems = tripItems.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    );
    setTripItems(newItems);
    saveToHistory(newItems);
    setEditingItem(null);
  };

  const toggleDayExpanded = (day: number) => {
    setExpandedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const getItemsForDay = (day: number) => {
    return tripItems.filter(item => item.day === day).sort((a, b) => a.order - b.order);
  };

  return (
    <SidebarContainer
      isOpen={isOpen}
      onClose={onClose}
      side="right"
      width="w-[38rem]"
      title={t('trip.planner', 'Trip Planner')}
    >

      {/* Trip Title - Editable */}
      <div className="p-4 border-b bg-white border-gray-200">
        <div className="mb-4">
          <input
            type="text"
            value={tripTitle || generateTripTitle(destinationName || '')}
            onChange={(e) => handleTripTitleChange(e.target.value)}
            className="text-2xl font-bold text-black bg-transparent border-none outline-none w-full focus:bg-gray-50 px-0 py-1 rounded"
            placeholder={t("trip.tripTitle")}
          />
        </div>
        {/* Navigation Button Bar - Same as Top Navigation */}
        <div className="flex items-center rounded-full border border-gray-200/60 overflow-hidden bg-transparent">
          <button
            onClick={() => setShowWhereOverlay(true)}
            className="px-4 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50/50 transition-all duration-200 border-r border-gray-200/60 last:border-r-0 flex-1"
          >
            {tripData.location || t("where")}
          </button>
          <button
            onClick={() => setShowWhenOverlay(true)}
            className="px-4 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50/50 transition-all duration-200 border-r border-gray-200/60 last:border-r-0 flex-1"
          >
            {tripData.startDate && tripData.endDate 
              ? `${tripData.startDate.toLocaleDateString()} - ${tripData.endDate.toLocaleDateString()}`
              : t("when")}
          </button>
          <button
            onClick={() => setShowTravelersOverlay(true)}
            className="px-4 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50/50 transition-all duration-200 border-r border-gray-200/60 last:border-r-0 flex-1"
          >
            {tripData.travelers} {t("travelers")}
          </button>
          <button
            onClick={() => setShowBudgetOverlay(true)}
            className="px-4 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50/50 transition-all duration-200 flex-1"
          >
            {tripData.budget}
          </button>
        </div>
      </div>

      {/* Three Tab Navigation with Map/Undo/Redo buttons */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        {/* Tab Navigation */}
        <div className="flex">
          <button
            onClick={() => setActiveTab('itinerary')}
            className={`px-0 py-2 mr-6 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'itinerary' 
                ? 'text-black border-black' 
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            {t("trip.itinerary")}
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-0 py-2 mr-6 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'calendar' 
                ? 'text-black border-black' 
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            {t("trip.calendar")}
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-0 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'bookings' 
                ? 'text-black border-black' 
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            {t("trip.bookings")}
          </button>
        </div>

        {/* Right side buttons */}
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-1 h-8 w-8" 
            onClick={undo}
            disabled={historyIndex <= 0}
            title={t("trip.undo")}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-1 h-8 w-8" 
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            title={t("trip.redo")}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
            </svg>
          </Button>
          <Button variant="outline" size="sm" className="h-8 px-2 text-xs border-gray-300">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            {t("trip.map")}
          </Button>
        </div>
      </div>

      {/* Tab Content */}
      <ScrollArea className="flex-1 bg-white">
        {activeTab === 'itinerary' && (
          <div className="p-4">
            {/* Itinerary Header with Distances Toggle */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-black">{t("trip.itinerary")} <span className="text-gray-400 font-normal">{tripDays.length} {t("trip.days")}</span></h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{t("trip.distances")}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showDistances}
                    onChange={(e) => setShowDistances(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`relative w-11 h-6 rounded-full transition-colors ${
                    showDistances ? 'bg-black' : 'bg-gray-300'
                  }`}>
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      showDistances ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </div>
                </label>
              </div>
            </div>

            {/* Itinerary Content */}
            {isGeneratingItinerary ? (
              <TripGenerationLoader currentStatus={generationStatus} />
            ) : (
              // Days Layout - Like in Design
              <div className="space-y-4">
                {tripDays.map(day => {
                  const isExpanded = expandedDays.includes(day);
                  const dayItems = getItemsForDay(day);
                  
                  return (
                    <div key={day} className="mb-4">
                      {/* Day Header */}
                      <button
                        onClick={() => toggleDayExpanded(day)}
                        className="w-full flex items-center py-2 text-left"
                      >
                        <ChevronDown className={`w-4 h-4 mr-2 transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'}`} />
                        <span className="font-medium text-black">{t("trip.day")} {day}</span>
                      </button>

                      {/* Day Content */}
                      {isExpanded && (
                        <div className="ml-6 pb-4">
                          {dayItems.map((item, index) => (
                            <div key={item.id} className="mb-3">
                              <div className="flex items-start gap-3">
                                {/* Item Image */}
                                <div className="w-12 h-12 rounded-lg bg-gray-200 flex-shrink-0 overflow-hidden">
                                  {(item as any).image ? (
                                    <img src={(item as any).image} alt={item.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-green-400 to-blue-500" />
                                  )}
                                </div>
                                
                                {/* Item Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      {/* Item Header with Icon and Name */}
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-gray-400">
                                          {item.type === 'hotel' ? '🏨' : item.type === 'restaurant' ? '🍽️' : '📍'}
                                        </span>
                                        <span className="text-sm font-medium text-black">{item.name}</span>
                                      </div>
                                      
                                      {/* Time and Details */}
                                      {item.time && (
                                        <div className="flex items-center gap-1 text-sm text-gray-500 mb-1">
                                          <Clock className="w-3 h-3" />
                                          <span>{item.time}</span>
                                          {item.type === 'hotel' && item.duration && (
                                            <span className="text-gray-400">({item.duration})</span>
                                          )}
                                        </div>
                                      )}
                                      
                                      {/* Distance */}
                                      {showDistances && (item as any).distance && (
                                        <div className="text-xs text-gray-400 mt-1">{(item as any).distance}</div>
                                      )}
                                    </div>
                                    
                                    {/* Action Buttons */}
                                    <div className="flex items-start gap-2">
                                      {item.type === 'hotel' && (
                                        <Button 
                                          size="sm" 
                                          className="bg-black text-white hover:bg-gray-800 h-7 px-3 text-xs rounded-full"
                                        >
                                          {t("trip.book")}
                                        </Button>
                                      )}
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-7 px-3 text-xs border-gray-300 text-gray-600 rounded-full"
                                      >
                                        {t("trip.link")} <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}

                          {/* Add Button */}
                          <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600 mt-2"
                          >
                            <Plus className="w-4 h-4" />
                            {t("trip.add")}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="p-4">
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="mb-2">Calendar View</p>
              <p className="text-sm">Coming soon - Calendar layout for your trip</p>
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="p-4">
            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
              <div className="mb-4">
                <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-gray-600 mb-2">Drag and drop your receipts or click to upload</p>
              <p className="text-sm text-gray-400">You can forward email receipts to receipts@mindtrip.ai</p>
            </div>
          </div>
        )}

        {/* Solver tab removed - activeTab can only be 'itinerary' | 'calendar' | 'bookings' */}
        {false && (
          <div className="p-4">
            {tripItems.length > 0 ? (
              <SolverValidationPanel
                chatId={chatId || 1}
                tripData={{
                  destination: destinationName || 'Unknown',
                  budget: 1000,
                  duration: tripData.duration,
                  preferences: ['culture', 'sightseeing'],
                  hotels: [],
                  attractions: tripItems.filter(item => item.type === 'attraction'),
                  restaurants: tripItems.filter(item => item.type === 'restaurant'),
                  id: 1
                }}
                onValidationComplete={(result) => {
                  console.log('Solver validation completed:', result);
                }}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calculator className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="mb-2">{t('trip.noTripData')}</p>
                <p className="text-sm">{t('trip.createPlanFirst')}</p>
                <Button 
                  onClick={() => setActiveTab('itinerary')}
                  variant="outline"
                  className="mt-4"
                >
                  {t('trip.backToItinerary')}
                </Button>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t bg-gray-50">
        <Button className="w-full bg-[#FF5A5F] hover:bg-[#FF4449] text-white">
          <Save className="w-4 h-4 mr-2" />
          {t('trip.savePlan')}
        </Button>
      </div>

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {t('trip.editActivity')}
                <Button variant="ghost" size="sm" onClick={() => setEditingItem(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">{t('trip.name')}</label>
                <Input
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t('trip.description')}</label>
                <Textarea
                  value={editingItem.description || ''}
                  onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium">{t('trip.time')}</label>
                  <Input
                    value={editingItem.time || ''}
                    onChange={(e) => setEditingItem({...editingItem, time: e.target.value})}
                    placeholder="09:00"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{t('itinerary.duration')}</label>
                  <Input
                    value={editingItem.duration || ''}
                    onChange={(e) => setEditingItem({...editingItem, duration: e.target.value})}
                    placeholder={`2 ${t('itinerary.hours')}`}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">{t('tripPlanner.place')}</label>
                <Input
                  value={editingItem.location || ''}
                  onChange={(e) => setEditingItem({...editingItem, location: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t('itinerary.cost')}</label>
                <Input
                  value={editingItem.cost || ''}
                  onChange={(e) => setEditingItem({...editingItem, cost: e.target.value})}
                  placeholder="€25"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleSaveItem(editingItem)} className="flex-1">
                  {t('tripPlanner.save')}
                </Button>
                <Button variant="outline" onClick={() => setEditingItem(null)} className="flex-1">
                  {t('tripPlanner.cancel')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md max-h-[80vh] overflow-hidden">
            <CardHeader className="pb-0">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <span>{t('addToTrip')}</span>
                <Button variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>

            {/* Tab Navigation */}
            <div className="px-6 pt-4">
              <div className="flex space-x-0 border-b border-gray-200">
                {[
                  { id: 'search', label: t('search'), icon: Search },
                  { id: 'saved', label: t('saved'), icon: Heart },
                  { id: 'receipt', label: t('trip.receipt'), icon: Upload },
                  { id: 'custom', label: t('trip.addCustom'), icon: Plus }
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setAddModalTab(id as any)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      addModalTab === id
                        ? 'text-black border-black'
                        : 'text-gray-500 border-transparent hover:text-gray-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <CardContent className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Search Tab */}
              {addModalTab === 'search' && (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('trip.searchPlaces')}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  {searchQuery ? (
                    <div className="text-center py-8 text-gray-500">
                      <Search className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="mb-2">{t('trip.searchDestinations')}</p>
                      <p className="text-sm">{t('trip.orExperiences')}</p>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Search className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="mb-2">{t('trip.searchDestinations')}</p>
                      <p className="text-sm">{t('trip.orExperiences')}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Saved Tab */}
              {addModalTab === 'saved' && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <ChevronDown className="w-4 h-4" />
                      <span>{t('trip.previouslySaved')}</span>
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">1</span>
                    </div>
                    
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <img 
                        src="/api/placeholder/48/48" 
                        alt="Cochem Castle" 
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">Cochem Castle</h4>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <MapPin className="w-3 h-3" />
                          <span>{t('attraction')}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <ChevronRight className="w-4 h-4" />
                      <span>{t('trip.mentionedInChat')}</span>
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">4</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Receipt Tab */}
              {addModalTab === 'receipt' && (
                <div className="space-y-4">
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 mb-2">Drag and drop your images or videos or click</p>
                    <p className="text-gray-600 mb-2">to upload</p>
                  </div>
                  
                  <div className="text-center text-sm text-gray-500">
                    <p>You can forward email receipts to <span className="text-blue-500">receipts@mindtrip.ai</span></p>
                  </div>
                </div>
              )}

              {/* Add Custom Tab */}
              {addModalTab === 'custom' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">What are you planning?</label>
                    <select
                      value={selectedItemType}
                      onChange={(e) => setSelectedItemType(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="attraction">⭐ Attraction</option>
                      <option value="hotel">🏨 Hotel</option>
                      <option value="restaurant">🍽️ Restaurant</option>
                      <option value="activity">🎪 Activity</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Place</label>
                    <input
                      type="text"
                      placeholder="Search for attractions..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Day</label>
                      <select
                        value={selectedDay_Modal}
                        onChange={(e) => setSelectedDay_Modal(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {tripDays.map(day => (
                          <option key={day} value={day}>Day {day}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Time <span className="text-xs text-gray-500">Germany Time</span>
                      </label>
                      <input
                        type="time"
                        value={selectedTime.slice(0, 5)}
                        onChange={(e) => setSelectedTime(e.target.value + ' AM')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Duration</label>
                      <select
                        value={selectedDuration}
                        onChange={(e) => setSelectedDuration(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="1h">1h</option>
                        <option value="2h">2h</option>
                        <option value="3h">3h</option>
                        <option value="4h">4h</option>
                        <option value="full day">Full Day</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Time zone</label>
                    <select
                      value={selectedTimezone}
                      onChange={(e) => setSelectedTimezone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Europe/Berlin">Europe/Berlin</option>
                      <option value="Europe/London">Europe/London</option>
                      <option value="Europe/Paris">Europe/Paris</option>
                      <option value="America/New_York">America/New_York</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Address</label>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="City"
                        value={customLocation.city}
                        onChange={(e) => setCustomLocation({...customLocation, city: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="State"
                          value={customLocation.state}
                          onChange={(e) => setCustomLocation({...customLocation, state: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <input
                          type="text"
                          placeholder="Postal code"
                          value={customLocation.postalCode}
                          onChange={(e) => setCustomLocation({...customLocation, postalCode: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <input
                        type="text"
                        placeholder="Country or Region"
                        value={customLocation.country}
                        onChange={(e) => setCustomLocation({...customLocation, country: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">People</label>
                          <select
                            value={customLocation.people}
                            onChange={(e) => setCustomLocation({...customLocation, people: Number(e.target.value)})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value={1}>1</option>
                            <option value={2}>2</option>
                            <option value={3}>3</option>
                            <option value={4}>4</option>
                            <option value={5}>5+</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">Confirmation #</label>
                          <input
                            type="text"
                            value={customLocation.confirmation}
                            onChange={(e) => setCustomLocation({...customLocation, confirmation: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Phone number</label>
                        <input
                          type="tel"
                          value={customLocation.phone}
                          onChange={(e) => setCustomLocation({...customLocation, phone: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={() => {
                      // Handle custom item creation
                      setShowAddModal(false);
                    }}
                    className="w-full bg-gray-500 hover:bg-gray-600 text-white"
                  >
                    Add
                  </Button>
                </div>
              )}
            </CardContent>

            {/* Fixed Add Button at Bottom for non-custom tabs */}
            {addModalTab !== 'custom' && (
              <div className="p-4 border-t bg-gray-50">
                <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}

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
    </SidebarContainer>
  );
}