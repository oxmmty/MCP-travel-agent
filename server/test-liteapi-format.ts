#!/usr/bin/env tsx

/**
 * LiteAPI Format Tester
 * Tests the exact API format required by LiteAPI v3.0
 */

async function testLiteAPIFormats() {
  const privateKey = process.env.LITEAPI_PRIVATE_KEY;
  if (!privateKey) {
    console.error('❌ LITEAPI_PRIVATE_KEY not found');
    return;
  }

  console.log('🔍 Testing LiteAPI v3.0 Format Requirements...\n');

  // Test 1: Get hotel rates to understand the response format
  console.log('1️⃣ Testing Rates Endpoint to get OfferID format...');
  try {
    const ratesUrl = 'https://api.liteapi.travel/v3.0/hotels/rates?hotelId=lp19cc3&checkin=2025-08-01&checkout=2025-08-03&adults=2';
    
    const ratesResponse = await fetch(ratesUrl, {
      headers: { 'X-API-Key': privateKey }
    });

    console.log(`📊 Rates Response Status: ${ratesResponse.status}`);
    
    if (ratesResponse.ok) {
      const ratesData = await ratesResponse.json();
      console.log('✅ Rates Response Structure:');
      console.log(JSON.stringify(ratesData, null, 2));
      
      // Extract the first offer ID for testing
      if (ratesData.data && ratesData.data.length > 0) {
        const firstOffer = ratesData.data[0];
        console.log('\n🎯 First Offer Details:');
        console.log(`- Offer ID: ${firstOffer.offerID || firstOffer.offer_id || 'NOT_FOUND'}`);
        console.log(`- Rate ID: ${firstOffer.rateId || firstOffer.rate_id || 'NOT_FOUND'}`);
        console.log(`- Price: ${firstOffer.price || firstOffer.totalPrice || 'NOT_FOUND'}`);
        
        // Test 2: Prebook with the actual offer ID
        console.log('\n2️⃣ Testing Prebook with real OfferID...');
        const offerID = firstOffer.offerID || firstOffer.offer_id;
        
        if (offerID) {
          const prebookData = {
            OfferID: offerID,
            Rooms: [
              {
                Adults: 2,
                Children: []
              }
            ]
          };

          console.log('📤 Prebook Request:', JSON.stringify(prebookData, null, 2));

          const prebookResponse = await fetch('https://api.liteapi.travel/v3.0/rates/prebook', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': privateKey
            },
            body: JSON.stringify(prebookData)
          });

          console.log(`📊 Prebook Response Status: ${prebookResponse.status}`);
          
          if (prebookResponse.ok) {
            const prebookResult = await prebookResponse.json();
            console.log('✅ Prebook Response:');
            console.log(JSON.stringify(prebookResult, null, 2));
            
            // Test 3: Booking with correct format
            console.log('\n3️⃣ Testing Booking with real PrebookID...');
            const prebookID = prebookResult.prebookId || prebookResult.PrebookID;
            
            if (prebookID) {
              const bookData = {
                PrebookID: prebookID,
                Guests: [
                  {
                    OccupancyNumber: 1,
                    FirstName: "Max",
                    LastName: "Mustermann",
                    Email: "test@example.com",
                    Phone: "+49123456789",
                    DateOfBirth: "1990-01-01",
                    Nationality: "DE"
                  }
                ],
                PaymentMethod: "pay_at_hotel",
                SpecialRequests: ""
              };

              console.log('📤 Book Request:', JSON.stringify(bookData, null, 2));

              const bookResponse = await fetch('https://api.liteapi.travel/v3.0/rates/book', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-API-Key': privateKey
                },
                body: JSON.stringify(bookData)
              });

              console.log(`📊 Book Response Status: ${bookResponse.status}`);
              
              if (bookResponse.ok) {
                const bookResult = await bookResponse.json();
                console.log('✅ Booking Success!');
                console.log(JSON.stringify(bookResult, null, 2));
              } else {
                const errorText = await bookResponse.text();
                console.log('❌ Book Error:', errorText);
              }
            }
          } else {
            const errorText = await prebookResponse.text();
            console.log('❌ Prebook Error:', errorText);
          }
        }
      }
    } else {
      const errorText = await ratesResponse.text();
      console.log('❌ Rates Error:', errorText);
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testLiteAPIFormats();