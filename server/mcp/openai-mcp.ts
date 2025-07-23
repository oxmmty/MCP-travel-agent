// OpenAI Integration with MCP
import OpenAI from "openai";
import type { Message } from "@shared/schema";
import { MCPClient } from './client';

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "your-openai-api-key"
});

let mcpClient: MCPClient | null = null;

async function getMCPClient(): Promise<MCPClient> {
  if (!mcpClient) {
    mcpClient = new MCPClient();
    // Ensure initialization is complete
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return mcpClient;
}

// Add language detection functions
function detectLanguage(message: string): string {
  const germanKeywords = ['ich', 'und', 'der', 'die', 'das', 'ist', 'bin', 'sind', 'haben', 'habe', 'nach', 'möchte', 'will', 'kann', 'reise', 'hotel', 'restaurant'];
  const spanishKeywords = ['yo', 'y', 'el', 'la', 'es', 'soy', 'son', 'tengo', 'tiene', 'a', 'quiero', 'puedo', 'viaje', 'hotel', 'restaurante'];
  const frenchKeywords = ['je', 'et', 'le', 'la', 'est', 'suis', 'sont', 'ai', 'avez', 'à', 'veux', 'peux', 'voyage', 'hôtel', 'restaurant'];
  
  const lowerMessage = message.toLowerCase();
  
  const germanCount = germanKeywords.filter(word => lowerMessage.includes(word)).length;
  const spanishCount = spanishKeywords.filter(word => lowerMessage.includes(word)).length;
  const frenchCount = frenchKeywords.filter(word => lowerMessage.includes(word)).length;
  
  if (germanCount >= 2) return 'de';
  if (spanishCount >= 2) return 'es';
  if (frenchCount >= 2) return 'fr';
  
  return 'en';
}

function hasStrongLanguageIndicators(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  
  // Strong German indicators
  const strongGerman = ['ich möchte', 'ich will', 'können sie', 'bitte', 'danke', 'wie komme ich', 'wo ist', 'was kostet'];
  
  // Strong Spanish indicators  
  const strongSpanish = ['quiero', 'necesito', 'por favor', 'gracias', 'cómo llego', 'dónde está', 'cuánto cuesta'];
  
  // Strong French indicators
  const strongFrench = ['je voudrais', 'je veux', 's\'il vous plaît', 'merci', 'comment aller', 'où est', 'combien coûte'];
  
  // Strong English indicators (common travel phrases)
  const strongEnglish = ['i want to', 'i would like', 'please', 'thank you', 'how do i get', 'where is', 'how much does'];
  
  return strongGerman.some(phrase => lowerMessage.includes(phrase)) ||
         strongSpanish.some(phrase => lowerMessage.includes(phrase)) ||
         strongFrench.some(phrase => lowerMessage.includes(phrase)) ||
         strongEnglish.some(phrase => lowerMessage.includes(phrase));
}

export async function getChatCompletionWithMCP(messages: Message[], language: string = "en"): Promise<string> {
  try {
    // Use system language as default, only override with strong language detection
    let detectedLanguage = language; // Always start with system/app language
    
    if (messages.length > 0) {
      const lastUserMessage = messages.filter(m => m.role === 'user').pop();
      if (lastUserMessage) {
        // Only change language if we have strong indicators in the current message
        if (hasStrongLanguageIndicators(lastUserMessage.content)) {
          detectedLanguage = detectLanguage(lastUserMessage.content);
        }
        // For place names or ambiguous input, stick with system language
      }
    }
    
    const systemPrompt = getSystemPrompt(detectedLanguage);
    
    // Get MCP client and available tools
    const client = await getMCPClient();
    const tools = await client.getOpenAIFunctions();
    
    // Convert messages to OpenAI format
    const openAIMessages: any[] = [
      { role: "system", content: systemPrompt }
    ];

    messages.forEach(msg => {
      openAIMessages.push({
        role: msg.role,
        content: msg.content
      });
    });

    // First call to get the AI response and potential tool calls
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: openAIMessages,
      tools: tools.length > 0 ? tools : undefined,
      tool_choice: tools.length > 0 ? "auto" : undefined,
      max_tokens: 1000,
      temperature: 0.7,
    });

    const choice = response.choices[0];
    const message = choice.message;

    // If AI wants to use tools, execute them
    if (message.tool_calls && message.tool_calls.length > 0) {
      // Add assistant message with tool calls
      openAIMessages.push(message);

      // Execute all tool calls
      for (const toolCall of message.tool_calls) {
        try {
          const mcpToolCall = client.convertOpenAICall(toolCall.function);
          const result = await client.executeTool(mcpToolCall);
          
          // Add tool result to conversation
          openAIMessages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: result.content.map(c => c.text || '').join('\n')
          });
        } catch (error) {
          // Add error result
          openAIMessages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        }
      }

      // Get final response after tool execution
      const finalResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: openAIMessages,
        max_tokens: 1000,
        temperature: 0.7,
      });

      return finalResponse.choices[0].message.content || "I apologize, but I couldn't process your request properly.";
    }

    return message.content || "I apologize, but I'm having trouble generating a response right now. Please try again.";
  } catch (error) {
    console.error("Error in getChatCompletionWithMCP:", error);
    
    const errorMessages = {
      en: "I'm sorry, but I'm having trouble connecting to my travel knowledge base right now. Please try again in a moment.",
      de: "Es tut mir leid, aber ich habe gerade Probleme beim Zugriff auf meine Reise-Wissensbasis. Bitte versuchen Sie es in einem Moment erneut.",
      es: "Lo siento, pero estoy teniendo problemas para conectarme a mi base de conocimientos de viajes en este momento. Por favor, inténtalo de nuevo en un momento.",
      fr: "Je suis désolé, mais j'ai des difficultés à me connecter à ma base de connaissances de voyage en ce moment. Veuillez réessayer dans un moment."
    };
    
    return errorMessages[language as keyof typeof errorMessages] || errorMessages.en;
  }
}

