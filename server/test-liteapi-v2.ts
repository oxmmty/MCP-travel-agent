/**
 * Direct test with v2.0 API and sandbox credentials
 */

async function testLiteAPIv2() {
  const publicKey = process.env.LITEAPI_PUBLIC_KEY;
  const privateKey = process.env.LITEAPI_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    console.log('Missing API keys');
    return;
  }

  console.log(`Testing LiteAPI v2.0 with sandbox credentials...`);
  console.log(`Private key starts with: ${privateKey.substring(0, 10)}...`);

  // Test v2.0 endpoints with different authentication methods
  const tests = [
    {
      name: 'Countries endpoint with X-API-Key',
      url: 'https://api.liteapi.travel/v2.0/data/countries',
      headers: { 'X-API-Key': publicKey, 'Content-Type': 'application/json' }
    },
    {
      name: 'Hotels endpoint with X-API-Key',
      url: 'https://api.liteapi.travel/v2.0/data/hotels?countryCode=DE&limit=10',
      headers: { 'X-API-Key': publicKey, 'Content-Type': 'application/json' }
    },
    {
      name: 'Cities endpoint with Authorization Bearer',
      url: 'https://api.liteapi.travel/v2.0/data/cities?countryCode=DE',
      headers: { 'Authorization': `Bearer ${publicKey}`, 'Content-Type': 'application/json' }
    },
    {
      name: 'Hotels with private key',
      url: 'https://api.liteapi.travel/v2.0/data/hotels?countryCode=DE&limit=5',
      headers: { 'X-API-Key': privateKey, 'Content-Type': 'application/json' }
    }
  ];

  for (const test of tests) {
    console.log(`\nTesting: ${test.name}`);
    console.log(`URL: ${test.url}`);
    
    try {
      const response = await fetch(test.url, {
        method: 'GET',
        headers: test.headers
      });

      console.log(`Status: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`SUCCESS! Working endpoint found`);
        console.log(`Response sample:`, JSON.stringify(data).substring(0, 300) + '...');
        
        return {
          workingConfig: {
            baseUrl: 'https://api.liteapi.travel',
            version: 'v2.0',
            endpoint: test.url,
            headers: test.headers
          },
          response: data
        };
      } else {
        const errorText = await response.text();
        console.log(`Error: ${errorText.substring(0, 200)}...`);
      }
    } catch (error) {
      console.log(`Connection error: ${error.message}`);
    }
  }

  console.log('\nAll v2.0 tests failed. Your sandbox keys may require:');
  console.log('1. Account activation in LiteAPI dashboard');
  console.log('2. Different API endpoints for sandbox environment');
  console.log('3. Special headers or authentication method');
  
  return null;
}

testLiteAPIv2().then(result => {
  if (result) {
    console.log('\n=== SOLUTION FOUND ===');
    console.log('Update your LiteAPI service with these settings:');
    console.log(JSON.stringify(result.workingConfig, null, 2));
  }
}).catch(console.error);

export { testLiteAPIv2 };