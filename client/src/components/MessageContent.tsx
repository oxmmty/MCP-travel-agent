import React from 'react';
import { MapPin, Building2, Camera, Globe } from 'lucide-react';
import InteractiveElement from './InteractiveElement';

interface MessageContentProps {
  content: string;
  destinationData?: {
    destination: any;
    hotels: any[];
    attractions: any[];
  };
  onHighlight?: (name: string, type: 'hotel' | 'attraction') => void;
  onUnhighlight?: () => void;
  onLocationClick?: (locationName: string, locationType: 'hotel' | 'attraction') => void;
}

// Cache for famous attractions to avoid repeated API calls
const famousAttractionsCache = new Map<string, any>();

// Famous landmarks that should always be recognized
const FAMOUS_ATTRACTIONS: Record<string, { name: string; description: string; category: string; rating: number }> = {
  // Hamburg attractions
  'elbphilharmonie': {
    name: 'Elbphilharmonie',
    description: 'Hamburg\'s iconic concert hall with stunning architecture and panoramic views',
    category: 'Konzerthaus',
    rating: 4.6
  },
  'miniatur wunderland': {
    name: 'Miniatur Wunderland',
    description: 'World\'s largest model railway exhibition with incredibly detailed miniature worlds',
    category: 'Museum',
    rating: 4.7
  },
  'reeperbahn': {
    name: 'Reeperbahn',
    description: 'Hamburg\'s famous entertainment district known for nightlife and music history',
    category: 'Unterhaltungsviertel',
    rating: 4.2
  },
  'st. michael\'s church': {
    name: 'St. Michael\'s Church',
    description: 'Hamburg\'s most famous church with stunning baroque architecture',
    category: 'Kirche',
    rating: 4.5
  },
  'speicherstadt': {
    name: 'Speicherstadt',
    description: 'Historic warehouse district and UNESCO World Heritage site',
    category: 'UNESCO-Welterbe',
    rating: 4.4
  },
  'hafencity': {
    name: 'HafenCity',
    description: 'Modern waterfront district with contemporary architecture',
    category: 'Stadtviertel',
    rating: 4.3
  },
  'hamburg kunsthalle': {
    name: 'Hamburg Kunsthalle',
    description: 'One of Germany\'s most important art museums',
    category: 'Kunstmuseum',
    rating: 4.4
  },
  'planten un blomen': {
    name: 'Planten un Blomen',
    description: 'Beautiful park in the heart of Hamburg with gardens and water features',
    category: 'Park',
    rating: 4.5
  },
  
  // Cochem attractions
  'reichsburg cochem': {
    name: 'Reichsburg Cochem',
    description: 'A magnificent castle perched on a hill offering breathtaking views of the town and river below',
    category: 'Burg',
    rating: 4.5
  },
  'reichsburg': {
    name: 'Reichsburg Cochem',
    description: 'A magnificent castle perched on a hill offering breathtaking views of the town and river below',
    category: 'Burg',
    rating: 4.5
  },
  'reichsburg castle': {
    name: 'Reichsburg Cochem',
    description: 'A magnificent castle perched on a hill offering breathtaking views of the town and river below',
    category: 'Burg',
    rating: 4.5
  },
  'mosel promenade': {
    name: 'Mosel-Promenade',
    description: 'A peaceful walk along the river, perhaps stopping to taste some of the region\'s famous wines',
    category: 'Promenade',
    rating: 4.3
  },
  'mosel-promenade': {
    name: 'Mosel-Promenade',
    description: 'A peaceful walk along the river, perhaps stopping to taste some of the region\'s famous wines',
    category: 'Promenade',
    rating: 4.3
  },
  'moselle promenade': {
    name: 'Mosel-Promenade',
    description: 'A peaceful walk along the river, perhaps stopping to taste some of the region\'s famous wines',
    category: 'Promenade',
    rating: 4.3
  }
};

