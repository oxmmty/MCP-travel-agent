/**
 * Unsplash API Routes
 * Provides high-quality travel images with photographer attribution
 */

import { Express, Request, Response } from 'express';

interface UnsplashPhoto {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  user: {
    name: string;
    username: string;
    links: {
      html: string;
    };
  };
  description: string | null;
  alt_description: string | null;
  links: {
    html: string;
    download: string;
  };
}

interface UnsplashSearchResponse {
  results: UnsplashPhoto[];
  total: number;
  total_pages: number;
}

export function registerUnsplashRoutes(app: Express) {
  const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
  
  if (!UNSPLASH_ACCESS_KEY) {
    console.warn('⚠️ UNSPLASH_ACCESS_KEY not found - Unsplash features will be disabled');
    return;
  }

  console.log('✅ Registering Unsplash API routes...');

  /**
   * Search for travel photos by destination
   */
  app.get('/api/unsplash/destination/:destination', async (req: Request, res: Response) => {
    try {
      const { destination } = req.params;
      const { count = '3', orientation = 'landscape' } = req.query;

      // Enhanced search query for better travel results
      const searchQuery = `${destination} travel tourism landmark architecture nature cityscape`;
      
      const response = await fetch(
        `https://api.unsplash.com/search/photos?` +
        `query=${encodeURIComponent(searchQuery)}&` +
        `per_page=${count}&` +
        `orientation=${orientation}&` +
        `order_by=relevant&` +
        `content_filter=high`,
        {
          headers: {
            'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
            'Accept-Version': 'v1'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Unsplash API error: ${response.status} ${response.statusText}`);
      }

      const data: UnsplashSearchResponse = await response.json();
      
      // Transform to simplified format with attribution
      const photos = data.results.map(photo => ({
        id: photo.id,
        url: photo.urls.regular,
        thumbnail: photo.urls.small,
        fullUrl: photo.urls.full,
        description: photo.description || photo.alt_description || `${destination} travel photo`,
        photographer: {
          name: photo.user.name,
          username: photo.user.username,
          profileUrl: photo.user.links.html
        },
        unsplashUrl: photo.links.html,
        downloadUrl: photo.links.download
      }));

      res.json({
        success: true,
        destination,
        photos,
        total: data.total,
        attribution: 'Photos provided by Unsplash'
      });

    } catch (error) {
      console.error('Unsplash API error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch photos from Unsplash',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * Get curated travel collection photos
   */
  app.get('/api/unsplash/curated/:destination', async (req: Request, res: Response) => {
    try {
      const { destination } = req.params;
      const { count = '3' } = req.query;

      // Try to get photos from travel-specific collections first
      const collectionsResponse = await fetch(
        `https://api.unsplash.com/search/collections?query=${encodeURIComponent(destination + ' travel')}&per_page=1`,
        {
          headers: {
            'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
            'Accept-Version': 'v1'
          }
        }
      );

      let photos = [];

      if (collectionsResponse.ok) {
        const collectionsData = await collectionsResponse.json();
        
        if (collectionsData.results.length > 0) {
          const collectionId = collectionsData.results[0].id;
          
          // Get photos from the collection
          const photosResponse = await fetch(
            `https://api.unsplash.com/collections/${collectionId}/photos?per_page=${count}`,
            {
              headers: {
                'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
                'Accept-Version': 'v1'
              }
            }
          );

          if (photosResponse.ok) {
            const photosData = await photosResponse.json();
            photos = photosData.map((photo: UnsplashPhoto) => ({
              id: photo.id,
              url: photo.urls.regular,
              thumbnail: photo.urls.small,
              fullUrl: photo.urls.full,
              description: photo.description || photo.alt_description || `${destination} travel photo`,
              photographer: {
                name: photo.user.name,
                username: photo.user.username,
                profileUrl: photo.user.links.html
              },
              unsplashUrl: photo.links.html,
              downloadUrl: photo.links.download
            }));
          }
        }
      }

      // Fallback to regular search if no collection found
      if (photos.length === 0) {
        const fallbackResponse = await fetch(
          `/api/unsplash/destination/${destination}?count=${count}`,
          { headers: req.headers as any }
        );
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          photos = fallbackData.photos;
        }
      }

      res.json({
        success: true,
        destination,
        photos,
        source: 'curated',
        attribution: 'Photos provided by Unsplash'
      });

    } catch (error) {
      console.error('Unsplash curated API error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch curated photos from Unsplash',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  console.log('✅ Unsplash API routes registered successfully');
}