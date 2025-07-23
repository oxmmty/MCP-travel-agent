/**
 * Test der korrigierten LiteAPI-Implementation
 * Testet die korrekte POST-Methode für Hotel-Rates
 */

async function testCorrectedLiteAPI() {
  const privateKey = process.env.LITEAPI_PRIVATE_KEY;
  
  if (!privateKey) {
    console.log('❌ LITEAPI_PRIVATE_KEY nicht gefunden');
    return;
  }

  console.log('🧪 Testing korrigierte LiteAPI-Implementation...\n');

  try {
    // Schritt 1: Hotel-Suche (funktioniert bereits)
    console.log('1️⃣ Hotel-Suche in München...');
    const hotelSearchUrl = 'https://api.liteapi.travel/v3.0/data/hotels?countryCode=DE&cityName=Munich&limit=5';
    
    const hotelResponse = await fetch(hotelSearchUrl, {
      headers: {
        'X-API-Key': privateKey
      }
    });

    if (!hotelResponse.ok) {
      console.log(`❌ Hotel-Suche fehlgeschlagen: ${hotelResponse.status}`);
      return;
    }

    const hotelData = await hotelResponse.json();
    console.log(`✅ ${hotelData.data?.length || 0} Hotels gefunden`);

    if (!hotelData.data || hotelData.data.length === 0) {
      console.log('❌ Keine Hotels für Test verfügbar');
      return;
    }

    const testHotel = hotelData.data[0];
    console.log(`📍 Test-Hotel: ${testHotel.name} (ID: ${testHotel.id})\n`);

    // Schritt 2: Hotel-Rates mit korrigierter POST-Methode
    console.log('2️⃣ Hotel-Rates abrufen (POST-Methode)...');
    
    const ratesRequestBody = {
      hotelIds: [testHotel.id],
      checkin: '2025-08-01',
      checkout: '2025-08-03',
      adults: 2,
      children: 0,
      currency: 'EUR',
      guestNationality: 'DE'
    };

    console.log('📤 Request-Body:', JSON.stringify(ratesRequestBody, null, 2));

    const ratesResponse = await fetch('https://api.liteapi.travel/v3.0/hotels/rates', {
      method: 'POST',
      headers: {
        'X-API-Key': privateKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ratesRequestBody)
    });

    console.log(`📊 Rates Response Status: ${ratesResponse.status}`);

    if (!ratesResponse.ok) {
      const errorText = await ratesResponse.text();
      console.log(`❌ Rates-Anfrage fehlgeschlagen:`, errorText);
      return;
    }

    const ratesData = await ratesResponse.json();
    console.log('📋 Rates Response Structure:');
    console.log('- data array length:', ratesData.data?.length || 0);
    
    if (ratesData.data && ratesData.data.length > 0) {
      const hotelRates = ratesData.data.find((hotel: any) => hotel.hotelId === testHotel.id);
      
      if (hotelRates) {
        console.log(`✅ Rates für Hotel ${testHotel.id} gefunden:`);
        console.log(`- Verfügbare Rates: ${hotelRates.data?.length || 0}`);
        
        if (hotelRates.data && hotelRates.data.length > 0) {
          const sampleRate = hotelRates.data[0];
          console.log(`- Beispiel-Rate: ${sampleRate.net_rate || sampleRate.price} EUR`);
          console.log(`- Zimmertyp: ${sampleRate.room_type_name || sampleRate.roomType}`);
          console.log(`- Rate-ID: ${sampleRate.rateId || sampleRate.id}`);

          // Schritt 3: Prebook testen
          console.log('\n3️⃣ Prebook-Test...');
          
          const prebookData = {
            hotelId: testHotel.id,
            rateId: sampleRate.rateId || sampleRate.id,
            checkin: '2025-08-01',
            checkout: '2025-08-03',
            adults: 2,
            children: 0,
            currency: 'EUR',
            guestNationality: 'DE'
          };

          console.log('📤 Prebook Request:', JSON.stringify(prebookData, null, 2));

          const prebookResponse = await fetch('https://api.liteapi.travel/v3.0/rates/prebook', {
            method: 'POST',
            headers: {
              'X-API-Key': privateKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(prebookData)
          });

          console.log(`📊 Prebook Response Status: ${prebookResponse.status}`);

          if (prebookResponse.ok) {
            const prebookResult = await prebookResponse.json();
            console.log('✅ Prebook erfolgreich!');
            console.log('- Prebook-ID:', prebookResult.data?.prebookId || prebookResult.prebookId);
            console.log('- Läuft ab:', prebookResult.data?.expiresAt || prebookResult.expiresAt);
            console.log('- Gesamtpreis:', prebookResult.data?.totalPrice || prebookResult.totalPrice);
          } else {
            const errorText = await prebookResponse.text();
            console.log('❌ Prebook fehlgeschlagen:', errorText);
          }
        }
      } else {
        console.log('❌ Keine Rates für dieses Hotel gefunden');
      }
    } else {
      console.log('❌ Keine Rate-Daten in der Response');
    }

    console.log('\n🎯 Test abgeschlossen!');

  } catch (error: any) {
    console.error('❌ Test-Fehler:', error.message);
  }
}

// Test ausführen
testCorrectedLiteAPI();