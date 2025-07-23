import OpenAI from "openai";
import type { Message } from "@shared/schema";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "your-openai-api-key"
});

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

function getSystemPrompt(language: string): string {
  return `You are the world's most enthusiastic and knowledgeable travel assistant! Your mission is to inspire wanderlust and help create unforgettable travel experiences.

LANGUAGE REQUIREMENTS:
- ALWAYS respond in ${language === 'de' ? 'German' : language === 'es' ? 'Spanish' : language === 'fr' ? 'French' : 'English'}
- When responding in German, always use the informal "du" form (not "Sie")
- Be friendly and personal in all languages
- Match the user's conversational tone
- For ambiguous inputs (like just place names), use the app's system language (${language}) to respond

FORMATTING REQUIREMENTS - Always structure your responses with:
- Clear paragraphs separated by line breaks
- Bullet points for lists (use - or *)
- **Bold text** for ALL major attractions, landmarks, hotels, and points of interest
- IMPORTANT: Always use **bold** for famous attractions like Elbphilharmonie, Miniatur Wunderland, St. Michael's Church, Reeperbahn, etc.
- Also bold hotel names, restaurant names, and any specific places visitors can visit
- Proper spacing between sections
- Well-organized, scannable content

IMPORTANT RULES for first responses about destinations:
- NEVER mention geographical coordinates or technical data
- Focus on 2-3 specific attractions and what makes the destination special
- Create an inspiring picture without redundant information
- End with questions asking what they'd like to learn more about (hotels, attractions, restaurants, activities)
- Ask if they want you to create a detailed itinerary/travel plan
- Maximum 3-4 sentences, engaging and motivating
- DO NOT create an itinerary unless explicitly asked

For follow-up responses:
- Provide detailed, practical information with prices and timing
- Include insider tips and local secrets
- Format ALL attractions, hotels, restaurants, and landmarks as **bold text** for interactive highlighting
- MANDATORY: Bold format for famous places like **Elbphilharmonie**, **Miniatur Wunderland**, **Reeperbahn**, **St. Michael's Church**, **HafenCity**, etc.
- Stay enthusiastic but professional
- No technical data or coordinates!
- Use bullet points for multiple items or recommendations
- Create clear sections with proper paragraph breaks
- If user asks for itinerary/travel plan, create a detailed day-by-day schedule
- Always ask engaging follow-up questions to keep the conversation flowing

Respond as the most knowledgeable travel friend who knows the best local insider tips! Always match the user's language naturally and format responses clearly with proper markdown structure.`;
}

export async function getChatCompletion(messages: Message[], language: string = "en"): Promise<string> {
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
    
    const openAIMessages: any[] = [
      { role: "system", content: systemPrompt }
    ];

    messages.forEach(msg => {
      openAIMessages.push({
        role: msg.role,
        content: msg.content
      });
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: openAIMessages,
      max_tokens: 1000,
      temperature: 0.7,
    });

    return response.choices[0].message.content || "I apologize, but I'm having trouble generating a response right now. Please try again.";
  } catch (error) {
    console.error("Error in getChatCompletion:", error);
    
    const errorMessages = {
      en: "I'm sorry, but I'm having trouble connecting to my travel knowledge base right now. Please try again in a moment.",
      de: "Es tut mir leid, aber ich habe gerade Probleme beim Zugriff auf meine Reise-Wissensbasis. Bitte versuchen Sie es in einem Moment erneut.",
      es: "Lo siento, pero estoy teniendo problemas para conectarme a mi base de conocimientos de viajes en este momento. Por favor, inténtalo de nuevo en un momento.",
      fr: "Je suis désolé, mais j'ai des difficultés à me connecter à ma base de connaissances de voyage en ce moment. Veuillez réessayer dans un moment."
    };
    
    return errorMessages[language as keyof typeof errorMessages] || errorMessages.en;
  }
}

