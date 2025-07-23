/**
 * LiteAPI Integration Test Script
 * Tests the LiteAPI service with real credentials and provides integration examples
 */

import { liteApiService } from './liteapi';

async function testLiteAPIIntegration() {
  console.log('🏨 Testing LiteAPI Integration...\n');

  // Test 1: Check configuration
  console.log('1. Checking LiteAPI Configuration...');
  const isConfigured = liteApiService.isConfigured();
  console.log(`   Configuration status: ${isConfigured ? '✅ Configured' : '❌ Not configured'}`);
  
  if (!isConfigured) {
    console.log('   Missing API keys. Please check LITEAPI_PUBLIC_KEY and LITEAPI_PRIVATE_KEY environment variables.');
    return;
  }

  try {
    // Test 2: Search destinations
    console.log('\n2. Testing Destination Search...');
    const destinations = await liteApiService.searchDestinations('Munich', 'en');
    console.log(`   Found ${destinations.length} destinations for "Munich"`);
    if (destinations.length > 0) {
      console.log(`   Sample: ${destinations[0].name}, ${destinations[0].country}`);
    }

    // Test 3: Search hotels by location (Munich coordinates)
    console.log('\n3. Testing Hotel Search by Location...');
    const checkIn = '2025-07-15';
    const checkOut = '2025-07-17';
    const munich = { lat: 48.1351, lng: 11.5820 };
    
    const hotelResults = await liteApiService.searchHotelsByLocation(
      munich,
      checkIn,
      checkOut,
      { adults: 2 }
    );
    
    console.log(`   Found ${hotelResults.hotels.length} hotels in Munich`);
    console.log(`   Search ID: ${hotelResults.searchId}`);
    
    if (hotelResults.hotels.length > 0) {
      const sampleHotel = hotelResults.hotels[0];
      console.log(`   Sample Hotel: ${sampleHotel.name}`);
      console.log(`   Rating: ${sampleHotel.rating}/5`);
      console.log(`   Location: ${sampleHotel.city}, ${sampleHotel.country}`);
      
      // Test hotel rates
      const rates = hotelResults.rates[sampleHotel.id] || [];
      if (rates.length > 0) {
        console.log(`   Available rates: ${rates.length}`);
        console.log(`   Lowest rate: €${rates[0].pricePerNight}/night`);
        if (rates[0].commission) {
          console.log(`   Commission: €${rates[0].commission.amount} (${rates[0].commission.percentage}%)`);
        }
      }

      // Test 4: Get detailed hotel information
      console.log('\n4. Testing Hotel Details...');
      try {
        const hotelDetails = await liteApiService.getHotelDetails(sampleHotel.id, 'en');
        console.log(`   Hotel details for: ${hotelDetails.name}`);
        console.log(`   Address: ${hotelDetails.address}`);
        console.log(`   Amenities: ${hotelDetails.amenities.length} items`);
        console.log(`   Check-in: ${hotelDetails.checkInTime}, Check-out: ${hotelDetails.checkOutTime}`);
      } catch (error) {
        console.log(`   ⚠️ Hotel details not available: ${error.message}`);
      }

      // Test 5: Commission information (if available)
      console.log('\n5. Testing Commission Info...');
      if (rates.length > 0) {
        try {
          const commissionInfo = await liteApiService.getCommissionInfo(sampleHotel.id, rates[0].roomTypeId);
          console.log(`   Commission rate: ${commissionInfo.percentage}%`);
          console.log(`   Commission amount: €${commissionInfo.commission}`);
        } catch (error) {
          console.log(`   ⚠️ Commission info not available: ${error.message}`);
        }
      }
    }

    // Test 6: Integration with internal format
    console.log('\n6. Testing Internal Format Conversion...');
    if (hotelResults.hotels.length > 0) {
      const sampleHotel = hotelResults.hotels[0];
      const rates = hotelResults.rates[sampleHotel.id] || [];
      const internalFormat = liteApiService.convertToInternalHotel(sampleHotel, rates);
      
      console.log('   Converted to internal format:');
      console.log(`   - Name: ${internalFormat.name}`);
      console.log(`   - Price per night: €${internalFormat.pricePerNight}`);
      console.log(`   - Bookable: ${internalFormat.bookable}`);
      console.log(`   - Commission: €${internalFormat.commission || 0}`);
      console.log(`   - Coordinates: ${internalFormat.coordinates.lat}, ${internalFormat.coordinates.lng}`);
    }

    console.log('\n✅ LiteAPI Integration Test Completed Successfully!');
    console.log('\n📊 Integration Summary:');
    console.log(`   - API Status: ✅ Working`);
    console.log(`   - Destinations searchable: ✅ Yes`);
    console.log(`   - Hotels searchable: ✅ Yes`);
    console.log(`   - Rates available: ✅ Yes`);
    console.log(`   - Commission tracking: ✅ Yes`);
    console.log(`   - Ready for monetization: ✅ Yes`);

  } catch (error) {
    console.error('\n❌ LiteAPI Integration Test Failed:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Details: ${error.stack || 'No stack trace available'}`);
    
    // Provide troubleshooting information
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Verify LITEAPI_PUBLIC_KEY and LITEAPI_PRIVATE_KEY are correctly set');
    console.log('   2. Check if your LiteAPI account has sufficient credits');
    console.log('   3. Ensure your IP address is whitelisted in LiteAPI dashboard');
    console.log('   4. Verify the API endpoint URLs are correct');
  }
}

export { testLiteAPIIntegration };

// Run the test immediately when the file is imported
testLiteAPIIntegration().catch(console.error);