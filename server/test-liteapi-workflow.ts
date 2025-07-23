/**
 * Test des offiziellen LiteAPI 3-Schritt Workflows
 * Basierend auf: https://docs.liteapi.travel/reference/workflow
 */

async function testOfficialWorkflow() {
  const privateKey = process.env.LITEAPI_PRIVATE_KEY;
  
  if (!privateKey) {
    console.log('❌ LITEAPI_PRIVATE_KEY fehlt');
    return;
  }

  console.log('🔄 Testing offizieller LiteAPI Workflow...\n');

  try {
    const hotelId = 'lp19cc3'; // Bekanntes funktionierendes Hotel

    // SCHRITT 1: Hotel Rates abrufen
    console.log('1️⃣ SCHRITT 1: Hotel Rates abrufen');
    
    const ratesRequest = {
      hotelIds: [hotelId],
      checkin: '2025-08-01',
      checkout: '2025-08-03',
      occupancies: [{ adults: 2, children: [] }],
      currency: 'EUR',
      guestNationality: 'DE'
    };

    const ratesResponse = await fetch('https://api.liteapi.travel/v3.0/hotels/rates', {
      method: 'POST',
      headers: {
        'X-API-Key': privateKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ratesRequest)
    });

    if (!ratesResponse.ok) {
      console.log('❌ Rates Request fehlgeschlagen:', ratesResponse.status);
      return;
    }

    const ratesData = await ratesResponse.json();
    console.log('✅ Rates Response erhalten');
    
    // Debugging: Vollständige Struktur ausgeben
    console.log('\n📊 RESPONSE STRUKTUR:');
    console.log('Data length:', ratesData.data?.length);
    
    if (ratesData.data && ratesData.data.length > 0) {
      const hotel = ratesData.data[0];
      console.log('Hotel ID:', hotel.hotelId);
      console.log('Room Types:', hotel.roomTypes?.length);
      
      // Erste verfügbare Rate finden
      let firstAvailableRate = null;
      
      if (hotel.roomTypes && hotel.roomTypes.length > 0) {
        console.log('\n🔍 Suche nach verfügbaren Rates...');
        
        for (let i = 0; i < Math.min(5, hotel.roomTypes.length); i++) {
          const roomType = hotel.roomTypes[i];
          console.log(`Room Type ${i}:`, Object.keys(roomType));
          
          // Prüfe verschiedene mögliche Strukturen
          if (roomType.offers && roomType.offers.length > 0) {
            const offer = roomType.offers[0];
            firstAvailableRate = {
              rateId: offer.rateId,
              roomTypeId: roomType.roomTypeId,
              offerId: offer.offerId,
              price: offer.retailRate?.total?.[0]?.amount,
              currency: offer.retailRate?.total?.[0]?.currency
            };
            console.log(`✅ Rate gefunden in offers[0]:`, firstAvailableRate);
            break;
          }
          
          if (roomType.rates && roomType.rates.length > 0) {
            const rate = roomType.rates[0];
            firstAvailableRate = {
              rateId: rate.rateId || rate.id,
              roomTypeId: roomType.roomTypeId || roomType.id,
              price: rate.price || rate.amount,
              currency: rate.currency
            };
            console.log(`✅ Rate gefunden in rates[0]:`, firstAvailableRate);
            break;
          }
        }
      }

      if (!firstAvailableRate) {
        console.log('❌ Keine buchbare Rate gefunden');
        // Debug: Zeige erste RoomType Struktur
        if (hotel.roomTypes && hotel.roomTypes.length > 0) {
          console.log('\n🔍 Debug erste RoomType Struktur:');
          console.log(JSON.stringify(hotel.roomTypes[0], null, 2));
        }
        return;
      }

      // SCHRITT 2: Prebook
      console.log('\n2️⃣ SCHRITT 2: Prebook');
      
      const prebookRequest = {
        rateId: firstAvailableRate.rateId,
        checkin: '2025-08-01',
        checkout: '2025-08-03',
        occupancies: [{ adults: 2, children: [] }],
        guestNationality: 'DE'
      };

      console.log('Prebook Request:', prebookRequest);

      const prebookResponse = await fetch('https://api.liteapi.travel/v3.0/rates/prebook', {
        method: 'POST',
        headers: {
          'X-API-Key': privateKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(prebookRequest)
      });

      console.log('Prebook Status:', prebookResponse.status);

      if (prebookResponse.ok) {
        const prebookData = await prebookResponse.json();
        console.log('✅ Prebook erfolgreich:', {
          prebookId: prebookData.data?.prebookId || prebookData.prebookId,
          status: prebookData.status
        });

        // SCHRITT 3: Book (nur simulation, nicht ausführen)
        console.log('\n3️⃣ SCHRITT 3: Book (Simulation)');
        console.log('Book Request würde enthalten:', {
          prebookId: prebookData.data?.prebookId || prebookData.prebookId,
          guests: [{
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com'
          }]
        });
        
        console.log('\n🎯 WORKFLOW TEST ERFOLGREICH!');
      } else {
        const errorText = await prebookResponse.text();
        console.log('❌ Prebook fehlgeschlagen:', errorText);
      }
    }

  } catch (error: any) {
    console.error('❌ Workflow Fehler:', error.message);
  }
}

testOfficialWorkflow();