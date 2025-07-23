import { Express } from 'express';
import { liteApiService } from './liteapi';
import { storage } from './storage';
import { z } from 'zod';

export function registerLiteApiRoutes(app: Express) {
  // Working hotel search endpoint
  app.get('/api/liteapi/hotels/search', async (req, res) => {
    try {
      const searchSchema = z.object({
        latitude: z.string().transform(Number),
        longitude: z.string().transform(Number),
        checkIn: z.string(),
        checkOut: z.string(),
        adults: z.string().transform(Number),
        children: z.string().optional().transform(val => val ? Number(val) : undefined),
        currency: z.string().default('EUR'),
        language: z.string().default('en')
      });

      const params = searchSchema.parse(req.query);
      
      if (!liteApiService.isConfigured()) {
        return res.status(503).json({ 
          error: 'LiteAPI not configured',
          message: 'Hotel booking service is currently unavailable'
        });
      }

      const results = await liteApiService.searchHotelsByLocation(
        { lat: params.latitude, lng: params.longitude },
        params.checkIn,
        params.checkOut,
        { adults: params.adults, children: params.children }
      );

      // Convert to internal format and add booking capabilities
      const enhancedResults = {
        ...results,
        hotels: results.hotels.map(hotel => {
          const rates = results.rates[hotel.id] || [];
          const converted = liteApiService.convertToInternalHotel(hotel, rates);
          return {
            ...converted,
            liteApiData: {
              id: hotel.id,
              rates: rates.slice(0, 3), // Show top 3 rates
              amenities: hotel.amenities,
              checkInTime: hotel.checkInTime,
              checkOutTime: hotel.checkOutTime
            }
          };
        })
      };

      res.json(enhancedResults);
    } catch (error) {
      console.error('LiteAPI search error:', error);
      res.status(500).json({ 
        error: 'Search failed',
        message: error.message 
      });
    }
  });

  // Test LiteAPI configuration
  app.get('/api/liteapi/test', async (req, res) => {
    try {
      if (!liteApiService.isConfigured()) {
        return res.json({ 
          configured: false,
          message: 'LiteAPI credentials not found. Please check LITEAPI_PUBLIC_KEY and LITEAPI_PRIVATE_KEY environment variables.'
        });
      }

      const configInfo = liteApiService.getConfigInfo();
      
      // Always test sandbox endpoints if we get a 401 error
      try {
        const destinations = await liteApiService.searchDestinations('Munich', 'en');
        res.json({ 
          configured: true,
          message: 'LiteAPI is properly configured and working',
          configInfo,
          testResult: {
            destinationsFound: destinations.length,
            sampleDestination: destinations[0] || null
          }
        });
      } catch (apiError: any) {
        console.log('Primary endpoint failed, testing sandbox endpoints...');
        const sandboxTest = await liteApiService.testSandboxEndpoints();
        
        res.json({ 
          configured: true,
          message: 'Primary endpoint failed - tested sandbox endpoints',
          configInfo,
          primaryError: apiError.message,
          sandboxTest,
          recommendation: sandboxTest.workingEndpoint ? 
            `Found working sandbox endpoint: ${sandboxTest.workingEndpoint}. Please set LITEAPI_SANDBOX_URL=${sandboxTest.workingEndpoint}` :
            'No working sandbox endpoints found. Please verify your credentials and check LiteAPI documentation for correct sandbox URLs.'
        });
      }
    } catch (error: any) {
      console.error('LiteAPI test error:', error);
      res.status(500).json({ 
        configured: false,
        error: 'Test failed',
        message: error.message 
      });
    }
  });

  // Get hotel details
  app.get('/api/liteapi/hotels/:hotelId', async (req, res) => {
    try {
      const { hotelId } = req.params;
      const language = req.query.language as string || 'en';

      if (!liteApiService.isConfigured()) {
        return res.status(503).json({ 
          error: 'LiteAPI not configured' 
        });
      }

      const hotelDetails = await liteApiService.getHotelDetails(hotelId, language);
      res.json(hotelDetails);
    } catch (error) {
      console.error('LiteAPI hotel details error:', error);
      res.status(500).json({ 
        error: 'Failed to get hotel details',
        message: error.message 
      });
    }
  });

  // Search destinations
  app.get('/api/liteapi/destinations', async (req, res) => {
    try {
      const { query, language } = req.query;
      
      if (!query) {
        return res.status(400).json({ error: 'Query parameter required' });
      }

      if (!liteApiService.isConfigured()) {
        return res.status(503).json({ 
          error: 'LiteAPI not configured' 
        });
      }

      const destinations = await liteApiService.searchDestinations(
        query as string, 
        language as string
      );
      
      res.json({ destinations });
    } catch (error: any) {
      console.error('LiteAPI destinations error:', error);
      res.status(500).json({ 
        error: 'Failed to search destinations',
        message: error.message 
      });
    }
  });

  // Comprehensive sandbox endpoint testing
  app.get('/api/liteapi/test-sandbox', async (req, res) => {
    try {
      if (!liteApiService.isConfigured()) {
        return res.json({ 
          configured: false,
          message: 'LiteAPI credentials not found'
        });
      }

      console.log('Running comprehensive sandbox endpoint test...');
      const sandboxTest = await liteApiService.testSandboxEndpoints();
      
      res.json({
        configInfo: liteApiService.getConfigInfo(),
        sandboxTest,
        instructions: {
          success: sandboxTest.workingEndpoint ? 
            `Working endpoint found: ${sandboxTest.workingEndpoint}. Set environment variable LITEAPI_SANDBOX_URL=${sandboxTest.workingEndpoint}` :
            'No working endpoints found. Please check your LiteAPI credentials.',
          nextSteps: [
            'Verify your LiteAPI account is active',
            'Check that credentials are sandbox/test keys',
            'Ensure IP address is whitelisted',
            'Contact LiteAPI support for correct sandbox URL'
          ]
        }
      });
    } catch (error: any) {
      console.error('Sandbox test error:', error);
      res.status(500).json({ 
        error: 'Sandbox test failed',
        message: error.message 
      });
    }
  });

  // Manual endpoint testing for debugging
  app.get('/api/liteapi/test-endpoint', async (req, res) => {
    try {
      const { url, version = 'v3.0' } = req.query;
      
      if (!url) {
        return res.status(400).json({ error: 'URL parameter required' });
      }

      if (!liteApiService.isConfigured()) {
        return res.json({ 
          configured: false,
          message: 'LiteAPI credentials not found'
        });
      }

      const testUrl = `${url}/${version}/data/destinations?query=test`;
      const headers = {
        'X-API-Key': process.env.LITEAPI_PUBLIC_KEY || '',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      console.log(`Testing endpoint: ${testUrl}`);
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers
      });

      const responseText = await response.text();
      let responseData;
      
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      res.json({
        endpoint: url,
        testUrl,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        response: responseData,
        success: response.ok
      });

    } catch (error: any) {
      console.error('Manual endpoint test error:', error);
      res.status(500).json({ 
        error: 'Manual test failed',
        message: error.message 
      });
    }
  });
}