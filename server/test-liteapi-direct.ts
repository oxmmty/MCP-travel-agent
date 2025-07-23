/**
 * Direct LiteAPI Test - Using official documentation endpoints
 */

async function testLiteAPIDirectly() {
  console.log('Testing LiteAPI with official documentation endpoints...\n');

  const publicKey = process.env.LITEAPI_PUBLIC_KEY;
  const privateKey = process.env.LITEAPI_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    console.log('❌ Missing API keys');
    return;
  }

  console.log('✅ API keys found');
  console.log(`Public Key: ${publicKey.substring(0, 10)}...`);
  console.log(`Private Key: ${privateKey.substring(0, 10)}...`);

  // Test different versions and endpoints from official docs
  const testCases = [
    { version: 'v1.0', endpoint: 'data/countries' },
    { version: 'v1.0', endpoint: 'data/destinations' },
    { version: 'v2.0', endpoint: 'data/countries' },
    { version: 'v3.0', endpoint: 'data/destinations' },
  ];

  for (const testCase of testCases) {
    console.log(`\nTesting ${testCase.version}/${testCase.endpoint}...`);
    
    const url = `https://api.liteapi.travel/${testCase.version}/${testCase.endpoint}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-API-Key': publicKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ SUCCESS! Working endpoint found');
        console.log(`Response sample:`, JSON.stringify(data).substring(0, 200) + '...');
        
        // Update the service configuration
        console.log(`\n🎉 Found working configuration:`);
        console.log(`Base URL: https://api.liteapi.travel`);
        console.log(`Version: ${testCase.version}`);
        console.log(`Endpoint: ${testCase.endpoint}`);
        return { version: testCase.version, success: true };
      } else {
        const errorText = await response.text();
        console.log(`❌ Failed: ${errorText.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`❌ Connection error: ${error.message}`);
    }
  }

  // Test with different authentication methods
  console.log('\n\nTesting alternative authentication methods...');
  
  const authTests = [
    { header: 'Authorization', value: `Bearer ${publicKey}` },
    { header: 'X-API-TOKEN', value: publicKey },
    { header: 'API-Key', value: publicKey },
  ];

  for (const auth of authTests) {
    console.log(`\nTesting with ${auth.header} header...`);
    
    try {
      const response = await fetch('https://api.liteapi.travel/v1.0/data/countries', {
        method: 'GET',
        headers: {
          [auth.header]: auth.value,
          'Content-Type': 'application/json'
        }
      });

      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        console.log('✅ SUCCESS! Alternative auth method works');
        const data = await response.json();
        console.log(`Response:`, JSON.stringify(data).substring(0, 200) + '...');
        return { authMethod: auth, success: true };
      }
    } catch (error) {
      console.log(`❌ Auth test failed: ${error.message}`);
    }
  }

  console.log('\n❌ All tests failed. Possible issues:');
  console.log('1. API keys are for a different environment');
  console.log('2. Account not activated or verified');
  console.log('3. IP address not whitelisted');
  console.log('4. API endpoint URLs have changed');
  console.log('5. Authentication method is different than documented');
}

// Run the test
testLiteAPIDirectly().catch(console.error);

export { testLiteAPIDirectly };