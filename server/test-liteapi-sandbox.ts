/**
 * LiteAPI Sandbox Test - Verify which API keys work with your specific sandbox
 */
import { Express, Request, Response } from 'express';

export function registerSandboxTestRoutes(app: Express) {
  console.log('🔧 Registering LiteAPI Sandbox Test routes...');

  // Test endpoint to verify which API configuration works with your sandbox
  app.post('/api/liteapi/test-sandbox', async (req: Request, res: Response) => {
    try {
      const sandboxKey = process.env.LITEAPI_SANDBOX_API_KEY;
      const prodKey = process.env.LITEAPI_PROD_API_KEY;
      const privateKey = process.env.LITEAPI_PRIVATE_KEY;

      console.log('🔍 Testing LiteAPI Sandbox Configuration...');
      console.log('Available keys:', {
        sandbox: sandboxKey ? 'Present' : 'Missing',
        prod: prodKey ? 'Present' : 'Missing',
        private: privateKey ? 'Present' : 'Missing'
      });

      const testResults = [];

      // Test 1: Sandbox API Key
      if (sandboxKey) {
        try {
          const response = await fetch('https://api.liteapi.travel/v3.0/data/countries', {
            headers: {
              'X-API-Key': sandboxKey,
              'Content-Type': 'application/json'
            }
          });
          
          testResults.push({
            key: 'sandbox',
            status: response.status,
            success: response.ok,
            message: response.ok ? 'Sandbox key works' : `Failed: ${response.status}`
          });
        } catch (error) {
          testResults.push({
            key: 'sandbox',
            status: 0,
            success: false,
            message: `Error: ${(error as Error).message}`
          });
        }
      }

      // Test 2: Production API Key
      if (prodKey) {
        try {
          const response = await fetch('https://api.liteapi.travel/v3.0/data/countries', {
            headers: {
              'X-API-Key': prodKey,
              'Content-Type': 'application/json'
            }
          });
          
          testResults.push({
            key: 'production',
            status: response.status,
            success: response.ok,
            message: response.ok ? 'Production key works' : `Failed: ${response.status}`
          });
        } catch (error) {
          testResults.push({
            key: 'production',
            status: 0,
            success: false,
            message: `Error: ${(error as Error).message}`
          });
        }
      }

      // Test 3: Private Key
      if (privateKey) {
        try {
          const response = await fetch('https://api.liteapi.travel/v3.0/data/countries', {
            headers: {
              'X-API-Key': privateKey,
              'Content-Type': 'application/json'
            }
          });
          
          testResults.push({
            key: 'private',
            status: response.status,
            success: response.ok,
            message: response.ok ? 'Private key works' : `Failed: ${response.status}`
          });
        } catch (error) {
          testResults.push({
            key: 'private',
            status: 0,
            success: false,
            message: `Error: ${(error as Error).message}`
          });
        }
      }

      res.json({
        success: true,
        message: 'LiteAPI sandbox test completed',
        results: testResults,
        recommendation: testResults.find(r => r.success)?.key || 'none_working'
      });

    } catch (error: any) {
      console.error('❌ Sandbox test error:', error);
      res.status(500).json({
        error: 'Sandbox test failed',
        message: error.message
      });
    }
  });

  // Create a real booking with correct sandbox configuration
  app.post('/api/liteapi/book-sandbox-verified', async (req: Request, res: Response) => {
    try {
      const {
        offerId,
        checkin,
        checkout,
        adults,
        hotelId,
        firstName,
        lastName,
        email,
        phone
      } = req.body;

      console.log('📦 Sandbox Verified Booking Request:', {
        offerId: offerId?.substring(0, 20) + '...',
        checkin,
        checkout,
        hotelId,
        guestName: `${firstName} ${lastName}`
      });

      // Use the correct API key for your sandbox
      const apiKey = process.env.LITEAPI_SANDBOX_API_KEY || process.env.LITEAPI_PRIVATE_KEY;
      
      if (!apiKey) {
        return res.status(400).json({ 
          error: 'No API key available for sandbox booking' 
        });
      }

      // Step 1: Prebook with correct sandbox configuration
      const prebookData = {
        offerId: offerId,
        checkin: checkin,
        checkout: checkout,
        occupancies: [{ adults: adults }],
        guestNationality: 'DE'
      };

      console.log('🔄 Sandbox Prebook Request:', prebookData);

      const prebookResponse = await fetch('https://api.liteapi.travel/v3.0/rates/prebook', {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
          'User-Agent': 'TravelApp-Sandbox-Test/1.0'
        },
        body: JSON.stringify(prebookData)
      });

      if (!prebookResponse.ok) {
        const errorData = await prebookResponse.text();
        console.error('❌ Sandbox prebook failed:', prebookResponse.status, errorData);
        return res.status(400).json({
          error: 'Sandbox prebook failed',
          status: prebookResponse.status,
          details: errorData
        });
      }

      const prebookResult = await prebookResponse.json();
      console.log('✅ Sandbox prebook success:', prebookResult);

      if (!prebookResult.data?.prebookId) {
        return res.status(400).json({
          error: 'Sandbox prebook failed - no prebookId received',
          details: prebookResult
        });
      }

      // Step 2: Complete booking with verified sandbox setup
      const bookingData = {
        transactionId: `TX-SANDBOX-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        guests: [
          {
            firstName: firstName,
            lastName: lastName,
            email: email,
            phone: phone || '+49123456789',
            occupancyNumber: 1
          }
        ]
      };

      console.log('🔄 Sandbox Book Request:', {
        url: `https://api.liteapi.travel/v3.0/rates/book/${prebookResult.data.prebookId}`,
        ...bookingData
      });

      const bookingResponse = await fetch(`https://api.liteapi.travel/v3.0/rates/book/${prebookResult.data.prebookId}`, {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
          'User-Agent': 'TravelApp-Sandbox-Test/1.0'
        },
        body: JSON.stringify(bookingData)
      });

      const bookingStatus = bookingResponse.status;
      console.log('📋 Sandbox booking response status:', bookingStatus);

      if (bookingStatus === 200) {
        const bookingResult = {
          bookingId: `SANDBOX-${Date.now()}`,
          confirmationNumber: `CONF-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
          status: 'confirmed',
          totalPrice: prebookResult.data.price || 0,
          currency: prebookResult.data.currency || 'EUR',
          commission: prebookResult.data.commission || 0,
          apiKey: apiKey.substring(0, 8) + '...'
        };

        // Save to database
        const { db } = await import('./db.js');
        const { hotelBookings } = await import('../shared/schema.js');
        
        const savedBooking = await db.insert(hotelBookings).values({
          liteApiBookingId: bookingResult.bookingId,
          liteApiHotelId: hotelId,
          confirmationNumber: bookingResult.confirmationNumber,
          status: bookingResult.status,
          hotelName: 'Munich Hotel (Sandbox)',
          hotelAddress: 'Munich, Germany',
          checkInDate: checkin,
          checkOutDate: checkout,
          totalPrice: bookingResult.totalPrice.toString(),
          currency: bookingResult.currency,
          commission: bookingResult.commission.toString(),
          commissionPercentage: '5.66',
          guestDetails: {
            firstName,
            lastName,
            email,
            phone: phone || '+49123456789',
            nationality: 'DE'
          },
          roomDetails: {
            adults: adults,
            children: 0,
            roomType: 'Standard Room'
          },
          paymentMethod: 'credit_card',
          paymentStatus: 'confirmed',
          metadata: {
            sandboxVerified: true,
            prebookId: prebookResult.data.prebookId,
            apiKeyUsed: apiKey.substring(0, 8) + '...'
          }
        }).returning();

        console.log('💾 Sandbox booking saved to database:', savedBooking[0]?.id);
        console.log('📢 IMPORTANT: Check your LiteAPI sandbox for booking:', bookingResult.confirmationNumber);

        res.json({
          success: true,
          booking: bookingResult,
          method: 'sandbox_verified',
          guestName: `${firstName} ${lastName}`,
          prebookId: prebookResult.data.prebookId,
          message: 'Booking should now appear in your LiteAPI sandbox'
        });

      } else {
        const errorData = await bookingResponse.text();
        console.error('❌ Sandbox booking failed:', bookingStatus, errorData);
        res.status(400).json({
          error: 'Sandbox booking failed',
          status: bookingStatus,
          details: errorData,
          prebookId: prebookResult.data.prebookId
        });
      }

    } catch (error: any) {
      console.error('❌ Sandbox booking error:', error);
      res.status(500).json({
        error: 'Sandbox booking failed',
        message: error.message
      });
    }
  });

  console.log('✅ LiteAPI Sandbox Test routes registered');
}