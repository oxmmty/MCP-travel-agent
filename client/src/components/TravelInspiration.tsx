import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Camera, Play, RefreshCw, Heart, Share } from "lucide-react";
import { cn } from "@/lib/utils";

interface UnsplashPhoto {
  id: string;
  url: string;
  thumbnail: string;
  fullUrl: string;
  description: string;
  photographer: {
    name: string;
    username: string;
    profileUrl: string;
  };
  unsplashUrl: string;
}

interface UnsplashResponse {
  success: boolean;
  destination: string;
  photos: UnsplashPhoto[];
  total: number;
  attribution: string;
}

interface VideoContent {
  id: string;
  title: string;
  embedId: string;
  platform: 'youtube' | 'tiktok';
  type: 'short' | 'vlog';
  duration?: string;
}

interface TravelInspirationProps {
  destination: string;
  className?: string;
}

// Local video mappings for different destinations (ECHTE YouTube-IDs!)
const VIDEO_MAPPINGS: Record<string, VideoContent[]> = {
  'Paris': [
    {
      id: 'paris-yt-1',
      title: 'Paris Walking Tour - Champs Élysées',
      embedId: 'VHT7vRm5tH8', // Echte Paris-Wanderung
      platform: 'youtube',
      type: 'vlog',
      duration: '10:23'
    },
    {
      id: 'paris-yt-2',
      title: 'Top 10 Things to Do in Paris',
      embedId: 'AQ6GmpMu5L8', // Echte Paris-Sehenswürdigkeiten
      platform: 'youtube',
      type: 'vlog',
      duration: '12:45'
    }
  ],
  'London': [
    {
      id: 'london-yt-1',
      title: 'London Walking Tour - Westminster to Tower Bridge',
      embedId: 'NZnXgTIr_wA', // Echte London-Tour
      platform: 'youtube',
      type: 'vlog',
      duration: '25:30'
    },
    {
      id: 'london-yt-2',
      title: 'Things to Do in London',
      embedId: 'qMoEs7eQeZE', // Echte London-Highlights
      platform: 'youtube',
      type: 'vlog',
      duration: '8:15'
    }
  ],
  'Barcelona': [
    {
      id: 'barcelona-yt-1',
      title: 'Barcelona Travel Guide - Top Attractions',
      embedId: '3qRJ45_7mM8', // Echte Barcelona-Tour
      platform: 'youtube',
      type: 'vlog',
      duration: '15:20'
    },
    {
      id: 'barcelona-yt-2',
      title: 'Barcelona Food Tour - Best Tapas',
      embedId: 'kFjUs4y4eJU', // Echte Barcelona-Food-Tour
      platform: 'youtube',
      type: 'vlog',
      duration: '12:45'
    }
  ],
  'Tokyo': [
    {
      id: 'tokyo-yt-1',
      title: 'Tokyo Walking Tour - Shibuya & Harajuku',
      embedId: 'ckYyQ7sM4I0', // Echte Tokyo-Wanderung
      platform: 'youtube',
      type: 'vlog',
      duration: '20:15'
    },
    {
      id: 'tokyo-yt-2',
      title: 'Tokyo Travel Guide - Must See Places',
      embedId: 'x4K4m9R4M-8', // Echte Tokyo-Sehenswürdigkeiten
      platform: 'youtube',
      type: 'vlog',
      duration: '18:30'
    }
  ],
  'New York': [
    {
      id: 'nyc-yt-1',
      title: 'NYC Walking Tour - Times Square to Central Park',
      embedId: '2VHTy7ZWmr4', // Echte NYC-Wanderung
      platform: 'youtube',
      type: 'vlog',
      duration: '45:00'
    },
    {
      id: 'nyc-yt-2',
      title: 'New York City Travel Guide',
      embedId: 'mfykpwPnhF0', // Echte NYC-Sehenswürdigkeiten
      platform: 'youtube',
      type: 'vlog',
      duration: '18:30'
    }
  ]
};

// YouTube embed component with lazy loading
function YouTubeEmbed({ embedId, title, className }: { embedId: string; title: string; className?: string }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isInView) {
          setIsInView(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [isInView]);

  const handleLoad = () => setIsLoaded(true);

  return (
    <div ref={ref} className={cn("relative aspect-video bg-gray-100 rounded-lg overflow-hidden", className)}>
      {!isInView ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
          <Play className="h-12 w-12 text-gray-400" />
        </div>
      ) : (
        <>
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
          <iframe
            src={`https://www.youtube.com/embed/${embedId}?rel=0&modestbranding=1`}
            title={title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={handleLoad}
            className="w-full h-full"
          />
        </>
      )}
    </div>
  );
}

