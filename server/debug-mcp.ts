// Debug script to show MCP tool registration
import { MCPClient } from './mcp/client';

async function debugMCP() {
  console.log('=== MCP Integration Debug ===');
  
  const client = new MCPClient();
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const tools = await client.getAllTools();
  
  console.log(`\nTotal registered tools: ${tools.length}\n`);
  
  const serverGroups = {
    'google-maps': tools.filter(t => t.name.startsWith('google-maps')),
    'tripadvisor': tools.filter(t => t.name.startsWith('tripadvisor')),
    'storage': tools.filter(t => t.name.startsWith('storage'))
  };
  
  Object.entries(serverGroups).forEach(([server, serverTools]) => {
    console.log(`${server.toUpperCase()} Server (${serverTools.length} tools):`);
    serverTools.forEach(tool => {
      console.log(`  - ${tool.name}`);
    });
    console.log('');
  });
  
  // Test TripAdvisor API connectivity if key is available
  if (process.env.TRIPADVISOR_API_KEY) {
    console.log('TripAdvisor API Key: ✓ Available');
    
    try {
      const testCall = {
        name: 'search_location',
        arguments: { searchQuery: 'Paris', category: 'geos' }
      };
      
      const result = await client.executeTool({
        name: 'tripadvisor_search_location',
        arguments: testCall.arguments
      });
      
      console.log('TripAdvisor API Test: ✓ Working');
      console.log('Sample response length:', result.content[0].text?.length || 0);
    } catch (error) {
      console.log('TripAdvisor API Test: ✗ Error -', error.message);
    }
  } else {
    console.log('TripAdvisor API Key: ✗ Missing');
  }
}

debugMCP().catch(console.error);