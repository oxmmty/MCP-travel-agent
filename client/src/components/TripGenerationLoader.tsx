import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Sparkles, 
  Search, 
  Hotel, 
  MapPin, 
  Utensils, 
  Calendar,
  Route,
  Heart,
  Compass,
  Camera
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface LoadingPhase {
  id: number;
  icon: React.ElementType;
  titleKey: string;
  messagesKey: string[];
  duration: number;
  progress: number;
}

const loadingPhases: LoadingPhase[] = [
  {
    id: 1,
    icon: Search,
    titleKey: 'trip.loading.destinationAgent',
    messagesKey: [
      'trip.loading.messages.findingHiddenGems',
      'trip.loading.messages.checkingWeather',
      'trip.loading.messages.analyzingBestTimes'
    ],
    duration: 6000,
    progress: 50
  },
  {
    id: 2,
    icon: Calendar,
    titleKey: 'trip.loading.itineraryAgent',
    messagesKey: [
      'trip.loading.messages.optimizingSchedule',
      'trip.loading.messages.balancingActivities',
      'trip.loading.messages.addingFreeTime'
    ],
    duration: 8000,
    progress: 90
  },
  {
    id: 3,
    icon: Route,
    titleKey: 'trip.loading.integratingResults',
    messagesKey: [
      'trip.loading.messages.addingPersonalTouch',
      'trip.loading.messages.doubleChecking',
      'trip.loading.messages.almostReady'
    ],
    duration: 2000,
    progress: 100
  }
];

interface TripGenerationLoaderProps {
  currentStatus?: {
    agent: string;
    action: string;
    details?: string;
    progress?: number;
  } | null;
}

export default function TripGenerationLoader({ currentStatus }: TripGenerationLoaderProps) {
  const { t } = useTranslation();
  const [currentPhase, setCurrentPhase] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const phaseTimer = setTimeout(() => {
      if (currentPhase < loadingPhases.length - 1) {
        setCurrentPhase(currentPhase + 1);
        setCurrentMessage(0);
      }
    }, loadingPhases[currentPhase].duration);

    return () => clearTimeout(phaseTimer);
  }, [currentPhase]);

  useEffect(() => {
    const messageTimer = setInterval(() => {
      const phase = loadingPhases[currentPhase];
      setCurrentMessage((prev) => (prev + 1) % phase.messagesKey.length);
    }, 1500);

    return () => clearInterval(messageTimer);
  }, [currentPhase]);

  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        const targetProgress = loadingPhases[currentPhase].progress;
        if (prev < targetProgress) {
          return Math.min(prev + 2, targetProgress);
        }
        return prev;
      });
    }, 100);

    return () => clearInterval(progressTimer);
  }, [currentPhase]);

  // Use real server status if available, otherwise fallback to local phases
  const displayStatus = currentStatus || {
    agent: loadingPhases[currentPhase].titleKey,
    action: loadingPhases[currentPhase].messagesKey[currentMessage],
    progress: progress
  };

  const getAgentIcon = (agentName: string) => {
    if (!agentName) return loadingPhases[currentPhase].icon;
    if (agentName.includes('destination')) return Search;
    if (agentName.includes('itinerary')) return Calendar;
    if (agentName.includes('data')) return Route;
    return loadingPhases[currentPhase].icon;
  };

  const getAgentName = (agentName: string) => {
    if (!agentName) return loadingPhases[currentPhase].titleKey;
    if (agentName.includes('destination')) return 'Destination Agent';
    if (agentName.includes('itinerary')) return 'Itinerary Agent';
    if (agentName.includes('data')) return 'Data Integration';
    return agentName;
  };

  const Icon = getAgentIcon(displayStatus.agent);
  const agentDisplayName = getAgentName(displayStatus.agent);
  const displayProgress = displayStatus.progress || progress;

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-6">
      {/* Animated Icon */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full blur-xl opacity-40 animate-pulse" />
        <div className="relative bg-gradient-to-r from-pink-500 to-purple-500 rounded-full p-6 animate-bounce">
          <Icon className="w-10 h-10 text-white" />
        </div>
      </div>

      {/* Agent Status */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold animate-fade-in">
          🤖 {agentDisplayName}
        </h3>
        <div className="text-xs text-muted-foreground">
          {displayStatus.action}
        </div>
      </div>

      {/* Current Activity */}
      <div className="h-12 flex items-center">
        <p className="text-sm text-muted-foreground text-center animate-fade-in-out">
          {displayStatus.details || (currentStatus ? displayStatus.action : t(loadingPhases[currentPhase].messagesKey[currentMessage]))}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-xs space-y-2">
        <Progress value={displayProgress} className="h-2" />
        <p className="text-xs text-center text-muted-foreground">
          {displayProgress}% {t('trip.loading.complete')}
        </p>
      </div>

      {/* Real-time Status */}
      {currentStatus && (
        <div className="mt-4 p-4 bg-muted/30 rounded-lg max-w-sm">
          <div className="flex items-start gap-2">
            <Compass className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-muted-foreground">
              <strong>Live Status:</strong> {currentStatus.details || currentStatus.action}
            </div>
          </div>
        </div>
      )}

      {/* Fun Facts / Tips - Only when no real status */}
      {!currentStatus && (
        <div className="mt-4 p-4 bg-muted/30 rounded-lg max-w-sm">
          <div className="flex items-start gap-2">
            <Heart className="w-4 h-4 text-pink-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              {t('trip.loading.tips.' + (currentPhase % 3))}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}