function getSystemPrompt(language: string): string {
  return `You are the world's most enthusiastic and knowledgeable travel assistant with access to real-time travel data through specialized tools! Your mission is to inspire wanderlust and help create unforgettable travel experiences.

LANGUAGE REQUIREMENTS:
- ALWAYS respond in ${language === 'de' ? 'German' : language === 'es' ? 'Spanish' : language === 'fr' ? 'French' : 'English'}
- When responding in German, always use the informal "du" form (not "Sie")
- Be friendly and personal in all languages
- Match the user's conversational tone
- For ambiguous inputs (like just place names), use the app's system language (${language}) to respond

FORMATTING REQUIREMENTS - Always structure your responses with:
- Clear paragraphs separated by line breaks
- Bullet points for lists (use - or *)
- **Bold text** for important highlights like attraction names
- Proper spacing between sections
- Well-organized, scannable content

Available tools:
- Search for destinations and get location data
- Find nearby hotels with prices and ratings
- Discover local attractions and activities
- Locate restaurants and dining options
- Get detailed reviews and ratings from TripAdvisor
- Access professional travel photos and user experiences
- Search for highly-rated nearby places
- Save destinations and items to user favorites
- Add items to travel itineraries

IMPORTANT RULES for first responses about destinations:
- NEVER mention geographical coordinates or technical data
- Focus on 2-3 specific attractions and what makes the destination special
- Create an inspiring picture without redundant information
- End with questions asking what they'd like to learn more about (hotels, attractions, restaurants, activities)
- Ask if they want you to create a detailed itinerary/travel plan
- Maximum 3-4 sentences, engaging and motivating
- DO NOT create an itinerary unless explicitly asked

When users ask about travel destinations:
1. ALWAYS use Google Maps tools first to find locations and basic information
2. ALWAYS use TripAdvisor tools to get detailed reviews, ratings, and photos for specific places
3. Use storage tools to save destinations and manage user data
4. Provide comprehensive information combining both Google Maps and TripAdvisor data
5. Include real user reviews and professional photos when available
6. Help users save interesting places to their favorites or itinerary

For follow-up responses:
- Provide detailed, practical information with prices and timing
- Include insider tips and local secrets
- Format attractions as links: [Attraction Name](attraction-link)
- Stay enthusiastic but professional
- No technical data or coordinates!
- Use bullet points for multiple items or recommendations
- Create clear sections with proper paragraph breaks

Respond as the most knowledgeable travel friend who knows the best local insider tips! Always match the user's language naturally and format responses clearly with proper markdown structure.`;
}