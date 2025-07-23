/**
 * Debug Script zur Analyse der echten LiteAPI Response-Struktur
 */

async function debugLiteAPIResponse() {
  const privateKey = process.env.LITEAPI_PRIVATE_KEY;
  
  if (!privateKey) {
    console.log('❌ LITEAPI_PRIVATE_KEY nicht gefunden');
    return;
  }

  console.log('🔍 Analysiere LiteAPI Response-Struktur...\n');

  try {
    // Test mit bekannter Hotel-ID aus den Logs
    const hotelId = 'lp19cc3';
    
    const ratesRequestBody = {
      hotelIds: [hotelId],
      checkin: '2025-08-01',
      checkout: '2025-08-03',
      occupancies: [
        {
          adults: 2,
          children: []
        }
      ],
      currency: 'EUR',
      guestNationality: 'DE'
    };

    console.log('📤 Request:', JSON.stringify(ratesRequestBody, null, 2));

    const response = await fetch('https://api.liteapi.travel/v3.0/hotels/rates', {
      method: 'POST',
      headers: {
        'X-API-Key': privateKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ratesRequestBody)
    });

    console.log(`📊 Response Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Response Error:', errorText);
      return;
    }

    const data = await response.json();
    
    // Vollständige Response-Struktur analysieren
    console.log('\n📋 VOLLSTÄNDIGE RESPONSE-STRUKTUR:');
    console.log(JSON.stringify(data, null, 2));
    
    console.log('\n📊 STRUKTUR-ANALYSE:');
    console.log('- data array length:', data.data?.length || 0);
    
    if (data.data && data.data.length > 0) {
      const hotel = data.data[0];
      console.log('- Hotel ID:', hotel.hotelId);
      console.log('- Room Types verfügbar:', hotel.roomTypes?.length || 0);
      
      if (hotel.roomTypes && hotel.roomTypes.length > 0) {
        console.log('\n🏠 ROOM TYPES DETAILS:');
        hotel.roomTypes.forEach((roomType: any, index: number) => {
          console.log(`  [${index}] Room Type:`, {
            id: roomType.id,
            name: roomType.name,
            hasRates: !!roomType.rates,
            ratesCount: roomType.rates?.length || 0
          });
          
          if (roomType.rates && roomType.rates.length > 0) {
            console.log(`    Rates für ${roomType.name}:`);
            roomType.rates.forEach((rate: any, rateIndex: number) => {
              console.log(`      [${rateIndex}]`, {
                rateId: rate.rateId || rate.id,
                price: rate.net_rate || rate.price || rate.amount,
                currency: rate.currency,
                description: rate.description || rate.name
              });
            });
          }
        });
      }
    }

    // Rate-Auswahl testen
    console.log('\n🎯 RATE-AUSWAHL TEST:');
    if (data.data && data.data.length > 0) {
      const hotel = data.data[0];
      
      if (hotel.roomTypes && hotel.roomTypes.length > 0) {
        for (const roomType of hotel.roomTypes) {
          if (roomType.rates && roomType.rates.length > 0) {
            const firstRate = roomType.rates[0];
            console.log('✅ Erste verfügbare Rate gefunden:', {
              roomTypeId: roomType.id,
              roomTypeName: roomType.name,
              rateId: firstRate.rateId || firstRate.id,
              price: firstRate.net_rate || firstRate.price || firstRate.amount,
              currency: firstRate.currency
            });
            break;
          }
        }
      }
    }

  } catch (error: any) {
    console.error('❌ Fehler beim Debug:', error.message);
  }
}

// Debug ausführen
debugLiteAPIResponse();