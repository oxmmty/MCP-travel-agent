import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { MessageCircle, Search, Bot, Instagram } from 'lucide-react';
import ChatInterface from './ChatInterface';
import SearchGridView from './SearchGridView';
import { AgentActivityPanel } from './AgentActivityPanel';
import { SocialMediaContent } from './SocialMediaContent';

interface MainTabsProps {
  chatId?: number;
  destinationData?: any;
  onDestinationContext?: (metadata: any) => void;
  onHighlightElement?: (name: string, type: 'hotel' | 'attraction') => void;
  onUnhighlightElement?: () => void;
  onLocationClick?: (placeId: string, locationType: 'hotel' | 'attraction' | 'restaurant') => void;
  onActionClick?: (action: string) => void;
  showTabs?: boolean;
  onSearchQuerySent?: () => void;
  onChatCreated?: (chatId: number) => void;
  onChatItemsExtracted?: (items: Array<{name: string, type: string, coordinates?: any}>) => void;
}

export default function MainTabs({
  chatId,
  destinationData,
  onDestinationContext,
  onHighlightElement,
  onUnhighlightElement,
  onLocationClick,
  onActionClick,
  showTabs = false,
  onSearchQuerySent,
  onChatCreated,
  onChatItemsExtracted
}: MainTabsProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('chat');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const handleActionClick = (action: string) => {
    // Pass action to parent for map filtering instead of switching to search tab
    onActionClick?.(action);
  };

  const handleSearchResults = (results: any[]) => {
    setSearchResults(results);
    // Tabs are always shown now
  };

  const handleDestinationContext = (metadata: any) => {
    // Tabs are always shown now
    onDestinationContext?.(metadata);
  };

  const handleItemClick = (item: any) => {
    const placeId = item.placeId || item.id || `generated-${item.name?.toLowerCase().replace(/\s+/g, '-')}`;
    onLocationClick?.(placeId, item.type);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Animated Button Bar Navigation - Slides in from top */}
      <AnimatePresence>
        {showTabs && destinationData?.destination && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-white px-4 py-3"
          >
            <div className="flex items-center justify-center space-x-2">
              <div className="flex items-center bg-gray-50 rounded-full p-1">
                <Button
                  variant={activeTab === 'chat' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('chat')}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 transition-all ${
                    activeTab === 'chat' 
                      ? 'bg-black text-white hover:bg-gray-800' 
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <MessageCircle className="h-4 w-4" />
{t("chat")}
                </Button>
                
                <Button
                  variant={activeTab === 'search' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('search')}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 transition-all ${
                    activeTab === 'search' 
                      ? 'bg-black text-white hover:bg-gray-800' 
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <Search className="h-4 w-4" />
{t("search")}
                </Button>
                
                <Button
                  variant={activeTab === 'social' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('social')}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 transition-all ${
                    activeTab === 'social' 
                      ? 'bg-black text-white hover:bg-gray-800' 
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <Instagram className="h-4 w-4" />
{t("social")}
                </Button>
                
                <Button
                  variant={activeTab === 'agents' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('agents')}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 transition-all ${
                    activeTab === 'agents' 
                      ? 'bg-black text-white hover:bg-gray-800' 
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <Bot className="h-4 w-4" />
{t("agents")}
                </Button>
                

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsContent value="chat" className="h-full mt-0">
              <ChatInterface
                chatId={chatId}
                destinationData={destinationData}
                onDestinationContext={handleDestinationContext}
                onHighlightElement={onHighlightElement}
                onUnhighlightElement={onUnhighlightElement}
                onActionClick={handleActionClick}
                onLocationClick={onLocationClick}
                onSearchResults={handleSearchResults}
                onSearchQuerySent={onSearchQuerySent}
                onChatCreated={onChatCreated}
                onChatItemsExtracted={onChatItemsExtracted}
              />
            </TabsContent>
            


            <TabsContent value="search" className="h-full mt-0">
              <SearchGridView
                destinationData={destinationData}
                searchResults={searchResults}
                onItemClick={handleItemClick}
                onLocationClick={onLocationClick}
                onFilterChange={onActionClick}
              />
            </TabsContent>
            
            <TabsContent value="social" className="h-full mt-0">
              <SocialMediaContent
                destination={destinationData?.destination?.name || 'Munich'}
                className="h-full"
              />
            </TabsContent>
            
            <TabsContent value="agents" className="h-full mt-0">
              <AgentActivityPanel
                chatId={chatId || 1}
                onTripPlanGenerated={(tripPlan) => {
                  console.log('Trip plan generated:', tripPlan);
                  // Switch back to chat tab to show results
                  setActiveTab('chat');
                }}
              />
            </TabsContent>
            

          </Tabs>
      </div>
    </div>
  );
}