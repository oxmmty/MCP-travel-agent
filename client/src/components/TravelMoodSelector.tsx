import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, CheckCircle, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface TravelMoodSelectorProps {
  chatId: number;
  destination?: string;
  onMoodSelected?: (mood: MockTravelMood) => void;
  onClose?: () => void;
}

// Mock Travel Moods für die Demonstration
interface MockTravelMood {
  id: number;
  nameKey: string;
  descriptionKey: string;
  shortDescKey: string;
  icon: string;
  color: string;
  keywords: string[];
}

const MOCK_TRAVEL_MOODS: MockTravelMood[] = [
  {
    id: 1,
    nameKey: "culture_lover",
    descriptionKey: "culture_lover_desc",
    shortDescKey: "culture_lover_short",
    icon: "🏛️",
    color: "#8b5cf6",
    keywords: ["kultur", "museum", "geschichte", "kunst"]
  },
  {
    id: 2,
    nameKey: "adventurer",
    descriptionKey: "adventurer_desc", 
    shortDescKey: "adventurer_short",
    icon: "🏔️",
    color: "#ef4444",
    keywords: ["abenteuer", "wandern", "outdoor", "adrenalin"]
  },
  {
    id: 3,
    nameKey: "relaxation",
    descriptionKey: "relaxation_desc",
    shortDescKey: "relaxation_short",
    icon: "🧘",
    color: "#10b981",
    keywords: ["wellness", "spa", "entspannung", "ruhe"]
  },
  {
    id: 4,
    nameKey: "foodie",
    descriptionKey: "foodie_desc",
    shortDescKey: "foodie_short",
    icon: "🍷",
    color: "#f59e0b",
    keywords: ["essen", "trinken", "restaurant", "kulinarik"]
  },
  {
    id: 5,
    nameKey: "nature_lover",
    descriptionKey: "nature_lover_desc",
    shortDescKey: "nature_lover_short",
    icon: "🌿",
    color: "#059669",
    keywords: ["natur", "park", "garten", "landschaft"]
  },
  {
    id: 6,
    nameKey: "shopping_style",
    descriptionKey: "shopping_style_desc",
    shortDescKey: "shopping_style_short",
    icon: "🛍️",
    color: "#ec4899",
    keywords: ["shopping", "mode", "markt", "einkaufen"]
  },
  {
    id: 7,
    nameKey: "nightlife",
    descriptionKey: "nightlife_desc",
    shortDescKey: "nightlife_short",
    icon: "🌙",
    color: "#6366f1",
    keywords: ["nachtleben", "bar", "club", "unterhaltung"]
  },
  {
    id: 8,
    nameKey: "family_kids",
    descriptionKey: "family_kids_desc",
    shortDescKey: "family_kids_short",
    icon: "👨‍👩‍👧‍👦",
    color: "#06b6d4",
    keywords: ["familie", "kinder", "spielplatz", "familienfreundlich"]
  }
];

