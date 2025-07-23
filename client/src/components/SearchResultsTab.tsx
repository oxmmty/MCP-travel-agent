import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import SearchResultCard from './SearchResultCard';

interface SearchResult {
  id: string;
  name: string;
  type: 'hotel' | 'restaurant' | 'attraction' | 'activity';
  imageUrl?: string;
  rating?: number;
  description?: string;
  address?: string;
  vicinity?: string;
  phone?: string;
  website?: string;
  priceLevel?: number;
  category?: string;
  placeId?: string;
  location?: { lat: number; lng: number };
}

interface SearchResultsTabProps {
  searchResults: SearchResult[];
  onItemClick?: (item: SearchResult) => void;
  onSaveItem?: (item: SearchResult) => void;
  chatId?: number;
  destinationName?: string;
}

export default function SearchResultsTab({ searchResults, onItemClick, onSaveItem, chatId, destinationName }: SearchResultsTabProps) {
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>(searchResults);
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    if (selectedType === 'all') {
      setFilteredResults(searchResults);
    } else {
      setFilteredResults(searchResults.filter(item => item.type === selectedType));
    }
  }, [searchResults, selectedType]);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'hotel': return 'Hotels';
      case 'restaurant': return 'Restaurants';
      case 'attraction': return 'Sehenswürdigkeiten';
      case 'activity': return 'Aktivitäten';
      default: return type;
    }
  };

  const uniqueTypes = ['all', ...Array.from(new Set(searchResults.map(item => item.type)))];

  return (
    <div className="p-4 h-full flex flex-col">
      {/* Filter buttons */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {uniqueTypes.map((type) => (
          <Button
            key={type}
            variant={selectedType === type ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedType(type)}
            className="text-xs"
          >
            {type === 'all' ? 'Alle' : getTypeLabel(type)}
            <span className="ml-1 text-xs opacity-70">
              ({type === 'all' ? searchResults.length : searchResults.filter(item => item.type === type).length})
            </span>
          </Button>
        ))}
      </div>

      {/* Results list */}
      <div className="space-y-3 overflow-y-auto flex-1">
        {filteredResults.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>Keine Ergebnisse gefunden</p>
          </div>
        ) : (
          filteredResults.map((item) => (
            <SearchResultCard
              key={item.id}
              item={item}
              onItemClick={onItemClick}
              chatId={chatId}
              destinationName={destinationName}
            />
          ))
        )}
      </div>
    </div>
  );
}