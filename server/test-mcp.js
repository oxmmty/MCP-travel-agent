// Quick test script to verify MCP tools are properly registered
import { MCPClient } from './mcp/client.js';

async function testMCPTools() {
  console.log('Testing MCP Client initialization...');
  
  try {
    const client = new MCPClient();
    
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const tools = await client.getAllTools();
    console.log('\nRegistered MCP Tools:');
    tools.forEach(tool => {
      console.log(`- ${tool.name}: ${tool.description}`);
    });
    
    console.log(`\nTotal tools registered: ${tools.length}`);
    
    // Test if TripAdvisor tools are present
    const tripAdvisorTools = tools.filter(t => t.name.includes('tripadvisor'));
    console.log(`\nTripAdvisor tools: ${tripAdvisorTools.length}`);
    tripAdvisorTools.forEach(tool => {
      console.log(`- ${tool.name}`);
    });
    
  } catch (error) {
    console.error('Error testing MCP tools:', error);
  }
}

testMCPTools();