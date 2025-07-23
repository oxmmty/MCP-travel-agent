// Test chat integration with MCP Google Maps
import { getChatCompletionWithMCP } from './mcp/openai-mcp';
import type { Message } from '@shared/schema';

async function testChatIntegration() {
  console.log('=== Testing Chat Integration with MCP Google Maps ===');
  
  try {
    // Create test messages
    const testMessages: Message[] = [
      {
        id: 1,
        chatId: 1,
        role: 'user',
        content: 'Tell me about hotels in Paris, France',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    console.log('\n1. Testing chat with travel query...');
    console.log('Query:', testMessages[0].content);
    
    const response = await getChatCompletionWithMCP(testMessages, 'en');
    
    console.log('\n2. AI Response received:');
    console.log('Length:', response.length, 'characters');
    console.log('First 200 characters:', response.substring(0, 200));
    
    if (response.includes('Google Maps') || response.includes('hotel') || response.includes('Paris')) {
      console.log('\n✅ Response contains relevant travel information');
    } else {
      console.log('\n⚠️ Response may not contain expected travel information');
    }
    
    console.log('\n✅ Chat integration test completed successfully!');
    
  } catch (error) {
    console.error('❌ Chat Integration Test Error:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.message.includes('API key')) {
      console.log('💡 This might be an OpenAI API key issue');
    }
  }
}

testChatIntegration();