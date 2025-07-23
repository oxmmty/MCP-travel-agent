import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, Heart, Share2, MessageCircle, Eye, ExternalLink, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SocialMediaPost {
  id: number;
  platform: 'tiktok' | 'instagram';
  contentId: string;
  contentType: string;
  authorUsername: string;
  authorDisplayName?: string;
  authorAvatar?: string;
  authorFollowers?: number;
  caption?: string;
  hashtags?: string[];
  mediaUrl: string;
  thumbnailUrl?: string;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
  publishedAt: string;
}

interface SocialMediaContentProps {
  destination: string;
  className?: string;
}

export function SocialMediaContent({ destination, className }: SocialMediaContentProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | 'tiktok' | 'instagram'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: socialContent, isLoading, refetch } = useQuery({
    queryKey: ['/api/social-media/destination', destination, selectedPlatform === 'all' ? undefined : selectedPlatform],
    enabled: !!destination,
  });

  const { data: trendingHashtags } = useQuery({
    queryKey: ['/api/social-media/hashtags/trending', { destination, limit: '10' }],
    enabled: !!destination,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetch(`/api/social-media/destination/${destination}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platforms: selectedPlatform === 'all' ? ['tiktok', 'instagram'] : [selectedPlatform],
          maxPerPlatform: 15,
          language: 'de',
          minRelevanceScore: 0.6
        })
      });
      await refetch();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleInteraction = async (contentId: number, type: 'view' | 'like' | 'save' | 'share') => {
    try {
      await fetch('/api/social-media/interaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 1, // TODO: Get from auth context
          socialContentId: contentId,
          interactionType: type
        })
      });
    } catch (error) {
      console.error('Interaction failed:', error);
    }
  };

  const formatNumber = (num?: number) => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) return `vor ${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `vor ${diffInDays}d`;
    return date.toLocaleDateString('de-DE');
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'tiktok':
        return '🎵';
      case 'instagram':
        return '📸';
      default:
        return '📱';
    }
  };

  const getContentPosts = (): SocialMediaPost[] => {
    if (!socialContent || !('success' in socialContent) || !socialContent.success) return [];
    
    const content = 'content' in socialContent ? socialContent.content : null;
    
    if (content && typeof content === 'object' && 'tiktok' in content && 'instagram' in content) {
      // Mixed content from API response
      return selectedPlatform === 'all' 
        ? [...(content.tiktok || []), ...(content.instagram || [])]
        : content[selectedPlatform] || [];
    } else if (Array.isArray(content)) {
      // Direct content array
      return selectedPlatform === 'all' 
        ? content
        : content.filter((post: SocialMediaPost) => post.platform === selectedPlatform);
    }
    
    return [];
  };

  if (isLoading) {
    return (
      <Card className={cn("h-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📱 Social Media Inspiration
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="h-10 w-10 bg-gray-300 rounded-full" />
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-24" />
                    <div className="h-3 bg-gray-300 rounded w-16" />
                  </div>
                </div>
                <div className="h-32 bg-gray-300 rounded mb-2" />
                <div className="h-4 bg-gray-300 rounded w-3/4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const posts = getContentPosts();

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            📱 Social Media für {destination}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>
        </div>
        
        <Tabs value={selectedPlatform} onValueChange={(value) => setSelectedPlatform(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">Alle</TabsTrigger>
            <TabsTrigger value="tiktok">🎵 TikTok</TabsTrigger>
            <TabsTrigger value="instagram">📸 Instagram</TabsTrigger>
          </TabsList>
        </Tabs>

        {trendingHashtags && 'success' in trendingHashtags && trendingHashtags.success && 'hashtags' in trendingHashtags && Array.isArray(trendingHashtags.hashtags) && trendingHashtags.hashtags.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="h-4 w-4" />
              Trending Hashtags
            </div>
            <div className="flex flex-wrap gap-1">
              {trendingHashtags.hashtags.slice(0, 5).map((hashtag: any) => (
                <Badge key={hashtag.id} variant="secondary" className="text-xs">
                  #{hashtag.hashtag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="font-semibold mb-2">Keine Inhalte gefunden</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Für "{destination}" sind noch keine Social Media Inhalte verfügbar.
            </p>
            <Button onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
              Inhalte laden
            </Button>
          </div>
        ) : (
          <div className="space-y-6 overflow-y-auto h-full">
            {posts.map((post) => (
              <div key={post.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                {/* Post Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={post.authorAvatar || undefined} />
                      <AvatarFallback>
                        {post.authorDisplayName?.[0] || post.authorUsername[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-sm">
                        {post.authorDisplayName || post.authorUsername}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        @{post.authorUsername} · {formatDate(post.publishedAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {getPlatformIcon(post.platform)} {post.platform.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                {/* Media Content */}
                {post.thumbnailUrl && (
                  <div 
                    className="relative rounded-lg overflow-hidden mb-3 cursor-pointer bg-gray-100"
                    onClick={() => handleInteraction(post.id, 'view')}
                  >
                    <img
                      src={post.thumbnailUrl}
                      alt="Social media content"
                      className="w-full h-48 object-cover"
                    />
                    {post.contentType === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-black/50 rounded-full p-3">
                          <div className="w-0 h-0 border-l-[12px] border-l-white border-y-[8px] border-y-transparent ml-1" />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Post Caption */}
                {post.caption && (
                  <p className="text-sm mb-3 line-clamp-3">
                    {post.caption}
                  </p>
                )}

                {/* Hashtags */}
                {post.hashtags && post.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {post.hashtags.slice(0, 3).map((hashtag) => (
                      <Badge key={hashtag} variant="secondary" className="text-xs">
                        #{hashtag}
                      </Badge>
                    ))}
                    {post.hashtags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{post.hashtags.length - 3} mehr
                      </Badge>
                    )}
                  </div>
                )}

                <Separator className="my-3" />

                {/* Engagement Stats */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    {post.viewCount && (
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {formatNumber(post.viewCount)}
                      </div>
                    )}
                    {post.likeCount && (
                      <button 
                        className="flex items-center gap-1 hover:text-red-500 transition-colors"
                        onClick={() => handleInteraction(post.id, 'like')}
                      >
                        <Heart className="h-4 w-4" />
                        {formatNumber(post.likeCount)}
                      </button>
                    )}
                    {post.commentCount && (
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        {formatNumber(post.commentCount)}
                      </div>
                    )}
                    {post.shareCount && (
                      <button 
                        className="flex items-center gap-1 hover:text-blue-500 transition-colors"
                        onClick={() => handleInteraction(post.id, 'share')}
                      >
                        <Share2 className="h-4 w-4" />
                        {formatNumber(post.shareCount)}
                      </button>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(post.mediaUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}