function findMatchingLocation(text: string, destinationData?: any) {
  if (!destinationData || !text) return null;
  
  const lowerText = text.toLowerCase().trim();
  
  // First check for famous attractions
  for (const [key, attraction] of Object.entries(FAMOUS_ATTRACTIONS)) {
    if (lowerText.includes(key) || key.includes(lowerText)) {
      // Determine location based on attraction
      let location = `${attraction.name}`;
      if (key.includes('hamburg') || attraction.name.includes('Hamburg')) {
        location += ', Hamburg, Germany';
      } else if (key.includes('cochem') || key.includes('reichsburg') || key.includes('mosel')) {
        location += ', Cochem, Germany';
      } else {
        location += ', Germany';
      }
      
      return {
        item: {
          ...attraction,
          id: `famous-${key}`, // Add ID for favorites
          placeId: `famous-${key}`
        },
        type: 'attraction' as const,
        data: {
          id: `famous-${key}`,
          description: attraction.description,
          rating: attraction.rating,
          category: attraction.category,
          location: location,
          imageUrl: undefined // Will be loaded dynamically if needed
        }
      };
    }
  }
  
  // Exact matching for hotels
  const exactHotelMatch = destinationData.hotels?.find((hotel: any) => {
    const hotelNameLower = (hotel.name || '').toLowerCase();
    return hotelNameLower === lowerText || 
           (hotelNameLower.includes(lowerText) && lowerText.length > 5) ||
           (lowerText.includes(hotelNameLower) && hotelNameLower.length > 5);
  });
  
  if (exactHotelMatch) {
    return {
      item: exactHotelMatch,
      type: 'hotel' as const,
      data: {
        description: exactHotelMatch.description,
        rating: exactHotelMatch.rating,
        pricePerNight: exactHotelMatch.pricePerNight,
        category: 'Hotel',
        location: exactHotelMatch.description || exactHotelMatch.address,
        imageUrl: exactHotelMatch.imageUrl
      }
    };
  }
  
  // Exact matching for attractions from database
  const exactAttractionMatch = destinationData.attractions?.find((attraction: any) => {
    const attractionNameLower = (attraction.name || '').toLowerCase();
    return attractionNameLower === lowerText || 
           (attractionNameLower.includes(lowerText) && lowerText.length > 5) ||
           (lowerText.includes(attractionNameLower) && attractionNameLower.length > 5);
  });
  
  if (exactAttractionMatch) {
    return {
      item: exactAttractionMatch,
      type: 'attraction' as const,
      data: {
        description: exactAttractionMatch.description,
        rating: exactAttractionMatch.rating,
        category: exactAttractionMatch.category || 'Sehenswürdigkeit',
        location: exactAttractionMatch.description || exactAttractionMatch.address,
        imageUrl: exactAttractionMatch.imageUrl
      }
    };
  }
  
  // Only do fuzzy matching if no exact matches and text is long enough
  if (lowerText.length > 6) {
    // Fuzzy matching for hotels (only significant words)
    const fuzzyHotelMatch = destinationData.hotels?.find((hotel: any) => {
      const hotelNameLower = (hotel.name || '').toLowerCase();
      const hotelWords = hotelNameLower.split(' ').filter((word: string) => word.length > 4);
      const textWords = lowerText.split(' ').filter((word: string) => word.length > 4);
      
      return hotelWords.some((hotelWord: string) => textWords.some((textWord: string) => 
        hotelWord.includes(textWord) || textWord.includes(hotelWord)
      ));
    });
    
    if (fuzzyHotelMatch) {
      return {
        item: fuzzyHotelMatch,
        type: 'hotel' as const,
        data: {
          description: fuzzyHotelMatch.description,
          rating: fuzzyHotelMatch.rating,
          pricePerNight: fuzzyHotelMatch.pricePerNight,
          category: 'Hotel',
          location: fuzzyHotelMatch.description || fuzzyHotelMatch.address,
          imageUrl: fuzzyHotelMatch.imageUrl
        }
      };
    }
    
    // Fuzzy matching for attractions (only significant words)
    const fuzzyAttractionMatch = destinationData.attractions?.find((attraction: any) => {
      const attractionNameLower = (attraction.name || '').toLowerCase();
      const attractionWords = attractionNameLower.split(' ').filter((word: string) => word.length > 4);
      const textWords = lowerText.split(' ').filter((word: string) => word.length > 4);
      
      return attractionWords.some((attractionWord: string) => textWords.some((textWord: string) => 
        attractionWord.includes(textWord) || textWord.includes(attractionWord)
      ));
    });
    
    if (fuzzyAttractionMatch) {
      return {
        item: fuzzyAttractionMatch,
        type: 'attraction' as const,
        data: {
          description: fuzzyAttractionMatch.description,
          rating: fuzzyAttractionMatch.rating,
          category: fuzzyAttractionMatch.category || 'Sehenswürdigkeit',
          location: fuzzyAttractionMatch.description || fuzzyAttractionMatch.address,
          imageUrl: fuzzyAttractionMatch.imageUrl
        }
      };
    }
  }
  
  return null;
}

interface MessageContentProps {
  content: string;
  destinationData?: any;
  chatId?: number;
  onHighlight?: (name: string, type: 'hotel' | 'attraction' | 'restaurant') => void;
  onUnhighlight?: () => void;
  onLocationClick?: (placeId: string, locationType: 'hotel' | 'attraction' | 'restaurant') => void;
  onChatItemsExtracted?: (items: Array<{placeId: string, name: string, type: string, coordinates?: any}>) => void;
}

