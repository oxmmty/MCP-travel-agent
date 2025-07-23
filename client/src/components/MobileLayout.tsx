import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Map, Route, Sparkles, X, MessageCircle, Menu, Globe, Calendar, Calculator, Plus, ChevronLeft, ChevronRight, Save } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ChatInterface from "./ChatInterface";
import MapboxMap from "./MapboxMap";
import ActionIcons from "./ActionIcons";
import TravelMoodSelector from "./TravelMoodSelector";
import TripSidebar from "./TripSidebar";

interface MobileLayoutProps {
  chatId?: number;
  destinationData?: any;
  onDestinationContext?: (metadata: any) => void;
  onHighlightElement?: (name: string, type: 'hotel' | 'attraction') => void;
  onUnhighlightElement?: () => void;
  mapMarkers?: any[];
  mapCenter?: { lat: number; lng: number };
  showActionIcons?: boolean;
  onActionClick?: (action: string) => void;
  onLocationClick?: (locationName: string, locationType: 'hotel' | 'attraction') => void;
  onMarkerClick?: (marker: any) => void;
  onNewChat?: () => void;
  onMenuClick?: () => void;
  showTabs?: boolean;
  onSearchQuerySent?: () => void;
  onChatCreated?: (chatId: number) => void;
}

type MobileView = 'chat' | 'map' | 'mood' | 'trip';