// New streaming function for real-time AI responses
export async function getChatCompletionStream(messages: Message[], language: string = "en", onChunk: (chunk: string) => void): Promise<string> {
  try {
    // Use system language as default, only override with strong language detection
    let detectedLanguage = language;
    
    if (messages.length > 0) {
      const lastUserMessage = messages.filter(m => m.role === 'user').pop();
      if (lastUserMessage) {
        if (hasStrongLanguageIndicators(lastUserMessage.content)) {
          detectedLanguage = detectLanguage(lastUserMessage.content);
        }
      }
    }
    
    const systemPrompt = getSystemPrompt(detectedLanguage);
    
    const openAIMessages: any[] = [
      { role: "system", content: systemPrompt }
    ];

    messages.forEach(msg => {
      openAIMessages.push({
        role: msg.role,
        content: msg.content
      });
    });

    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: openAIMessages,
      max_tokens: 1000,
      temperature: 0.7,
      stream: true,
    });

    let fullResponse = "";
    
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        fullResponse += content;
        onChunk(content);
      }
    }

    return fullResponse || "I apologize, but I'm having trouble generating a response right now. Please try again.";
  } catch (error) {
    console.error("Error in getChatCompletionStream:", error);
    
    const errorMessages = {
      en: "I'm sorry, but I'm having trouble connecting to my travel knowledge base right now. Please try again in a moment.",
      de: "Es tut mir leid, aber ich habe gerade Probleme beim Zugriff auf meine Reise-Wissensbasis. Bitte versuchen Sie es in einem Moment erneut.",
      es: "Lo siento, pero estoy teniendo problemas para conectarme a mi base de conocimientos de viajes en este momento. Por favor, inténtalo de nuevo en un momento.",
      fr: "Je suis désolé, mais j'ai des difficultés à me connecter à ma base de connaissances de voyage en ce moment. Veuillez réessayer dans un moment."
    };
    
    const errorMessage = errorMessages[language as keyof typeof errorMessages] || errorMessages.en;
    onChunk(errorMessage);
    return errorMessage;
  }
}

