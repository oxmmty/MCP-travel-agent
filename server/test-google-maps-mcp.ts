// Test Google Maps MCP integration directly
import { MCPClient } from './mcp/client';

async function testGoogleMapsMCP() {
  console.log('=== Testing Google Maps MCP Integration ===');
  
  try {
    const client = new MCPClient();
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Test destination search
    console.log('\n1. Testing destination search...');
    const searchResult = await client.executeTool({
      name: 'google-maps_search_destination',
      arguments: { query: 'Cochem, Germany' }
    });
    
    if (searchResult.isError) {
      console.error('❌ Search failed:', searchResult.content[0].text);
      return;
    }
    
    const destinationData = JSON.parse(searchResult.content[0].text || '{}');
    console.log('✅ Found destination:', destinationData.name);
    console.log('   Coordinates:', destinationData.location);
    
    // Test nearby hotels
    console.log('\n2. Testing nearby hotels search...');
    const hotelsResult = await client.executeTool({
      name: 'google-maps_find_nearby_hotels',
      arguments: { 
        lat: destinationData.location.lat, 
        lng: destinationData.location.lng,
        radius: 10000
      }
    });
    
    if (hotelsResult.isError) {
      console.error('❌ Hotels search failed:', hotelsResult.content[0].text);
      return;
    }
    
    const hotelsData = JSON.parse(hotelsResult.content[0].text || '{}');
    console.log('✅ Found hotels:', hotelsData.count);
    
    // Test nearby attractions
    console.log('\n3. Testing nearby attractions search...');
    const attractionsResult = await client.executeTool({
      name: 'google-maps_find_nearby_attractions',
      arguments: { 
        lat: destinationData.location.lat, 
        lng: destinationData.location.lng,
        radius: 25000
      }
    });
    
    if (attractionsResult.isError) {
      console.error('❌ Attractions search failed:', attractionsResult.content[0].text);
      return;
    }
    
    const attractionsData = JSON.parse(attractionsResult.content[0].text || '{}');
    console.log('✅ Found attractions:', attractionsData.count);
    
    console.log('\n✅ All Google Maps MCP tests passed successfully!');
    
  } catch (error) {
    console.error('❌ MCP Test Error:', error instanceof Error ? error.message : String(error));
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace available');
  }
}

testGoogleMapsMCP();