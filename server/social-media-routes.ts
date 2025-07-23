/**
 * Social Media API Routes
 * Provides endpoints for TikTok and Instagram content curation
 */

import { Express, Request, Response } from 'express';
import { socialMediaService } from './social-media';
import { storage } from './storage';
import { z } from 'zod';

export function registerSocialMediaRoutes(app: Express) {
  
  // Get social media content for a destination
  app.get('/api/social-media/destination/:destination', async (req: Request, res: Response) => {
    try {
      const { destination } = req.params;
      const { platform, language = 'de' } = req.query;

      console.log(`🔍 Searching social media content for: ${destination}`);

      // Check for cached content first
      const cachedContent = await socialMediaService.getCachedContent(
        destination, 
        platform as 'tiktok' | 'instagram' | undefined
      );

      if (cachedContent.length > 0) {
        console.log(`✅ Found ${cachedContent.length} cached posts for ${destination}`);
        return res.json({
          success: true,
          destination,
          platform: platform || 'all',
          content: cachedContent,
          source: 'cache'
        });
      }

      // If no cached content, curate new content
      const curationResult = await socialMediaService.curateDestinationContent(
        destination,
        {
          platforms: platform ? [platform as 'tiktok' | 'instagram'] : ['tiktok', 'instagram'],
          maxPerPlatform: 10,
          language: language as string,
          minRelevanceScore: 0.6
        }
      );

      console.log(`✅ Curated ${curationResult.totalCurated} new posts for ${destination}`);

      res.json({
        success: true,
        destination,
        platform: platform || 'all',
        content: {
          tiktok: curationResult.tiktok,
          instagram: curationResult.instagram
        },
        totalCurated: curationResult.totalCurated,
        source: 'live'
      });

    } catch (error: any) {
      console.error('Social media content error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get social media content',
        message: error.message
      });
    }
  });

  // Force refresh social media content for a destination
  app.post('/api/social-media/destination/:destination/refresh', async (req: Request, res: Response) => {
    try {
      const { destination } = req.params;
      const schema = z.object({
        platforms: z.array(z.enum(['tiktok', 'instagram'])).optional(),
        maxPerPlatform: z.number().min(1).max(50).optional(),
        language: z.string().optional(),
        minRelevanceScore: z.number().min(0).max(1).optional()
      });

      const options = schema.parse(req.body);

      console.log(`🔄 Force refreshing social media content for: ${destination}`);

      const curationResult = await socialMediaService.curateDestinationContent(
        destination,
        {
          platforms: options.platforms || ['tiktok', 'instagram'],
          maxPerPlatform: options.maxPerPlatform || 15,
          language: options.language || 'de',
          minRelevanceScore: options.minRelevanceScore || 0.5
        }
      );

      console.log(`✅ Refreshed ${curationResult.totalCurated} posts for ${destination}`);

      res.json({
        success: true,
        destination,
        refreshed: curationResult.totalCurated,
        content: {
          tiktok: curationResult.tiktok,
          instagram: curationResult.instagram
        }
      });

    } catch (error: any) {
      console.error('Social media refresh error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to refresh social media content',
        message: error.message
      });
    }
  });

  // Get trending hashtags
  app.get('/api/social-media/hashtags/trending', async (req: Request, res: Response) => {
    try {
      const { destination, platform, limit = '20' } = req.query;

      console.log(`📈 Getting trending hashtags for: ${destination || 'all destinations'}`);

      const hashtags = await socialMediaService.getTrendingHashtags(
        destination as string,
        platform as 'tiktok' | 'instagram'
      );

      const limitedHashtags = hashtags.slice(0, parseInt(limit as string));

      res.json({
        success: true,
        hashtags: limitedHashtags,
        total: hashtags.length,
        filters: {
          destination: destination || null,
          platform: platform || 'all'
        }
      });

    } catch (error: any) {
      console.error('Trending hashtags error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get trending hashtags',
        message: error.message
      });
    }
  });

  // Track user interaction with social media content
  app.post('/api/social-media/interaction', async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        userId: z.number(),
        socialContentId: z.number(),
        interactionType: z.enum(['view', 'like', 'save', 'share']),
        interactionData: z.object({}).optional()
      });

      const interaction = schema.parse(req.body);

      const savedInteraction = await storage.createUserSocialInteraction({
        userId: interaction.userId,
        socialContentId: interaction.socialContentId,
        interactionType: interaction.interactionType,
        interactionData: interaction.interactionData || {}
      });

      res.json({
        success: true,
        interaction: savedInteraction
      });

    } catch (error: any) {
      console.error('Social media interaction error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to track interaction',
        message: error.message
      });
    }
  });

  // Get user's social media interactions
  app.get('/api/social-media/user/:userId/interactions', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const { type, limit = '50' } = req.query;

      let interactions = await storage.getUserSocialInteractions(userId);
      
      if (type) {
        interactions = interactions.filter(interaction => interaction.interactionType === type);
      }

      const limitedInteractions = interactions.slice(0, parseInt(limit as string));

      res.json({
        success: true,
        interactions: limitedInteractions,
        total: interactions.length,
        userId
      });

    } catch (error: any) {
      console.error('User interactions error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user interactions',
        message: error.message
      });
    }
  });

  // Get social media service configuration status
  app.get('/api/social-media/config', async (req: Request, res: Response) => {
    try {
      const configStatus = socialMediaService.getConfigStatus();
      const isConfigured = socialMediaService.isConfigured();

      res.json({
        success: true,
        configuration: {
          tiktok: {
            configured: configStatus.tiktok.configured,
            available: isConfigured.tiktok,
            rateLimits: configStatus.tiktok.rateLimits,
            currentUsage: configStatus.tiktok.currentUsage
          },
          instagram: {
            configured: configStatus.instagram.configured,
            available: isConfigured.instagram,
            rateLimits: configStatus.instagram.rateLimits,
            currentUsage: configStatus.instagram.currentUsage
          },
          anyConfigured: isConfigured.anyConfigured
        }
      });

    } catch (error: any) {
      console.error('Config status error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get configuration status',
        message: error.message
      });
    }
  });

  // Get specific social media content by ID
  app.get('/api/social-media/content/:contentId', async (req: Request, res: Response) => {
    try {
      const contentId = parseInt(req.params.contentId);
      
      const content = await storage.getSocialMediaContent(contentId);
      
      if (!content) {
        return res.status(404).json({
          success: false,
          error: 'Content not found'
        });
      }

      res.json({
        success: true,
        content
      });

    } catch (error: any) {
      console.error('Get content error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get content',
        message: error.message
      });
    }
  });

  // Search social media content by hashtag
  app.get('/api/social-media/search/hashtag/:hashtag', async (req: Request, res: Response) => {
    try {
      const { hashtag } = req.params;
      const { platform, limit = '20' } = req.query;

      // This would require implementing hashtag-based search in the service
      // For now, return a placeholder response
      console.log(`🔍 Searching for hashtag: #${hashtag}`);

      res.json({
        success: true,
        hashtag: `#${hashtag}`,
        platform: platform || 'all',
        content: [],
        message: 'Hashtag search functionality will be implemented with live API integration'
      });

    } catch (error: any) {
      console.error('Hashtag search error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search by hashtag',
        message: error.message
      });
    }
  });

  console.log('✅ Social Media API routes registered');
}