// Removed TikTok embed - not reliably functional

// Image component with lazy loading and attribution
function InspirationImage({ photo, className }: { photo: UnsplashPhoto; className?: string }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isInView) {
          setIsInView(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [isInView]);

  const handleLoad = () => setIsLoaded(true);

  return (
    <div className={cn("relative group overflow-hidden rounded-lg bg-gray-100", className)}>
      {!isInView ? (
        <div className="aspect-video bg-gray-200 flex items-center justify-center">
          <Camera className="h-8 w-8 text-gray-400" />
        </div>
      ) : (
        <>
          {!isLoaded && (
            <Skeleton className="aspect-video w-full" />
          )}
          <img
            ref={ref}
            src={photo.url}
            alt={photo.description}
            onLoad={handleLoad}
            className={cn(
              "aspect-video w-full object-cover transition-all duration-500",
              isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105"
            )}
          />
          
          {/* Overlay with actions */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end">
            <div className="w-full p-4 bg-gradient-to-t from-black/60 to-transparent">
              <p className="text-white text-sm font-medium mb-2 line-clamp-2">
                {photo.description}
              </p>
              <div className="flex items-center justify-between">
                <a
                  href={photo.photographer.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/90 text-xs hover:text-white transition-colors"
                >
                  📷 {photo.photographer.name}
                </a>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsLiked(!isLiked)}
                    className="h-8 w-8 p-0 text-white hover:bg-white/20"
                  >
                    <Heart className={cn("h-4 w-4", isLiked && "fill-red-500 text-red-500")} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(photo.unsplashUrl, '_blank')}
                    className="h-8 w-8 p-0 text-white hover:bg-white/20"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function TravelInspiration({ destination, className }: TravelInspirationProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch Unsplash photos
  const { data: photosData, isLoading: photosLoading, refetch: refetchPhotos } = useQuery<UnsplashResponse>({
    queryKey: [`/api/unsplash/destination/${destination}`, refreshKey],
    enabled: !!destination,
  });

  // Get local video mappings (nur YouTube)
  const videos = VIDEO_MAPPINGS[destination] || [];
  const youtubeVideos = videos.filter(v => v.platform === 'youtube');

  const handleRefresh = async () => {
    setRefreshKey(prev => prev + 1);
    await refetchPhotos();
  };

  if (!destination) {
    return (
      <Card className={cn("h-full", className)}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-gray-500">
            <Camera className="h-16 w-16 mx-auto mb-4" />
            <p className="text-lg font-medium">Wähle ein Reiseziel</p>
            <p className="text-sm">Entdecke inspirierende Inhalte</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <div className="flex-shrink-0 p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Inspiration für {destination}</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={photosLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", photosLoading && "animate-spin")} />
            Aktualisieren
          </Button>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Camera className="h-3 w-3" />
            Hochwertige Fotos
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Play className="h-3 w-3" />
            Video-Inspiration
          </Badge>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="space-y-8">
          {/* Photos Section */}
          <section>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Fotos von {destination}
            </h3>
            
            {photosLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="aspect-video" />
                ))}
              </div>
            ) : photosData?.photos && photosData.photos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {photosData.photos.map((photo) => (
                  <InspirationImage
                    key={photo.id}
                    photo={photo}
                    className="hover:scale-105 transition-transform duration-300"
                  />
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <Camera className="h-12 w-12 mx-auto mb-4" />
                <p>Keine Fotos für {destination} verfügbar</p>
              </div>
            )}
          </section>

          {/* YouTube Videos Section */}
          {youtubeVideos.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Play className="h-5 w-5 text-red-500" />
                YouTube Videos
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {youtubeVideos.map((video) => (
                  <Card key={video.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <YouTubeEmbed embedId={video.embedId} title={video.title} />
                      <div className="p-4">
                        <h4 className="font-medium mb-2">{video.title}</h4>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <Badge variant={video.type === 'short' ? 'default' : 'secondary'}>
                            {video.type === 'short' ? 'Short' : 'Vlog'}
                          </Badge>
                          {video.duration && (
                            <span>{video.duration}</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* TikTok entfernt - Embed-Integration nicht zuverlässig */}

          {/* Attribution */}
          <div className="text-center text-xs text-gray-500 pt-4 border-t">
            <p>
              Fotos bereitgestellt von{' '}
              <a
                href="https://unsplash.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-gray-700"
              >
                Unsplash
              </a>
              {' '} • Videos von YouTube
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default TravelInspiration;