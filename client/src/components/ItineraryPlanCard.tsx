import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Clock, MapPin, Euro, Plus, Calendar, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useQueryClient } from '@tanstack/react-query';

interface ItineraryItem {
  time: string;
  title: string;
  description: string;
  location: string;
  duration: string;
  cost: string;
}

interface ItineraryPlan {
  title: string;
  day: number;
  items: ItineraryItem[];
}

interface ItineraryPlanCardProps {
  itinerary: ItineraryPlan;
  chatId: number;
  onAddToTrip?: () => void;
}

export default function ItineraryPlanCard({ itinerary, chatId, onAddToTrip }: ItineraryPlanCardProps) {
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [isAddingAll, setIsAddingAll] = useState(false);
  const [isAddingSelected, setIsAddingSelected] = useState(false);
  const queryClient = useQueryClient();

  const handleItemSelect = (index: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === itinerary.items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(itinerary.items.map((_, index) => index)));
    }
  };

  const addItemsToTrip = async (itemIndices: number[]) => {
    try {
      for (const index of itemIndices) {
        const item = itinerary.items[index];
        await apiRequest('POST', `/api/chats/${chatId}/itinerary`, {
          itemType: 'activity',
          itemId: `cultural-discovery-${itinerary.day}-${index}`,
          itemName: item.title,
          itemData: {
            description: item.description,
            location: item.location,
            time: item.time,
            duration: item.duration,
            cost: item.cost,
            type: 'activity'
          },
          day: itinerary.day,
          order: index
        });
      }
      
      // Invalidate queries to refresh the trip sidebar
      await queryClient.invalidateQueries({ queryKey: [`/api/chats/${chatId}/itinerary`] });
      onAddToTrip?.();
    } catch (error) {
      console.error('Error adding items to trip:', error);
    }
  };

  const handleAddAllToTrip = async () => {
    setIsAddingAll(true);
    const allIndices = itinerary.items.map((_, index) => index);
    await addItemsToTrip(allIndices);
    setIsAddingAll(false);
  };

  const handleAddSelectedToTrip = async () => {
    setIsAddingSelected(true);
    await addItemsToTrip(Array.from(selectedItems));
    setIsAddingSelected(false);
    setSelectedItems(new Set());
  };

  const formatCost = (cost: string) => {
    if (!cost) return 'Preis nicht verfügbar';
    if (cost.toLowerCase() === 'free' || cost.toLowerCase() === 'kostenlos') {
      return 'Kostenlos';
    }
    return cost;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <CardTitle className="text-lg font-semibold">{itinerary.title}</CardTitle>
          </div>
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
            Tag {itinerary.day}
          </Badge>
        </div>
        <p className="text-blue-100 text-sm">
          {itinerary.items.length} Aktivitäten • Kompletter Tagesplan
        </p>
      </CardHeader>

      <CardContent className="p-6">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            onClick={handleAddAllToTrip}
            disabled={isAddingAll}
            className="flex-1 min-w-[140px]"
          >
            {isAddingAll ? (
              'Wird hinzugefügt...'
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Alles hinzufügen
              </>
            )}
          </Button>
          
          <Button
            onClick={handleSelectAll}
            variant="outline"
            className="flex-1 min-w-[120px]"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {selectedItems.size === itinerary.items.length ? 'Alle abwählen' : 'Alle auswählen'}
          </Button>
          
          {selectedItems.size > 0 && (
            <Button
              onClick={handleAddSelectedToTrip}
              disabled={isAddingSelected}
              variant="secondary"
              className="flex-1 min-w-[140px]"
            >
              {isAddingSelected ? (
                'Wird hinzugefügt...'
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  {selectedItems.size} ausgewählte hinzufügen
                </>
              )}
            </Button>
          )}
        </div>

        <Separator className="my-4" />

        {/* Itinerary Items */}
        <div className="space-y-3">
          {itinerary.items.map((item, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 transition-all cursor-pointer hover:shadow-md ${
                selectedItems.has(index)
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              onClick={() => handleItemSelect(index)}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={selectedItems.has(index)}
                  onChange={() => handleItemSelect(index)}
                  className="mt-1"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 text-sm leading-tight">
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full ml-2 flex-shrink-0">
                      <Clock className="w-3 h-3" />
                      {item.time}
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                    {item.description}
                  </p>
                  
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div className="flex items-start gap-2 text-gray-600">
                      <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0 text-gray-500" />
                      <span className="leading-tight">{item.location}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-blue-600" />
                        <span className="text-blue-700 font-medium">{item.duration}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Euro className="w-3 h-3 text-green-600" />
                        <span className="text-green-700 font-medium bg-green-50 px-2 py-1 rounded">
                          {formatCost(item.cost)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-700">
            💡 <strong>Tipp:</strong> Wählen Sie einzelne Aktivitäten aus oder fügen Sie den kompletten Plan zu Ihrer Reise hinzu. 
            Sie können die Reihenfolge später im Trip Planer anpassen.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}