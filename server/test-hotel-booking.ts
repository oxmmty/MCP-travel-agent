// Test endpoint to create hotels with LiteAPI booking data for demonstration
import { Express } from 'express';

export function registerTestHotelRoutes(app: Express) {
  // Create test hotels with LiteAPI booking data
  app.get('/api/test/hotels-with-booking', async (req, res) => {
    try {
      // Fetch real LiteAPI data
      const liteApiResponse = await fetch('http://localhost:5000/api/liteapi/hotels/munich');
      let liteApiHotels = [];
      
      if (liteApiResponse.ok) {
        const data = await liteApiResponse.json();
        liteApiHotels = data.hotels || [];
      }

      // Create test hotels with full booking data
      const testHotels = liteApiHotels.slice(0, 3).map((hotel: any, index: number) => ({
        id: `test-hotel-${index + 1}`,
        name: hotel.name,
        type: 'hotel' as const,
        description: hotel.description,
        rating: hotel.rating,
        pricePerNight: hotel.pricePerNight,
        imageUrl: `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&auto=format`,
        location: {
          address: hotel.description,
          coordinates: hotel.coordinates
        },
        contact: {
          phone: '+49 89 123456789',
          website: 'https://example.com'
        },
        // Complete LiteAPI booking data
        liteApiData: {
          id: hotel.liteApiId,
          bookable: true,
          commission: hotel.commission,
          rates: [
            {
              roomTypeId: 'standard',
              roomTypeName: 'Standard Doppelzimmer',
              boardType: 'Nur Übernachtung',
              pricePerNight: hotel.pricePerNight,
              cancellationPolicy: 'Kostenlose Stornierung bis 24h vor Anreise',
              commission: { amount: hotel.commission, percentage: 12 }
            },
            {
              roomTypeId: 'deluxe',
              roomTypeName: 'Deluxe Zimmer mit Stadtblick',
              boardType: 'Frühstück inklusive',
              pricePerNight: hotel.pricePerNight + 50,
              cancellationPolicy: 'Kostenlose Stornierung bis 24h vor Anreise',
              commission: { amount: hotel.commission + 8, percentage: 12 }
            }
          ],
          amenities: ['WiFi', 'Restaurant', 'Fitnessstudio', 'Parkplatz'],
          checkInTime: '15:00',
          checkOutTime: '11:00'
        }
      }));

      res.json({
        success: true,
        hotels: testHotels,
        message: `${testHotels.length} Hotels mit vollständigen Buchungsdaten erstellt`,
        instruction: 'Klicken Sie auf ein Hotel in der Karte um die Buchungsoptionen zu sehen'
      });

    } catch (error: any) {
      res.status(500).json({ 
        error: 'Test hotels creation failed',
        message: error.message 
      });
    }
  });

  // Create booking test endpoint
  app.post('/api/test/hotel-booking', async (req, res) => {
    try {
      const { hotelId, checkIn, checkOut, guests, guestDetails, paymentMethod } = req.body;
      
      // Simulate booking process
      const bookingId = `TEST-${Date.now()}`;
      const totalPrice = 450; // 3 nights x 150€
      const commission = 54; // 12% commission

      const booking = {
        bookingId,
        confirmationNumber: `CONF-${bookingId}`,
        status: 'confirmed',
        hotelId,
        checkIn,
        checkOut,
        guests,
        guestDetails,
        paymentMethod,
        totalPrice,
        commission: {
          amount: commission,
          percentage: 12,
          currency: 'EUR'
        },
        created: new Date().toISOString()
      };

      res.json({
        success: true,
        booking,
        message: 'Testbuchung erfolgreich erstellt',
        revenue: {
          hotelRevenue: totalPrice - commission,
          platformCommission: commission,
          conversionRate: '2.5%'
        }
      });

    } catch (error: any) {
      res.status(500).json({ 
        error: 'Booking test failed',
        message: error.message 
      });
    }
  });
}