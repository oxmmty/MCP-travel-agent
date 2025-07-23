/**
 * LiteAPI Direct Booking Implementation
 * Direct REST API calls without SDK to avoid CommonJS/ESM issues
 * Based on official LiteAPI documentation
 */
import { Express, Request, Response } from 'express';

interface DirectBookingRequest {
  offerId: string;
  checkin: string;
  checkout: string;
  adults: number;
  hotelId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  environment?: string;
}

export function registerDirectLiteApiRoutes(app: Express) {
  console.log('🔄 Registering Direct LiteAPI routes...');

  // Direct LiteAPI booking without SDK
  app.post('/api/liteapi/book-direct', async (req: Request, res: Response) => {
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
        phone,
        environment = 'sandbox'
      }: DirectBookingRequest = req.body;

      console.log('📦 Direct LiteAPI Book Request:', {
        offerId: offerId.substring(0, 20) + '...',
        checkin,
        checkout,
        adults,
        hotelId,
        guestName: `${firstName} ${lastName}`
      });

      // Get API key based on environment
      const apiKey = environment === 'sandbox' 
        ? process.env.LITEAPI_SANDBOX_API_KEY 
        : process.env.LITEAPI_PROD_API_KEY;

      if (!apiKey) {
        return res.status(400).json({ 
          error: `Missing ${environment} API key` 
        });
      }

      // Step 1: Prebook the rate
      const prebookResponse = await fetch('https://api.liteapi.travel/v3.0/rates/prebook', {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          offerId: offerId,
          checkin: checkin,
          checkout: checkout,
          occupancies: [{ adults: adults }],
          guestNationality: 'DE'
        })
      });

      if (!prebookResponse.ok) {
        const errorData = await prebookResponse.text();
        console.error('❌ Prebook failed:', prebookResponse.status, errorData);
        return res.status(400).json({
          error: 'Prebook failed',
          status: prebookResponse.status,
          details: errorData
        });
      }

      const prebookData = await prebookResponse.json();
      console.log('✅ Prebook success, prebookId:', prebookData.data?.prebookId);

      if (!prebookData.data?.prebookId) {
        return res.status(400).json({
          error: 'Prebook failed - no prebookId received',
          details: prebookData
        });
      }

      // Step 2: Complete the booking
      const bookingResponse = await fetch(`https://api.liteapi.travel/v3.0/rates/book/${prebookData.data.prebookId}`, {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transactionId: `TX-DIRECT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          guests: [
            {
              firstName: firstName,
              lastName: lastName,
              email: email,
              phone: phone || '+49123456789',
              occupancyNumber: 1
            }
          ]
        })
      });

      const bookingStatus = bookingResponse.status;
      console.log('📋 Booking response status:', bookingStatus);

      if (bookingStatus === 200) {
        // Success - save to database
        const bookingData = {
          bookingId: `DIRECT-${Date.now()}`,
          confirmationNumber: `CONF-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
          status: 'confirmed',
          totalPrice: prebookData.data.price || 0,
          currency: prebookData.data.currency || 'EUR',
          commission: prebookData.data.commission || 0
        };

        // Save booking to database
        const { db } = await import('./db.js');
        const { hotelBookings } = await import('../shared/schema.js');
        
        const savedBooking = await db.insert(hotelBookings).values({
          liteApiBookingId: bookingData.bookingId,
          liteApiHotelId: hotelId,
          confirmationNumber: bookingData.confirmationNumber,
          status: bookingData.status,
          hotelName: 'Munich Hotel', // Would come from prior search
          hotelAddress: 'Munich, Germany',
          checkInDate: checkin,
          checkOutDate: checkout,
          totalPrice: bookingData.totalPrice.toString(),
          currency: bookingData.currency,
          commission: bookingData.commission.toString(),
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
            directAPI: true,
            prebookId: prebookData.data.prebookId,
            originalPrebookData: prebookData.data
          }
        }).returning();

        console.log('💾 Direct booking saved to database:', savedBooking[0]?.id);

        // Revenue tracking
        if (bookingData.commission && parseFloat(bookingData.commission.toString()) > 0) {
          const { revenueTracking } = await import('../shared/schema.js');
          
          await db.insert(revenueTracking).values({
            hotelBookingId: savedBooking[0].id,
            revenueType: 'commission',
            amount: bookingData.commission.toString(),
            currency: bookingData.currency,
            percentage: 5.66,
            provider: 'liteapi',
            status: 'confirmed'
          });
        }

        res.json({
          success: true,
          booking: bookingData,
          method: 'direct_api',
          guestName: `${firstName} ${lastName}`,
          prebookId: prebookData.data.prebookId
        });

      } else {
        const errorData = await bookingResponse.text();
        console.error('❌ Booking failed:', bookingStatus, errorData);
        res.status(400).json({
          error: 'Booking failed',
          status: bookingStatus,
          details: errorData,
          prebookId: prebookData.data.prebookId
        });
      }

    } catch (error: any) {
      console.error('❌ Direct LiteAPI booking error:', error);
      res.status(500).json({
        error: 'Direct booking failed',
        message: error.message
      });
    }
  });

  // Direct rates search
  app.get('/api/liteapi/search-rates-direct', async (req: Request, res: Response) => {
    try {
      const { checkin, checkout, adults, hotelId, environment = 'sandbox' } = req.query;

      const apiKey = environment === 'sandbox' 
        ? process.env.LITEAPI_SANDBOX_API_KEY 
        : process.env.LITEAPI_PROD_API_KEY;

      if (!apiKey) {
        return res.status(400).json({ 
          error: `Missing ${environment} API key` 
        });
      }

      // Get rates using direct API call
      const ratesResponse = await fetch('https://api.liteapi.travel/v3.0/rates', {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hotelIds: [hotelId as string],
          checkin: checkin as string,
          checkout: checkout as string,
          occupancies: [{ adults: parseInt(adults as string, 10) }],
          currency: 'EUR',
          guestNationality: 'DE'
        })
      });

      if (!ratesResponse.ok) {
        const errorData = await ratesResponse.text();
        return res.status(400).json({
          error: 'Rates search failed',
          status: ratesResponse.status,
          details: errorData
        });
      }

      const ratesData = await ratesResponse.json();

      res.json({
        success: true,
        rates: ratesData,
        method: 'direct_api'
      });

    } catch (error: any) {
      console.error('❌ Direct rates search error:', error);
      res.status(500).json({
        error: 'Direct rates search failed',
        message: error.message
      });
    }
  });

  console.log('✅ Direct LiteAPI routes registered');
}