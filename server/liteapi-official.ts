/**
 * LiteAPI Official Implementation
 * Based on official example: https://github.com/liteapi-travel/build-website-example
 */
import { Express, Request, Response } from 'express';

// Type definitions from official example
interface BookingRequest {
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

export function registerOfficialLiteApiRoutes(app: Express) {
  console.log('🔄 Registering Official LiteAPI routes...');

  // Official LiteAPI booking endpoint based on example
  app.post('/api/liteapi/book-official', async (req: Request, res: Response) => {
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
      }: BookingRequest = req.body;

      console.log('📦 Official LiteAPI Book Request:', {
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

      // Import and initialize LiteAPI SDK (CommonJS module)
      const liteApi = (await import('liteapi-node-sdk')).default;
      const sdk = liteApi(apiKey);

      // Prepare booking data according to official example
      const bookingData = {
        offerId: offerId,
        travelers: [
          {
            firstName: firstName,
            lastName: lastName,
            email: email,
            phone: phone || '+49123456789',
            dateOfBirth: '1990-01-01' // Required by API
          }
        ]
      };

      console.log('🔄 Official SDK Book Request:', {
        offerId: offerId.substring(0, 20) + '...',
        travelers: bookingData.travelers.length,
        guestName: `${firstName} ${lastName}`
      });

      // Call official LiteAPI SDK book method
      const bookingResponse = await sdk.book(bookingData);
      
      console.log('✅ Official SDK booking response status:', bookingResponse.status);
      console.log('📋 Official SDK booking data:', bookingResponse.data);

      if (bookingResponse.status === 200 && bookingResponse.data) {
        const booking = bookingResponse.data;
        
        // Save booking to database
        const { db } = await import('./db.js');
        const { hotelBookings } = await import('../shared/schema.js');
        
        const savedBooking = await db.insert(hotelBookings).values({
          liteApiBookingId: booking.bookingId || `OFFICIAL-${Date.now()}`,
          liteApiHotelId: hotelId,
          confirmationNumber: booking.bookingReference || `REF-${Date.now()}`,
          status: booking.status || 'confirmed',
          hotelName: 'Hotel Name', // Would come from prior search
          hotelAddress: 'Hotel Address',
          checkInDate: checkin,
          checkOutDate: checkout,
          totalPrice: booking.totalPrice?.toString() || '0',
          currency: booking.currency || 'EUR',
          commission: booking.commission?.toString() || '0',
          commissionPercentage: '0',
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
            officialSDK: true,
            bookingData: booking
          }
        }).returning();

        console.log('💾 Official booking saved to database:', savedBooking[0]?.id);

        // Revenue tracking
        if (booking.commission && parseFloat(booking.commission.toString()) > 0) {
          const { revenueTracking } = await import('../shared/schema.js');
          
          await db.insert(revenueTracking).values({
            bookingId: savedBooking[0].id,
            revenueType: 'commission',
            amount: booking.commission.toString(),
            currency: booking.currency || 'EUR',
            percentage: 0,
            provider: 'liteapi',
            status: 'confirmed'
          });
        }

        res.json({
          success: true,
          booking: {
            bookingId: booking.bookingId,
            confirmationNumber: booking.bookingReference,
            status: booking.status,
            totalPrice: booking.totalPrice,
            currency: booking.currency,
            commission: booking.commission
          },
          method: 'official_sdk',
          guestName: `${firstName} ${lastName}`
        });

      } else {
        console.error('❌ Official booking failed:', bookingResponse);
        res.status(400).json({
          error: 'Official booking failed',
          details: bookingResponse.data || 'Unknown error'
        });
      }

    } catch (error: any) {
      console.error('❌ Official LiteAPI booking error:', error);
      res.status(500).json({
        error: 'Official booking failed',
        message: error.message,
        details: error.response?.data || error
      });
    }
  });

  // Search rates endpoint based on official example
  app.get('/api/liteapi/search-rates-official', async (req: Request, res: Response) => {
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

      const liteApi = (await import('liteapi-node-sdk')).default;
      const sdk = liteApi(apiKey);

      // Get rates using official SDK method
      const rates = await sdk.getFullRates({
        hotelIds: [hotelId as string],
        occupancies: [{ adults: parseInt(adults as string, 10) }],
        currency: 'EUR',
        guestNationality: 'DE',
        checkin: checkin as string,
        checkout: checkout as string,
      });

      // Get hotel details
      const hotelDetails = await sdk.getHotelDetails(hotelId as string);

      res.json({
        success: true,
        rates: rates.data,
        hotelInfo: hotelDetails.data
      });

    } catch (error: any) {
      console.error('❌ Official rates search error:', error);
      res.status(500).json({
        error: 'Official rates search failed',
        message: error.message
      });
    }
  });

  console.log('✅ Official LiteAPI routes registered');
}