import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, User, Send, Paperclip, MoreVertical, MapPin, Plane, Plus, Mic, X, ChevronLeft, ChevronRight, Diamond, Building, Video, Calendar } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import AttractionLink from "./AttractionLink";
import { parseMessageContent } from "@/lib/message-parser";
import ActionIcons from "./ActionIcons";
import InteractiveElement from "./InteractiveElement";
import MessageContent from "./MessageContent";
import ItineraryPlanCard from "./ItineraryPlanCard";

import type { Message, User as UserType } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from '@/hooks/useAuth';

interface ChatInterfaceProps {
  chatId?: number;
  destinationData?: any;
  onDestinationContext?: (metadata: any) => void;
  onHighlightElement?: (name: string, type: 'hotel' | 'attraction') => void;
  onUnhighlightElement?: () => void;
  onActionClick?: (action: string) => void;
  onLocationClick?: (placeId: string, locationType: 'hotel' | 'attraction' | 'restaurant') => void;
  onSearchResults?: (results: any[]) => void;
  onSearchQuerySent?: () => void;
  onChatCreated?: (chatId: number) => void;
  onChatItemsExtracted?: (items: Array<{placeId: string, name: string, type: string, coordinates?: any}>) => void;
}

export default function ChatInterface({ chatId, destinationData: propDestinationData, onDestinationContext, onHighlightElement, onUnhighlightElement, onActionClick, onLocationClick, onSearchResults, onSearchQuerySent, onChatCreated, onChatItemsExtracted }: ChatInterfaceProps) {
  const { t, i18n } = useTranslation();
  const [message, setMessage] = useState("");

  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);
  const [localDestinationData, setLocalDestinationData] = useState<any>(null);

  const [loadingStates, setLoadingStates] = useState({
    ai: false,
    places: false,
    location: false
  });

  // Loading messages for variety
  const loadingMessages = [
    "Die KI sucht dir die schönsten Plätze",
    "Ich finde die besten Empfehlungen für dich",
    "Entdecke versteckte Juwelen und Highlights",
    "Deine perfekte Reise wird zusammengestellt",
    "Die schönsten Orte werden für dich ausgewählt"
  ];
  
  const [currentLoadingMessage] = useState(() => 
    loadingMessages[Math.floor(Math.random() * loadingMessages.length)]
  );
  
  // Use prop data if available, otherwise use local state
  const destinationData = propDestinationData || localDestinationData;
  const [highlightedElement, setHighlightedElement] = useState<{name: string, type: 'hotel' | 'attraction'} | null>(null);
  const [showActionIconsForMessage, setShowActionIconsForMessage] = useState<number | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showTabs, setShowTabs] = useState(false);
  const [showExamplesModal, setShowExamplesModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  // Fallback user data if API fails
  const displayUser = currentUser || {
    firstName: "Guest",
    lastName: "User",
    email: "guest@example.com"
  };

  // Async destination data loading
  const loadDestinationData = async (destinationName: string) => {
    try {
      console.log('[ChatInterface] Loading destination data for:', destinationName);
      
      // Immediately show the destination on the map with basic info
      const immediateData = {
        destination: {
          name: destinationName,
          coordinates: null // Will be updated when data loads
        },
        hotels: [],
        attractions: [],
        needsMapData: true
      };
      
      setLocalDestinationData(immediateData);
      onDestinationContext?.(immediateData);
      
      // Load full data in background
      const response = await apiRequest("POST", "/api/destinations/load-data", {
        destinationName,
        language: i18n.language
      });
      
      if (!response.ok) {
        console.error('[ChatInterface] API error:', response.status, response.statusText);
        return;
      }
      
      const fullData = await response.json();
      
      console.log('[ChatInterface] Loaded destination data:', fullData);
      setLocalDestinationData(fullData);
      
      if (onDestinationContext) {
        onDestinationContext(fullData);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('[ChatInterface] Failed to load destination data:', error.message);
        // Don't show error to user for destination loading - just fail silently
      }
    }
  };

  const processRecommendationsForMap = async (recommendations: any[], destination: string) => {
    try {
      console.log('[ChatInterface] Processing recommendations for map update:', recommendations);
      
      // Create map markers from AI recommendations
      const recommendationMarkers = await Promise.all(
        recommendations.map(async (rec) => {
          try {
            // Try to search for the place using Google Places API
            const searchResponse = await fetch(`/api/destinations/search-place?name=${encodeURIComponent(rec.name)}&destination=${encodeURIComponent(destination)}`);
            
            if (searchResponse.ok) {
              const placeData = await searchResponse.json();
              
              return {
                id: `recommendation-${(rec.name || 'unknown').replace(/\s+/g, '-').toLowerCase()}`,
                name: rec.name,
                description: rec.description,
                lat: placeData.lat,
                lng: placeData.lng,
                type: rec.type,
                isRecommendation: true,
                source: 'ai_recommendation',
                mentionContext: rec.mentioned_in_context
              };
            }
          } catch (error) {
            console.warn(`[ChatInterface] Could not geocode recommendation: ${rec.name}`, error);
          }
          
          return null;
        })
      );

      // Filter out failed geocoding attempts
      const validMarkers = recommendationMarkers.filter(marker => marker !== null);
      
      if (validMarkers.length > 0) {
        console.log(`[ChatInterface] Successfully geocoded ${validMarkers.length} recommendations`);
        
        // Update the map with new recommendation pins
        if (onDestinationContext && localDestinationData) {
          const updatedData = {
            ...localDestinationData,
            aiRecommendations: validMarkers
          };
          
          setLocalDestinationData(updatedData);
          onDestinationContext(updatedData);
        }
      }
    } catch (error) {
      console.error('[ChatInterface] Error processing recommendations for map:', error);
    }
  };

  // Clear optimistic messages when chatId changes
  useEffect(() => {
    setOptimisticMessages([]);
  }, [chatId]);

  const { data: messages = [], isLoading, error } = useQuery<Message[]>({
    queryKey: [`/api/chats/${chatId}/messages`],
    enabled: !!chatId && chatId > 0, // Only query if we have a valid chatId
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  // Combine server messages with optimistic messages
  const allMessages = chatId && chatId > 0 ? 
    [...(messages || []), ...optimisticMessages] : 
    optimisticMessages;

  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, language, targetChatId }: { content: string; language: string; targetChatId?: number }) => {
      const activeChatId = targetChatId || chatId;
      const response = await apiRequest("POST", `/api/chats/${activeChatId}/messages`, {
        content,
        language,
      });
      return response.json();
    },
    onMutate: async ({ content, targetChatId }) => {
      // Create optimistic user message
      const activeChatId = targetChatId || chatId;
      const optimisticUserMessage: Message = {
        id: -Date.now(), // negative temporary ID to avoid conflicts
        chatId: activeChatId!,
        role: "user",
        content,
        createdAt: new Date(),
        metadata: null,
      };
      
      setOptimisticMessages([optimisticUserMessage]);
    },
    onSuccess: async (data) => {
      if (data.aiMessage) {
        const newAIMessage: Message = {
          id: data.aiMessage.id,
          chatId: data.aiMessage.chatId,
          role: data.aiMessage.role,
          content: data.aiMessage.content,
          createdAt: new Date(data.aiMessage.createdAt),
          metadata: data.aiMessage.metadata,
        };
        
        const newUserMessage: Message = {
          id: data.userMessage.id,
          chatId: data.userMessage.chatId,
          role: "user" as const,
          content: data.userMessage.content,
          createdAt: new Date(data.userMessage.createdAt),
          metadata: null,
        };
        
        // Clear optimistic state first to prevent duplicates
        setOptimisticMessages([]);
        
        // Immediate update with minimal transition
        const actualChatId = data.aiMessage.chatId;
        queryClient.setQueryData([`/api/chats/${actualChatId}/messages`], (oldMessages: Message[] = []) => [
          ...oldMessages,
          newUserMessage,
          newAIMessage
        ]);
        
        // Reset loading states
        setLoadingStates({ ai: false, places: false, location: false });
        
        // Invalidate chat list cache to update sidebar
        queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      }
      
      // If AI response has destination metadata, handle it
      if (data.aiMessage && data.aiMessage.metadata) {
        const metadata = data.aiMessage.metadata;
        
        // If this is a basic destination request, load full data asynchronously
        if (metadata.needsMapData && metadata.destinationRequested) {
          console.log('[ChatInterface] Loading destination data for:', metadata.destinationRequested);
          
          // Trigger async data loading
          loadDestinationData(metadata.destinationRequested);
        } 
        // Handle travel recommendations for map updates
        else if (metadata.needsMapUpdate && metadata.travelRecommendations) {
          console.log('[ChatInterface] Processing travel recommendations for map:', metadata.travelRecommendations);
          
          // Process recommendations and convert them to map markers
          processRecommendationsForMap(metadata.travelRecommendations, metadata.destinationForRecommendations);
        } 
        else if (onDestinationContext) {
          // Pass existing metadata to parent
          setLocalDestinationData(metadata);
          onDestinationContext(metadata);
        }
      }
    },
    onError: () => {
      // Clear optimistic messages on error
      setOptimisticMessages([]);
      // Reset loading states
      setLoadingStates({ ai: false, places: false, location: false });
    },
  });

  // Simple language detection function
  const detectLanguage = (text: string): string => {
    const lowerText = text.toLowerCase();
    
    // German detection
    if (
      lowerText.includes('ich') || 
      lowerText.includes('mir') || 
      lowerText.includes('mein') ||
      lowerText.includes('eine') ||
      lowerText.includes('nach') ||
      lowerText.includes('bitte') ||
      lowerText.includes('danke') ||
      lowerText.includes('möchte') ||
      lowerText.includes('reise')
    ) {
      return 'de';
    }
    
    // Spanish detection
    if (
      lowerText.includes('hola') || 
      lowerText.includes('quiero') || 
      lowerText.includes('viaje') ||
      lowerText.includes('por favor') ||
      lowerText.includes('gracias') ||
      lowerText.includes('donde') ||
      lowerText.includes('como') ||
      lowerText.includes('está')
    ) {
      return 'es';
    }
    
    // French detection
    if (
      lowerText.includes('je') || 
      lowerText.includes('voyage') || 
      lowerText.includes('bonjour') ||
      lowerText.includes('merci') ||
      lowerText.includes('voudrais') ||
      lowerText.includes('avec') ||
      lowerText.includes('pour') ||
      lowerText.includes('dans')
    ) {
      return 'fr';
    }
    
    // Default to English
    return 'en';
  };

  // Optimized message handler with normal API calls and progressive UI
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !chatId || loadingStates.ai) return;

    const messageToSend = message.trim();
    
    // Auto-detect and change language based on input
    const detectedLang = detectLanguage(messageToSend);
    if (detectedLang !== i18n.language) {
      i18n.changeLanguage(detectedLang);
    }

    // Notify parent that a search query was sent
    onSearchQuerySent?.();

    // Clear input immediately for better UX
    setMessage("");

    // Set progressive loading states
    setLoadingStates({ ai: true, places: false, location: false });

    // If this is a temporary chat (chatId === -1), create a real chat first
    if (chatId === -1) {
      try {
        const createResponse = await apiRequest("POST", "/api/chats", {
          title: messageToSend.length > 50 ? messageToSend.substring(0, 47) + "..." : messageToSend,
          language: detectedLang
        });
        
        if (createResponse.ok) {
          const newChat = await createResponse.json();
          onChatCreated?.(newChat.id);
          
          // Use normal mutation with new chat ID
          sendMessageMutation.mutate({ 
            content: messageToSend, 
            language: detectedLang, 
            targetChatId: newChat.id 
          });
        }
      } catch (error) {
        console.error('Error creating chat:', error);
        setLoadingStates({ ai: false, places: false, location: false });
      }
    } else {
      // Use normal mutation for existing chat
      sendMessageMutation.mutate({ content: messageToSend, language: detectedLang });
    }
  };

  // Reset loading states when needed
  const resetLoadingStates = () => {
    setLoadingStates({
      ai: false,
      places: false,
      location: false
    });
    setOptimisticMessages([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as any);
    }
  };

  const handleHighlight = (name: string, type: 'hotel' | 'attraction') => {
    console.log('Highlighting:', name, type);
    setHighlightedElement({ name, type });
    onHighlightElement?.(name, type);
  };

  const handleUnhighlight = () => {
    console.log('Unhighlighting');
    setHighlightedElement(null);
    onUnhighlightElement?.();
  };

  const handleActionClick = async (action: string) => {
    if (!destinationData?.destination) return;

    // Pass action to parent for map filtering instead of showing search results
    onActionClick?.(action);
  };

  const handleItemClick = (item: any) => {
    // Open detail sidebar for the selected item
    onLocationClick?.(item.name, item.type);
  };

  const handleSaveItem = async (item: any) => {
    if (!chatId) return;

    try {
      await apiRequest('POST', '/api/favorites', {
        userId: 1, // Default user
        itemId: item.id,
        itemName: item.name,
        itemType: item.type,
        itemData: item
      });
    } catch (error) {
      console.error('Error saving item:', error);
    }
  };

  const shouldShowActionIcons = (content: string, messageIndex: number) => {
    // Show for all assistant messages when we have destination data
    const message = allMessages[messageIndex];
    console.log('shouldShowActionIcons check:', {
      messageRole: message?.role,
      contentLength: content.length,
      hasDestination: !!destinationData?.destination,
      shouldShow: message?.role === "assistant" && content.length > 50 && !!destinationData?.destination
    });
    return message?.role === "assistant" && content.length > 50 && !!destinationData?.destination;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [allMessages]);

  // Reset optimistic messages when chat changes
  useEffect(() => {
    setOptimisticMessages([]);
  }, [chatId]);

  // Process existing message metadata when messages are loaded (for chat restoration)
  useEffect(() => {
    if (!messages || messages.length === 0) return;

    // Find the most recent assistant message with relevant metadata
    const relevantMessages = messages
      .filter(msg => msg.role === "assistant" && msg.metadata)
      .reverse(); // Start with most recent

    for (const msg of relevantMessages) {
      const metadata = msg.metadata;
      
      // Process destination data if available
      if (metadata && typeof metadata === 'object') {
        // Handle destination metadata
        if (metadata.needsMapData && metadata.destinationRequested) {
          console.log('[ChatInterface] Restoring destination data for:', metadata.destinationRequested);
          loadDestinationData(metadata.destinationRequested);
          break; // Only process the most recent destination
        }
        // Handle travel recommendations
        else if (metadata.needsMapUpdate && metadata.travelRecommendations) {
          console.log('[ChatInterface] Restoring travel recommendations for map:', metadata.travelRecommendations);
          processRecommendationsForMap(metadata.travelRecommendations, metadata.destinationForRecommendations);
          break;
        }
        // Handle general destination context
        else if (metadata.destination || metadata.hotels || metadata.attractions) {
          console.log('[ChatInterface] Restoring destination context from metadata');
          setLocalDestinationData(metadata);
          if (onDestinationContext) {
            onDestinationContext(metadata);
          }
          break;
        }
      }
    }
  }, [messages, chatId]); // Re-run when messages change or chat changes

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return t("justNow");
    if (minutes < 60) return t("minutesAgo", { count: minutes });
    if (hours < 24) return t("hoursAgo", { count: hours });
    return new Date(date).toLocaleDateString();
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('i18nextLng', lng);
  };

  if (!chatId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-red-500">Error loading messages: {error.message}</div>
          </div>
        ) : allMessages.length === 0 ? (
          <div className="flex flex-col h-full">
            {/* Main Welcome Content */}
            <div className="flex flex-col items-start justify-start px-6 pt-8 pb-4">
              {/* Personalized Greeting */}
              <h1 className="text-2xl text-gray-900 mb-8 font-bold">
                {t('welcomeGreeting', { name: currentUser?.firstName || 'Marcus' })}
              </h1>
              
              {/* Assistant Message */}
              <div className="flex items-start space-x-3 mb-6">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-[#000000]">
                  <Plane className="h-5 w-5 text-white" />
                </div>
                <div className="bg-gray-50 rounded-lg px-4 py-3 max-w-md">
                  <p className="text-gray-800 text-sm">
                    {t('assistantIntro')}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Bottom Section with Input */}
            <div className="flex-1 flex flex-col justify-end">
              <div className="px-6 pb-4">
                {/* Removed duplicate text here */}
              </div>
            </div>
          </div>
        ) : (
          allMessages.map((msg, index) => (
            <motion.div
              key={`${msg.id}-${index}`}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className={`flex space-x-3 ${msg.role === "user" ? "justify-end" : ""}`}
            >
              {msg.role === "assistant" && (
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="text-gray-600 h-5 w-5" />
                </div>
              )}
              
              <div className={`flex-1 ${msg.role === "user" ? "flex justify-end" : ""}`}>
                <div className={msg.role === "user" ? "flex flex-col items-end" : ""}>
                  <div
                    className={`rounded-2xl px-4 py-3 max-w-2xl shadow-sm ${
                      msg.role === "user"
                        ? "bg-black text-white"
                        : "bg-card border border-border text-foreground"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none text-foreground leading-relaxed">
                        <MessageContent 
                          content={msg.content}
                          destinationData={destinationData}
                          chatId={chatId}
                          onHighlight={handleHighlight}
                          onUnhighlight={handleUnhighlight}
                          onLocationClick={onLocationClick}
                          onChatItemsExtracted={onChatItemsExtracted}
                        />
                        
                        {/* Display Cultural Discovery Itinerary if available */}
                        {msg.metadata && typeof msg.metadata === 'object' && msg.metadata !== null && 
                         'itinerary' in msg.metadata && 'showItineraryInChat' in msg.metadata && 
                         (msg.metadata as any).showItineraryInChat && (
                          <div className="mt-4">
                            <ItineraryPlanCard
                              itinerary={(msg.metadata as any).itinerary}
                              chatId={chatId}
                              onAddToTrip={() => {
                                // Refresh trip sidebar by invalidating itinerary query
                                queryClient.invalidateQueries({ queryKey: [`/api/chats/${chatId}/itinerary`] });
                              }}
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 mr-3">
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
                
                {/* Action Icons removed - they are now only displayed on the map */}
              </div>

              {msg.role === "user" && (
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="text-gray-600 h-5 w-5" />
                </div>
              )}
            </motion.div>
          ))
        )}

        {/* Bot Loading Animation */}
        {sendMessageMutation.isPending && (
          <div className="flex space-x-3">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="text-gray-600 h-5 w-5" />
            </div>
            <div className="bg-card border border-border rounded-2xl px-4 py-3 shadow-sm max-w-2xl">
              <div className="flex items-center space-x-2">
                <span className="text-base">Ich finde die besten Empfehlungen für dich</span>
                <motion.span 
                  className="text-gray-400 text-base"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  ...
                </motion.span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
      {/* Chat Input */}
      <div className="px-6 py-4 bg-white flex-shrink-0">
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div></div>
          <div className="text-right">
            <Button
              onClick={() => setShowExamplesModal(true)}
              className="text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 hover:text-gray-700 px-3 py-1 rounded-full border border-gray-200"
            >
              {t("whatCanIAsk")}
            </Button>
          </div>
        </div>
        <form onSubmit={handleSendMessage} className="relative">
          <div className="relative">
            <textarea
              placeholder={t("askAnything")}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full py-3 px-4 pr-20 rounded-3xl border-2 border-black focus:ring-0 focus:border-black text-gray-700 placeholder-gray-400 text-base resize-none h-12 leading-relaxed"
              disabled={loadingStates.ai}
              autoFocus
              rows={2}
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600"
              >
                <Mic className="w-5 h-5" />
              </button>
              <Button
                type="submit"
                disabled={!message.trim() || loadingStates.ai}
                size="sm"
                className="rounded-full bg-gray-300 hover:bg-gray-400 text-gray-600 p-2 h-8 w-8"
              >
                {loadingStates.ai ? (
                  <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </form>
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-400">
            <svg className="w-3 h-3 inline mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {t("takeMe")} {t("canMakeMistakes")}. {t("checkImportantInfo")}.
          </p>
        </div>
      </div>

      {/* Examples Modal */}
      {showExamplesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {t("examplesTitle")}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowExamplesModal(false)}
                className="p-1"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer" onClick={() => {
                  setMessage("What's the best island in Hawaii for a family vacation? Include a comparison of all the islands.");
                  setShowExamplesModal(false);
                }}>
                  <div className="flex items-start space-x-3">
                    <Diamond className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Discover places to visit</h3>
                      <p className="text-sm text-gray-600">
                        What's the best island in Hawaii for a family vacation? Include a comparison of all the islands.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer" onClick={() => {
                  setMessage("Show me five star hotels in Taormina for a trip in March.");
                  setShowExamplesModal(false);
                }}>
                  <div className="flex items-start space-x-3">
                    <Building className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Hotel suggestions</h3>
                      <p className="text-sm text-gray-600">
                        Show me five star hotels in Taormina for a trip in March.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer" onClick={() => {
                  setMessage("This YouTube video has 5 recommendations for Monterey. Plan me a weekend getaway to experience them.");
                  setShowExamplesModal(false);
                }}>
                  <div className="flex items-start space-x-3">
                    <Video className="h-5 w-5 text-gray-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">YouTube</h3>
                      <p className="text-sm text-gray-600">
                        This YouTube video has 5 recommendations for Monterey. Plan me a weekend getaway to experience them.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer" onClick={() => {
                  setMessage("Create an itinerary for a 5 day trip to Paris staying at the Sofitel La Faubourg. I want to see all the sights plus some offbeat items.");
                  setShowExamplesModal(false);
                }}>
                  <div className="flex items-start space-x-3">
                    <Calendar className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Itineraries and trip plans</h3>
                      <p className="text-sm text-gray-600">
                        Create an itinerary for a 5 day trip to Paris staying at the Sofitel La Faubourg. I want to see all the sights plus some offbeat items.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" className="p-2">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-900 rounded-full"></div>
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                </div>
                <Button variant="ghost" size="sm" className="p-2">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}