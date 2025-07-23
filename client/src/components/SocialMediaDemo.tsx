import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, RefreshCw, TrendingUp, Users } from 'lucide-react';

interface SocialMediaConfig {
  tiktok: {
    configured: boolean;
    available: boolean;
    rateLimits: {
      requestsPerMinute: number;
      requestsPerHour: number;
    };
    currentUsage: {
      minute: number;
      hour: number;
    };
  };
  instagram: {
    configured: boolean;
    available: boolean;
    rateLimits: {
      requestsPerMinute: number;
      requestsPerHour: number;
    };
    currentUsage: {
      minute: number;
      hour: number;
    };
  };
  anyConfigured: boolean;
}

interface SocialMediaResponse {
  success: boolean;
  destination: string;
  platform: string;
  content: {
    tiktok: any[];
    instagram: any[];
  };
  totalCurated: number;
  source: string;
}

export default function SocialMediaDemo() {
  const [destination, setDestination] = useState('Paris');
  const [selectedPlatform, setSelectedPlatform] = useState('all');

  // Fetch API configuration
  const { data: config, isLoading: configLoading } = useQuery<{ configuration: SocialMediaConfig }>({
    queryKey: ['/api/social-media/config'],
  });

  // Fetch social media content
  const { data: content, isLoading: contentLoading, refetch } = useQuery<SocialMediaResponse>({
    queryKey: ['/api/social-media/destination', destination, selectedPlatform],
    queryFn: () => 
      fetch(`/api/social-media/destination/${destination}?platform=${selectedPlatform}&language=de`)
        .then(res => res.json()),
    enabled: !!destination,
  });

  const handleSearch = () => {
    refetch();
  };

  const getStatusBadge = (configured: boolean, available: boolean) => {
    if (configured && available) {
      return <Badge className="bg-green-100 text-green-800">✓ Aktiv</Badge>;
    }
    if (configured && !available) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-700">⚠ Konfiguriert</Badge>;
    }
    return <Badge variant="outline" className="border-red-500 text-red-700">✗ Nicht konfiguriert</Badge>;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Social Media Integration Demo</h1>
        <p className="text-gray-600">
          TikTok und Instagram Content-Kuration für Reiseziele
        </p>
      </div>

      {/* API Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            API Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {configLoading ? (
            <div className="text-center py-4">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p>Lade Konfiguration...</p>
            </div>
          ) : config ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* TikTok Status */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    🎵 TikTok API
                  </h3>
                  {getStatusBadge(config.configuration.tiktok.configured, config.configuration.tiktok.available)}
                </div>
                <div className="text-sm space-y-1">
                  <p>Rate Limits: {config.configuration.tiktok.rateLimits.requestsPerMinute}/min, {config.configuration.tiktok.rateLimits.requestsPerHour}/h</p>
                  <p>Aktuelle Nutzung: {config.configuration.tiktok.currentUsage.minute}/min, {config.configuration.tiktok.currentUsage.hour}/h</p>
                </div>
              </div>

              {/* Instagram Status */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    📸 Instagram API
                  </h3>
                  {getStatusBadge(config.configuration.instagram.configured, config.configuration.instagram.available)}
                </div>
                <div className="text-sm space-y-1">
                  <p>Rate Limits: {config.configuration.instagram.rateLimits.requestsPerMinute}/min, {config.configuration.instagram.rateLimits.requestsPerHour}/h</p>
                  <p>Aktuelle Nutzung: {config.configuration.instagram.currentUsage.minute}/min, {config.configuration.instagram.currentUsage.hour}/h</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-red-600">Fehler beim Laden der Konfiguration</p>
          )}
        </CardContent>
      </Card>

      {/* Search Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Content-Suche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Reiseziel eingeben..."
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="flex-1"
            />
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">Alle Plattformen</option>
              <option value="tiktok">TikTok</option>
              <option value="instagram">Instagram</option>
            </select>
            <Button onClick={handleSearch} disabled={contentLoading}>
              {contentLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Suchen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Suchergebnisse
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contentLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Suche nach Social Media Content für {destination}...</p>
            </div>
          ) : content ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <Badge variant="outline">
                  Destination: {content.destination}
                </Badge>
                <Badge variant="outline">
                  Platform: {content.platform}
                </Badge>
                <Badge variant="outline">
                  Gefunden: {content.totalCurated} Posts
                </Badge>
                <Badge variant="outline">
                  Quelle: {content.source}
                </Badge>
              </div>

              <Tabs defaultValue="tiktok">
                <TabsList>
                  <TabsTrigger value="tiktok">
                    🎵 TikTok ({content.content.tiktok.length})
                  </TabsTrigger>
                  <TabsTrigger value="instagram">
                    📸 Instagram ({content.content.instagram.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="tiktok" className="mt-4">
                  {content.content.tiktok.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {content.content.tiktok.map((post, index) => (
                        <Card key={index}>
                          <CardContent className="p-4">
                            <p className="text-sm">TikTok Video #{index + 1}</p>
                            <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto">
                              {JSON.stringify(post, null, 2)}
                            </pre>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>Keine TikTok-Inhalte gefunden für "{destination}"</p>
                      <p className="text-sm mt-2">
                        {config?.configuration.tiktok.configured 
                          ? 'API ist konfiguriert - möglicherweise Sandbox-Umgebung oder Rate-Limiting'
                          : 'TikTok API nicht konfiguriert'
                        }
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="instagram" className="mt-4">
                  {content.content.instagram.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {content.content.instagram.map((post, index) => (
                        <Card key={index}>
                          <CardContent className="p-4">
                            <p className="text-sm">Instagram Post #{index + 1}</p>
                            <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto">
                              {JSON.stringify(post, null, 2)}
                            </pre>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>Keine Instagram-Inhalte gefunden für "{destination}"</p>
                      <p className="text-sm mt-2">
                        {config?.configuration.instagram.configured 
                          ? 'API ist konfiguriert - möglicherweise Sandbox-Umgebung oder Rate-Limiting'
                          : 'Instagram API nicht konfiguriert (INSTAGRAM_ACCESS_TOKEN fehlt)'
                        }
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Geben Sie ein Reiseziel ein und klicken Sie auf "Suchen"</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Integration Info */}
      <Card>
        <CardHeader>
          <CardTitle>Implementierte Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <h4 className="font-semibold mb-2">✅ Backend</h4>
              <ul className="text-sm space-y-1">
                <li>• Social Media Service</li>
                <li>• REST API (8 Endpunkte)</li>
                <li>• Rate Limiting</li>
                <li>• Error Handling</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">✅ Datenbank</h4>
              <ul className="text-sm space-y-1">
                <li>• 5 neue Tabellen</li>
                <li>• Content Management</li>
                <li>• User Interactions</li>
                <li>• Hashtag Tracking</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">✅ KI Integration</h4>
              <ul className="text-sm space-y-1">
                <li>• OpenAI GPT-4</li>
                <li>• Relevanz-Bewertung</li>
                <li>• Content-Analyse</li>
                <li>• Location-Extraktion</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}