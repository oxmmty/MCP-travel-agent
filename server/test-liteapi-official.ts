/**
 * Test LiteAPI with official documentation example
 */

async function testOfficialLiteAPI() {
  const publicKey = process.env.LITEAPI_PUBLIC_KEY;
  
  if (!publicKey) {
    console.log('Missing public API key');
    return;
  }

  // Official example from documentation
  const url = 'https://api.liteapi.travel/v3.0/data/hotels?countryCode=IT&cityName=Rome';
  
  console.log('Testing official LiteAPI endpoint...');
  console.log(`URL: ${url}`);
  console.log(`API Key: ${publicKey.substring(0, 15)}...`);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-Key': publicKey
      }
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log('SUCCESS! LiteAPI is working');
      console.log(`Found ${data.data?.length || 0} hotels in Rome`);
      
      if (data.data && data.data.length > 0) {
        const hotel = data.data[0];
        console.log(`Sample hotel: ${hotel.name}`);
        console.log(`Hotel ID: ${hotel.id}`);
      }
      
      return data;
    } else {
      const errorText = await response.text();
      console.log(`Error response: ${errorText}`);
    }
  } catch (error) {
    console.log(`Connection error: ${error.message}`);
  }

  return null;
}

testOfficialLiteAPI().then(result => {
  if (result) {
    console.log('\nLiteAPI integration is working correctly!');
    console.log('The hotel booking monetization system is ready to use.');
  } else {
    console.log('\nLiteAPI test failed. Please check:');
    console.log('1. API key is correct and activated');
    console.log('2. Account has proper permissions');
    console.log('3. No IP restrictions blocking the request');
  }
}).catch(console.error);

export { testOfficialLiteAPI };