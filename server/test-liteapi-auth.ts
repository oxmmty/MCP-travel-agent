/**
 * Test different LiteAPI authentication methods
 */

async function testAuthMethods() {
  const publicKey = process.env.LITEAPI_PUBLIC_KEY;
  const privateKey = process.env.LITEAPI_PRIVATE_KEY;
  
  console.log('Testing LiteAPI authentication methods...');
  console.log(`Public Key: ${publicKey?.substring(0, 20)}...`);
  console.log(`Private Key: ${privateKey?.substring(0, 20)}...`);
  
  const testCases = [
    {
      name: 'Public key with data endpoint',
      url: 'https://api.liteapi.travel/v3.0/data/countries',
      key: publicKey
    },
    {
      name: 'Private key with data endpoint', 
      url: 'https://api.liteapi.travel/v3.0/data/countries',
      key: privateKey
    },
    {
      name: 'Public key with hotels endpoint',
      url: 'https://api.liteapi.travel/v3.0/data/hotels?limit=1',
      key: publicKey
    },
    {
      name: 'Private key with hotels endpoint',
      url: 'https://api.liteapi.travel/v3.0/data/hotels?limit=1', 
      key: privateKey
    },
    {
      name: 'Public key with cities endpoint',
      url: 'https://api.liteapi.travel/v3.0/data/cities?countryCode=DE&limit=1',
      key: publicKey
    }
  ];

  for (const test of testCases) {
    console.log(`\nTesting: ${test.name}`);
    
    try {
      const response = await fetch(test.url, {
        headers: {
          'X-API-Key': test.key || ''
        }
      });

      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('SUCCESS! Authentication working');
        console.log(`Response data available: ${!!data.data}`);
        
        if (data.data) {
          console.log(`Items returned: ${data.data.length}`);
          if (data.data.length > 0) {
            console.log(`Sample item:`, JSON.stringify(data.data[0]).substring(0, 100));
          }
        }
        
        return { success: true, workingKey: test.key, endpoint: test.url, data };
      } else {
        const errorText = await response.text();
        console.log(`Error: ${errorText.substring(0, 150)}`);
      }
    } catch (error) {
      console.log(`Request failed: ${error.message}`);
    }
  }

  console.log('\nAll authentication tests failed.');
  console.log('Possible issues:');
  console.log('1. Keys need to be regenerated in LiteAPI dashboard');
  console.log('2. Account has restrictions or quotas exceeded');
  console.log('3. Different API version required for sandbox');
  console.log('4. Additional headers or parameters needed');
  
  return { success: false };
}

testAuthMethods().catch(console.error);

export { testAuthMethods };