export default function TravelMoodSelector({ chatId, destination, onMoodSelected, onClose }: TravelMoodSelectorProps) {
  const [selectedMood, setSelectedMood] = useState<MockTravelMood | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const handleMoodSelect = async (mood: MockTravelMood) => {
    setSelectedMood(mood);
    setIsLoading(true);
    onMoodSelected?.(mood);
    
    const userMessage = {
      content: t('mood_selection_message', `🎯 I choose "{{moodName}}" as my travel style{{destination}}! {{icon}}

{{description}}

As a {{moodNameLower}}, what can you recommend for this trip? Which activities, places or experiences fit perfectly with this travel style?`, {
        moodName: t(mood.nameKey),
        destination: destination ? ` ${t('for', 'for')} ${destination}` : '',
        icon: mood.icon,
        description: t(mood.descriptionKey),
        moodNameLower: t(mood.nameKey).toLowerCase()
      }),
      role: 'user',
      chatId,
      createdAt: new Date().toISOString(),
      id: Date.now() // Temporary ID
    };

    // Immediately add user message to chat UI
    queryClient.setQueryData([`/api/chats/${chatId}/messages`], (oldMessages: any[]) => {
      return [...(oldMessages || []), userMessage];
    });

    // Add loading message for AI response
    const loadingMessage = {
      content: t('generating_recommendations', '✨ Generating personalized recommendations for {{moodName}}...', {
        moodName: t(mood.nameKey).toLowerCase()
      }),
      role: 'assistant',
      chatId,
      createdAt: new Date().toISOString(),
      id: Date.now() + 1, // Temporary ID
      isLoading: true
    };

    queryClient.setQueryData([`/api/chats/${chatId}/messages`], (oldMessages: any[]) => {
      return [...(oldMessages || []), loadingMessage];
    });

    toast({
      title: t('mood_selected_title', 'Travel Style Selected!'),
      description: t('mood_selected_ai_desc', `${t(mood.nameKey)} selected - AI is now creating personalized recommendations!`)
    });

    // Auto-close the mood selector to return to chat
    setTimeout(() => {
      onClose?.();
    }, 800); // Short delay to show success state

    // Only send mood selection for real chats, not temporary ones
    if (chatId && chatId > 0) {
      try {
        const response = await fetch(`/api/chats/${chatId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: userMessage.content,
            role: 'user'
          })
        });

        if (response.ok) {
          // Remove loading message and refresh to get real AI response
          await queryClient.invalidateQueries({ queryKey: [`/api/chats/${chatId}/messages`] });
        } else {
          throw new Error('Failed to send message');
        }
      } catch (error) {
        console.error('Error sending mood selection:', error);
        // Remove loading message on error
        queryClient.setQueryData([`/api/chats/${chatId}/messages`], (oldMessages: any[]) => {
          return (oldMessages || []).filter((msg: any) => msg.id !== loadingMessage.id);
        });
        
        toast({
          title: t('error', 'Error'),
          description: t('mood_selection_error', 'Failed to send travel style to AI. Please try again.'),
          variant: "destructive"
        });
      }
    } else {
      console.log('Skipping mood selection for temporary chat');
      // Remove loading message for temporary chats
      queryClient.setQueryData([`/api/chats/${chatId}/messages`], (oldMessages: any[]) => {
        return (oldMessages || []).filter((msg: any) => msg.id !== loadingMessage.id);
      });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            {t('select_travel_style', 'Select Your Travel Style')}
          </CardTitle>
          <CardDescription>
            {t('select_style_description', 'Choose the style that best fits your planned trip.')}
            {selectedMood && (
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {t('selected', 'Selected')}: {t(selectedMood.nameKey)} {selectedMood.icon}
                </Badge>
              </div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Demo-Hinweis */}
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
              <Info className="w-4 h-4" />
              <span className="text-sm font-medium">{t('demo_version', 'Demo Version')}</span>
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              {t('demo_version_desc', 'This is a mock-up version. Full implementation with map filtering will follow later.')}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {MOCK_TRAVEL_MOODS.map((mood) => (
              <motion.div
                key={mood.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md min-h-[120px] ${
                    selectedMood?.id === mood.id
                      ? 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => handleMoodSelect(mood)}
                >
                  <CardContent className="p-3 text-center flex flex-col justify-between h-full">
                    <div className="flex flex-col items-center flex-1 justify-center">
                      <div 
                        className="text-2xl mb-2 relative"
                        style={{ color: mood.color }}
                      >
                        {mood.icon}
                        {selectedMood?.id === mood.id && !isLoading && (
                          <CheckCircle className="absolute -top-1 -right-1 w-4 h-4 text-purple-500 bg-white rounded-full" />
                        )}
                        {isLoading && selectedMood?.id === mood.id && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                            <div className="animate-spin h-3 w-3 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                          </div>
                        )}
                      </div>
                      <h3 className="font-semibold text-sm mb-1 text-center leading-tight">
                        {t(mood.nameKey)}
                      </h3>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 text-center leading-tight">
                      {t(mood.shortDescKey)}
                    </p>
                    {isLoading && selectedMood?.id === mood.id && (
                      <div className="mt-1 text-xs text-purple-600 dark:text-purple-400">
                        {t('sending_to_ai', 'Sending to AI...')}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {selectedMood && (
            <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="font-medium text-purple-800 dark:text-purple-200">
                  {t('selected_travel_style', 'Selected Travel Style')}: {t(selectedMood.nameKey)}
                </span>
              </div>
              <div className="text-sm text-purple-700 dark:text-purple-300">
                {t(selectedMood.descriptionKey)}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {selectedMood.keywords.map((keyword) => (
                  <Badge key={keyword} variant="outline" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}