export default function MobileLayout({
  chatId,
  destinationData,
  onDestinationContext,
  onHighlightElement,
  onUnhighlightElement,
  mapMarkers = [],
  mapCenter = { lat: 48.1351, lng: 11.582 },
  showActionIcons = false,
  onActionClick,
  onLocationClick,
  onMarkerClick,
  onNewChat,
  onMenuClick,
  showTabs = false,
  onSearchQuerySent,
  onChatCreated
}: MobileLayoutProps) {
  const { t, i18n } = useTranslation();
  const [activeView, setActiveView] = useState<MobileView>('chat');
  const [isMoodSelectorOpen, setIsMoodSelectorOpen] = useState(false);
  const [isTripSidebarOpen, setIsTripSidebarOpen] = useState(false);

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'de', label: 'Deutsch' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
  ];

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const handleViewChange = (view: MobileView) => {
    if (view === 'chat') {
      setActiveView('chat');
    } else if (view === 'map') {
      setActiveView('map');
    } else if (view === 'mood') {
      setActiveView('mood');
      setIsMoodSelectorOpen(true);
    } else if (view === 'trip') {
      setActiveView('trip');
      setIsTripSidebarOpen(true);
    }
  };

  const handleBackToChat = () => {
    setActiveView('chat');
    setIsMoodSelectorOpen(false);
    setIsTripSidebarOpen(false);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Mobile Header Bar */}
      <div className="h-14 border-b border-border flex items-center justify-between px-4 bg-background">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="hover:bg-accent"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <img
            src="/takemeto-logo.png"
            alt="takemeto"
            className="h-6 w-auto"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger className="gap-2 bg-transparent hover:bg-accent hover:text-accent-foreground h-9 px-3 text-sm font-normal flex items-center">
              <Globe className="h-4 w-4" />
              {languages.find(l => l.code === i18n.language)?.label}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                >
                  <span>{lang.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Chat View */}
        <AnimatePresence mode="wait">
          {activeView === 'chat' && (
            <motion.div
              key="chat"
              initial={{ x: 0 }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: "tween", duration: 0.3 }}
              className="absolute inset-0 flex flex-col"
            >
              <div className="flex-1 overflow-hidden">
                <ChatInterface
                  chatId={chatId}
                  destinationData={destinationData}
                  onDestinationContext={onDestinationContext}
                  onHighlightElement={onHighlightElement}
                  onUnhighlightElement={onUnhighlightElement}
                  onActionClick={onActionClick}
                  onLocationClick={onLocationClick}
                  onSearchQuerySent={onSearchQuerySent}
                  onChatCreated={onChatCreated}
                />
              </div>
              
              {/* Mobile Navigation Buttons - Only show after search query */}
              {showTabs && destinationData?.destination && (
                <motion.div
                  initial={{ y: 60, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 60, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="bg-background p-3"
                >
                  <div className="flex items-center justify-center">
                    <div className="flex items-center bg-gray-50 rounded-full p-1">
                      <Button
                        variant={activeView === 'chat' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => handleViewChange('chat')}
                        className={`flex items-center gap-1 rounded-full px-3 py-2 transition-all ${
                          activeView === 'chat' 
                            ? 'bg-black text-white hover:bg-gray-800' 
                            : 'hover:bg-gray-100 text-gray-600'
                        }`}
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-xs">Chat</span>
                      </Button>
                      
                      <Button
                        variant={activeView === 'mood' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => handleViewChange('mood')}
                        className={`flex items-center gap-1 rounded-full px-3 py-2 transition-all ${
                          activeView === 'mood' 
                            ? 'bg-black text-white hover:bg-gray-800' 
                            : 'hover:bg-gray-100 text-gray-600'
                        }`}
                      >
                        <Sparkles className="w-4 h-4" />
                        <span className="text-xs">Mood</span>
                      </Button>
                      
                      <Button
                        variant={activeView === 'map' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => handleViewChange('map')}
                        className={`flex items-center gap-1 rounded-full px-3 py-2 transition-all ${
                          activeView === 'map' 
                            ? 'bg-black text-white hover:bg-gray-800' 
                            : 'hover:bg-gray-100 text-gray-600'
                        }`}
                      >
                        <Map className="w-4 h-4" />
                        <span className="text-xs">{t('navigation.map', 'Map')}</span>
                      </Button>
                      
                      <Button
                        variant={activeView === 'trip' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => handleViewChange('trip')}
                        className={`flex items-center gap-1 rounded-full px-3 py-2 transition-all ${
                          activeView === 'trip' 
                            ? 'bg-black text-white hover:bg-gray-800' 
                            : 'hover:bg-gray-100 text-gray-600'
                        }`}
                      >
                        <Route className="w-4 h-4" />
                        <span className="text-xs">{t('navigation.trip', 'Trip')}</span>
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Map View - Full Screen Overlay */}
          {activeView === 'map' && (
            <motion.div
              key="map"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "tween", duration: 0.3 }}
              className="absolute inset-0 flex flex-col bg-background z-50"
            >
              {/* Map Header */}
              <div className="bg-background border-b border-border px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {destinationData?.destination && (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg">{destinationData.destination.name}</span>
                      <span className="text-gray-500">•</span>
                      <span className="text-sm text-gray-600">2 travelers</span>
                    </div>
                  )}
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToChat}
                  title="Back to Chat"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Map Container */}
              <div className="flex-1 relative">
                <MapboxMap
                  center={mapCenter}
                  markers={mapMarkers}
                  zoom={13}
                  height="100%"
                  onMarkerClick={onMarkerClick}
                />
                
                {/* Action Icons Overlay */}
                {showActionIcons && (
                  <div className="absolute top-3 left-4 right-4 z-10">
                    <ActionIcons 
                      onActionClick={onActionClick}
                    />
                  </div>
                )}
              </div>

              {/* Bottom Navigation */}
              <div className="border-t border-border bg-background p-3">
                <div className="grid grid-cols-4 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleViewChange('chat')}
                    className="flex flex-col items-center gap-1 h-12 text-xs"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Chat</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleViewChange('mood')}
                    className="flex flex-col items-center gap-1 h-12 text-xs"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Mood</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleViewChange('map')}
                    className="flex flex-col items-center gap-1 h-12 text-xs bg-blue-50 border-blue-300 text-blue-700"
                  >
                    <Map className="w-4 h-4" />
                    <span>{t('navigation.map', 'Map')}</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleViewChange('trip')}
                    className="flex flex-col items-center gap-1 h-12 text-xs"
                  >
                    <Route className="w-4 h-4" />
                    <span>{t('navigation.trip', 'Trip')}</span>
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Mood View - Full Screen Overlay */}
          {activeView === 'mood' && (
            <motion.div
              key="mood"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "tween", duration: 0.3 }}
              className="absolute inset-0 flex flex-col bg-background z-50"
            >
              {/* Mood Header */}
              <div className="bg-background border-b border-border px-4 py-3 flex items-center justify-between">
                <h2 className="font-semibold text-lg">Travel Mood</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToChat}
                  title="Back to Chat"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Mood Content */}
              <div className="flex-1 overflow-hidden">
                <TravelMoodSelector
                  chatId={chatId || 1}
                  destination={destinationData?.name}
                  onClose={handleBackToChat}
                />
              </div>

              {/* Bottom Navigation */}
              <div className="border-t border-border bg-background p-3">
                <div className="grid grid-cols-4 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleViewChange('chat')}
                    className="flex flex-col items-center gap-1 h-12 text-xs"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Chat</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleViewChange('mood')}
                    className="flex flex-col items-center gap-1 h-12 text-xs bg-purple-50 border-purple-300 text-purple-700"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Mood</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleViewChange('map')}
                    className="flex flex-col items-center gap-1 h-12 text-xs"
                  >
                    <Map className="w-4 h-4" />
                    <span>{t('navigation.map', 'Map')}</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleViewChange('trip')}
                    className="flex flex-col items-center gap-1 h-12 text-xs"
                  >
                    <Route className="w-4 h-4" />
                    <span>{t('navigation.trip', 'Trip')}</span>
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Trip View - Full Screen Overlay */}
          {activeView === 'trip' && (
            <motion.div
              key="trip"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "tween", duration: 0.3 }}
              className="absolute inset-0 flex flex-col bg-background z-50"
            >
              {/* Trip Header */}
              <div className="bg-background border-b border-border px-4 py-3 flex items-center justify-between">
                <h2 className="font-semibold text-lg">{t('navigation.trip', 'Trip')}</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToChat}
                  title="Back to Chat"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Trip Content */}
              <div className="flex-1 overflow-hidden">
                <div className="h-full flex flex-col p-4">
                  {/* Trip Planning Interface */}
                  <div className="space-y-4">
                    {/* Trip Duration */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-3 flex-1">
                        <Calendar className="w-4 h-4 text-gray-600" />
                        <span className="text-sm">3 Days</span>
                      </div>
                      <Button variant="outline" className="flex items-center gap-2">
                        <Calculator className="w-4 h-4" />
                        SMT-Solver
                      </Button>
                    </div>

                    {/* Generate Trip Plan Button */}
                    <Button className="w-full bg-red-500 hover:bg-red-600 text-white py-3">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate AI Trip Plan
                    </Button>

                    {/* Add Activity Button */}
                    <Button variant="outline" className="w-full py-3">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Activity
                    </Button>

                    {/* Distances Toggle */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Distances</span>
                      <div className="w-12 h-6 bg-blue-500 rounded-full relative">
                        <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5"></div>
                      </div>
                    </div>
                  </div>

                  {/* Trip Days */}
                  <div className="flex-1 mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">Day 1</h3>
                        <p className="text-sm text-gray-600">of 3 days</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm">Day 2</span>
                        <Button variant="ghost" size="sm">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Day Content */}
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                      <div className="text-gray-500 mb-4">
                        <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No activities for Day 1 yet</p>
                      </div>
                      <Button variant="outline" className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Add first activity
                      </Button>
                    </div>
                  </div>

                  {/* Save Trip Plan Button */}
                  <div className="mt-4">
                    <Button className="w-full bg-red-500 hover:bg-red-600 text-white py-3">
                      <Save className="w-4 h-4 mr-2" />
                      Save Trip Plan
                    </Button>
                  </div>
                </div>
              </div>

              {/* Bottom Navigation */}
              <div className="border-t border-border bg-background p-3">
                <div className="grid grid-cols-4 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleViewChange('chat')}
                    className="flex flex-col items-center gap-1 h-12 text-xs"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Chat</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleViewChange('mood')}
                    className="flex flex-col items-center gap-1 h-12 text-xs"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Mood</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleViewChange('map')}
                    className="flex flex-col items-center gap-1 h-12 text-xs"
                  >
                    <Map className="w-4 h-4" />
                    <span>{t('navigation.map', 'Map')}</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleViewChange('trip')}
                    className="flex flex-col items-center gap-1 h-12 text-xs bg-blue-50 border-blue-300 text-blue-700"
                  >
                    <Route className="w-4 h-4" />
                    <span>{t('navigation.trip', 'Trip')}</span>
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}