export async function analyzeDestinationContext(message: string, language: string = "en"): Promise<any> {
  try {
    const prompt = `Analyze this travel message and determine if it mentions a specific destination. Respond with JSON only:

"${message}"

If a destination is mentioned, respond with:
{
  "hasDestination": true,
  "destination": "City Name",
  "country": "Country Name",
  "confidence": 0.9
}

If no clear destination is mentioned, respond with:
{
  "hasDestination": false
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a travel destination analyzer. Always respond with valid JSON only." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      max_tokens: 200,
      temperature: 0.1,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      return { hasDestination: false };
    }

    return JSON.parse(content);
  } catch (error) {
    console.error("Error analyzing destination context:", error);
    return { hasDestination: false };
  }
}

export async function extractTravelRecommendations(message: string, destination: string, language: string = 'en') {
  if (!openai) {
    console.error("OpenAI client not initialized");
    return { hasRecommendations: false };
  }

  try {
    const prompt = `Analyze this AI travel response and extract specific place recommendations that could be shown on a map:

Destination Context: ${destination}
AI Response: "${message}"

Extract any mentioned hotels, restaurants, attractions, activities, or places. Respond with JSON only:

If recommendations are found:
{
  "hasRecommendations": true,
  "destination": "${destination}",
  "recommendations": [
    {
      "name": "Exact Place Name",
      "type": "hotel|restaurant|attraction|activity|place",
      "description": "Brief description from the message",
      "mentioned_in_context": "The exact phrase from the message"
    }
  ]
}

If no specific places are mentioned:
{
  "hasRecommendations": false
}

Focus on concrete, mappable locations. Ignore generic advice.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", 
      messages: [
        { role: "system", content: "You are a travel recommendation extractor. Always respond with valid JSON only. Focus on specific, mappable places." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      max_tokens: 800,
      temperature: 0.1,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      return { hasRecommendations: false };
    }

    return JSON.parse(content);
  } catch (error) {
    console.error("Error extracting travel recommendations:", error);
    return { hasRecommendations: false };
  }
}

export async function generateItinerary(destination: string, attractions: any[], language: string = "en"): Promise<any> {
  try {
    const attractionNames = attractions.map(a => a.name).join(", ");
    
    const prompts = {
      en: `Create a detailed one-day itinerary for ${destination} including the mentioned attractions and additional activities. You must respond with JSON format using this structure:

{
  "title": "Cultural Discovery",
  "day": 1,
  "items": [
    {
      "time": "09:00",
      "title": "Activity Name",
      "description": "Detailed description of the activity or visit",
      "location": "Specific address or location",
      "duration": "1 hour",
      "cost": "Free"
    }
  ]
}

Include ${attractionNames} and suggest additional cultural activities. Use real locations and practical details in English. Respond only with valid JSON.`,
      
      de: `Erstelle einen detaillierten Tagesplan für ${destination} einschließlich der genannten Attraktionen und zusätzlichen Aktivitäten. Du musst mit JSON-Format antworten und diese Struktur verwenden:

{
  "title": "Kulturelle Entdeckung", 
  "day": 1,
  "items": [
    {
      "time": "09:00",
      "title": "Aktivitätsname",
      "description": "Detaillierte Beschreibung der Aktivität oder des Besuchs",
      "location": "Spezifische Adresse oder Standort",
      "duration": "1 Stunde", 
      "cost": "Kostenlos"
    }
  ]
}

Schließe ${attractionNames} ein und schlage zusätzliche kulturelle Aktivitäten vor. Verwende echte Standorte und praktische Details auf Deutsch. Antworte nur mit gültigem JSON.`,

      es: `Crea un itinerario detallado de un día para ${destination} incluyendo las atracciones mencionadas y actividades adicionales. Debes responder con formato JSON usando esta estructura:

{
  "title": "Descubrimiento Cultural",
  "day": 1, 
  "items": [
    {
      "time": "09:00",
      "title": "Nombre de Actividad",
      "description": "Descripción detallada de la actividad o visita",
      "location": "Dirección específica o ubicación",
      "duration": "1 hora",
      "cost": "Gratis"
    }
  ]
}

Incluye ${attractionNames} y sugiere actividades culturales adicionales. Usa ubicaciones reales y detalles prácticos en español. Responde solo con JSON válido.`,

      fr: `Créez un itinéraire détaillé d'une journée pour ${destination} incluant les attractions mentionnées et des activités supplémentaires. Vous devez répondre avec le format JSON en utilisant cette structure:

{
  "title": "Découverte Culturelle",
  "day": 1,
  "items": [
    {
      "time": "09:00", 
      "title": "Nom de l'Activité",
      "description": "Description détaillée de l'activité ou visite",
      "location": "Adresse spécifique ou emplacement",
      "duration": "1 heure",
      "cost": "Gratuit"
    }
  ]
}

Incluez ${attractionNames} et suggérez des activités culturelles supplémentaires. Utilisez des emplacements réels et des détails pratiques en français. Répondez uniquement avec du JSON valide.`
    };

    const prompt = prompts[language as keyof typeof prompts] || prompts.en;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a travel itinerary planner. Always respond with valid JSON only." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      return null;
    }

    return JSON.parse(content);
  } catch (error) {
    console.error("Error generating itinerary:", error);
    return null;
  }
}

export async function generateTravelRecommendations(destination: string, preferences: string[], language: string = "en"): Promise<string> {
  try {
    const prompt = `Generate travel recommendations for ${destination} based on these preferences: ${preferences.join(", ")}. 
    
    Include specific hotels, restaurants, and activities with practical details like pricing and locations. Respond in ${language === 'de' ? 'German' : language === 'es' ? 'Spanish' : language === 'fr' ? 'French' : 'English'}.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a knowledgeable travel advisor providing specific, actionable recommendations." },
        { role: "user", content: prompt }
      ],
      max_tokens: 800,
      temperature: 0.7,
    });

    return response.choices[0].message.content || "I'm unable to generate recommendations at the moment.";
  } catch (error) {
    console.error("Error generating travel recommendations:", error);
    return "I'm sorry, I'm having trouble generating recommendations right now.";
  }
}

export async function translateTravelContent(content: string, targetLanguage: string): Promise<string> {
  try {
    const languageNames = {
      en: "English",
      de: "German",
      es: "Spanish", 
      fr: "French"
    };

    const targetLangName = languageNames[targetLanguage as keyof typeof languageNames] || "English";
    
    const prompt = `Translate the following travel-related content to ${targetLangName}. Maintain the tone and context appropriate for travel planning:

${content}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a professional travel content translator. Translate accurately while preserving travel-specific terminology and context." },
        { role: "user", content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0.3,
    });

    return response.choices[0].message.content || content;
  } catch (error) {
    console.error("Error translating travel content:", error);
    return content;
  }
}