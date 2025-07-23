import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search } from 'lucide-react';
import SearchResultsTab from './SearchResultsTab';

interface SearchResult {
  id: string;
  name: string;
  type: 'hotel' | 'restaurant' | 'attraction';
  imageUrl?: string;
  rating?: number;
  description?: string;
  address?: string;
  phone?: string;
  website?: string;
  priceLevel?: number;
  category?: string;
}

interface ChatTabsProps {
  chatId?: number;
  searchResults: SearchResult[];
  onItemClick?: (item: any) => void;
  onSaveItem?: (item: SearchResult) => void;
  showTabs?: boolean;
}

export default function ChatTabs({ 
  chatId, 
  searchResults, 
  onItemClick, 
  onSaveItem, 
  showTabs = false 
}: ChatTabsProps) {
  const [activeTab, setActiveTab] = useState('search');

  if (!showTabs) {
    return null;
  }

  return (
    <div className="border-t border-gray-200 bg-white">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Suche
            {searchResults.length > 0 && (
              <span className="ml-1 bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5">
                {searchResults.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="search" className="mt-0 h-80">
          <SearchResultsTab 
            searchResults={searchResults}
            onItemClick={onItemClick}
            onSaveItem={onSaveItem}
          />
        </TabsContent>
        

      </Tabs>
    </div>
  );
}