export default function MessageContent({ content, destinationData, chatId, onHighlight, onUnhighlight, onLocationClick, onChatItemsExtracted }: MessageContentProps) {
  
  // Extract chat items using unified resolution system (cache first, then Google Places)
  const extractAndNotifyChatItems = async (text: string) => {
    console.log('🔍 [MessageContent] Extracting chat items from text:', text.substring(0, 100) + '...');
    
    // Find all **bold** text segments (potential locations)
    const boldMatches = text.match(/\*\*(.*?)\*\*/g);
    if (!boldMatches) return;
    
    const extractedNames = boldMatches.map(match => match.slice(2, -2));
    console.log('🔍 [MessageContent] Found potential locations:', extractedNames);
    
    try {
      // Use unified location resolution (cache first, then Google Places)
      const destinationContext = destinationData?.destination?.name || '';
      const response = await fetch('/api/chat/resolve-locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extractedNames,
          destinationContext
        })
      });
      
      if (response.ok) {
        const { resolved } = await response.json();
        console.log('🔍 [MessageContent] Resolved locations:', resolved);
        
        // Convert to expected format
        const extractedItems = resolved.map((location: any) => ({
          placeId: location.placeId,
          name: location.name,
          type: location.type,
          coordinates: location.coordinates,
          cached: location.cached
        }));
        
        // Notify parent component about extracted items
        if (extractedItems.length > 0 && onChatItemsExtracted) {
          console.log('🔍 [MessageContent] Notifying parent about', extractedItems.length, 'resolved items');
          onChatItemsExtracted(extractedItems);
        }
      }
    } catch (error) {
      console.error('🔍 [MessageContent] Failed to resolve locations:', error);
      
      // Fallback to existing static matching
      const fallbackItems: Array<{placeId: string, name: string, type: string, coordinates?: any}> = [];
      
      extractedNames.forEach(name => {
        const match = findMatchingLocation(name, destinationData);
        if (match) {
          fallbackItems.push({
            placeId: match.item.placeId || match.item.id || `generated-${match.item.name.toLowerCase().replace(/\s+/g, '-')}`,
            name: match.item.name,
            type: match.type,
            coordinates: match.item.coordinates || match.item.location
          });
        } else {
          // Check famous attractions fallback
          const lowerName = (name || '').toLowerCase();
          const famousMatch = Object.entries(FAMOUS_ATTRACTIONS).find(([key, attraction]) => {
            if (!key || !attraction?.name) return false;
            return lowerName.includes(key) || key.includes(lowerName) ||
                   lowerName.includes(attraction.name.toLowerCase()) || 
                   attraction.name.toLowerCase().includes(lowerName);
          });
          
          if (famousMatch) {
            fallbackItems.push({
              placeId: `famous-${famousMatch[0]}`,
              name: famousMatch[1].name,
              type: 'attraction',
              coordinates: famousMatch[1].coordinates
            });
          }
        }
      });
      
      if (fallbackItems.length > 0 && onChatItemsExtracted) {
        console.log('🔍 [MessageContent] Using fallback items:', fallbackItems.length);
        onChatItemsExtracted(fallbackItems);
      }
    }
  };

  // Use useEffect to handle chat items extraction separately from rendering
  React.useEffect(() => {
    if (content) {
      extractAndNotifyChatItems(content);
    }
  }, [content, destinationData]);

  const processContent = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    
    // Split by **bold** markers
    const segments = text.split(/(\*\*.*?\*\*)/g);
    
    segments.forEach((segment, index) => {
      if (segment.startsWith('**') && segment.endsWith('**')) {
        const boldText = segment.slice(2, -2);
        
        // Try to find a match in the destination data
        const match = findMatchingLocation(boldText, destinationData);
        
        console.log('🔍 [MessageContent] Processing bold text:', boldText, 'Match found:', !!match);
        
        if (match) {
          console.log('🔍 [MessageContent] Creating InteractiveElement for:', match.item.name, 'Type:', match.type);
          parts.push(
            <InteractiveElement
              key={index}
              name={match.item.name}
              type={match.type}
              chatId={chatId}
              onHighlight={onHighlight}
              onUnhighlight={onUnhighlight}
              onLocationClick={onLocationClick}
              data={{
                ...match.data,
                id: match.item.id || match.item.placeId, // Include ID for favorites
                address: match.item.address || match.item.vicinity,
                vicinity: match.item.vicinity
              }}
            >
              {boldText}
            </InteractiveElement>
          );
        } else {
          console.log('🔍 [MessageContent] No match found for:', boldText, '- using regular bold text');
          // Regular bold text - clean black styling
          parts.push(<strong key={index} className="font-bold text-black">{boldText}</strong>);
        }
      } else {
        // Regular text - split by newlines for proper formatting
        const lines = segment.split('\n');
        lines.forEach((line, lineIndex) => {
          parts.push(line);
          if (lineIndex < lines.length - 1) {
            parts.push(<br key={`br-${index}-${lineIndex}`} />);
          }
        });
      }
    });
    
    return parts;
  };

  const processedContent = processContent(content);
  
  return (
    <div className="leading-relaxed">
      {processedContent}
    </div>
  );
}