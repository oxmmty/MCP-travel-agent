import React from 'react';
import InteractiveElement from '@/components/InteractiveElement';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageParserProps {
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

function findBestMatch(text: string, destinationData: any) {
  if (!destinationData) return null;
  
  const lowerText = text.toLowerCase().trim();
  
  // Check hotels first
  const matchedHotel = destinationData.hotels?.find((hotel: any) => {
    const hotelNameLower = hotel.name.toLowerCase();
    return hotelNameLower === lowerText || 
           hotelNameLower.includes(lowerText) || 
           lowerText.includes(hotelNameLower);
  });
  
  if (matchedHotel) {
    return { item: matchedHotel, type: 'hotel' as const };
  }
  
  // Check attractions
  const matchedAttraction = destinationData.attractions?.find((attraction: any) => {
    const attractionNameLower = attraction.name.toLowerCase();
    return attractionNameLower === lowerText ||
           attractionNameLower.includes(lowerText) || 
           lowerText.includes(attractionNameLower);
  });
  
  if (matchedAttraction) {
    return { item: matchedAttraction, type: 'attraction' as const };
  }
  
  // Check for common location patterns
  const locationKeywords = {
    'cochem castle': 'attraction',
    'reichsburg': 'attraction', 
    'bundesbank bunker': 'attraction',
    'eltz castle': 'attraction',
    'burg eltz': 'attraction',
    'maria laach': 'attraction',
    'hotel karl müller': 'hotel',
    'moselsternhotel': 'hotel',
    'hotel hegenbarth': 'hotel'
  };
  
  for (const [keyword, type] of Object.entries(locationKeywords)) {
    if (lowerText.includes(keyword)) {
      return {
        item: {
          name: text,
          description: `Learn more about ${text}`,
          category: type === 'hotel' ? 'Hotel' : 'Sehenswürdigkeit'
        },
        type: type as 'hotel' | 'attraction'
      };
    }
  }
  
  return null;
}

export function parseMessageContent({
  content,
  destinationData,
  onHighlight,
  onUnhighlight,
  onLocationClick
}: MessageParserProps): React.ReactNode {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({children}) => <p className="mb-3 leading-relaxed">{children}</p>,
        ul: ({children}) => <ul className="space-y-1 mb-3 pl-4 list-disc">{children}</ul>,
        ol: ({children}) => <ol className="space-y-1 mb-3 pl-4 list-decimal">{children}</ol>,
        li: ({children}) => <li className="text-slate-800">{children}</li>,
        h1: ({children}) => <h1 className="text-lg font-bold mb-3 text-slate-900">{children}</h1>,
        h2: ({children}) => <h2 className="text-base font-semibold mb-2 text-slate-900">{children}</h2>,
        h3: ({children}) => <h3 className="text-sm font-semibold mb-2 text-slate-800">{children}</h3>,
        strong: ({children}) => {
          const textContent = typeof children === 'string' ? children : 
            Array.isArray(children) ? children.join('') : String(children);
          
          // Einfache Keyword-Matching für bekannte Orte
          const keywords: Record<string, { name: string; type: 'hotel' | 'attraction'; description: string; pricePerNight?: number }> = {
            'cochem castle': { name: 'Cochem Castle', type: 'attraction', description: 'Historic castle with panoramic views' },
            'reichsburg cochem': { name: 'Reichsburg Cochem', type: 'attraction', description: 'Medieval castle overlooking the Moselle' },
            'bundesbank bunker': { name: 'Bundesbank Bunker', type: 'attraction', description: 'Cold War era secret bunker' },
            'eltz castle': { name: 'Eltz Castle', type: 'attraction', description: 'Fairy-tale medieval castle' },
            'burg eltz': { name: 'Burg Eltz', type: 'attraction', description: 'Iconic German castle' },
            'hotel karl müller': { name: 'Hotel Karl Müller', type: 'hotel', description: 'Traditional hotel at Moselpromenade', pricePerNight: 120 },
            'moselsternhotel': { name: 'MoselsternHotel "Brixiade & Triton"', type: 'hotel', description: 'Riverside hotel with modern amenities', pricePerNight: 150 },
            'hotel hegenbarth': { name: 'Hotel Hegenbarth', type: 'hotel', description: 'Cozy family-run hotel', pricePerNight: 90 },
            'weingut walter j. oster': { name: 'Weingut Walter J. Oster', type: 'attraction', description: 'Renowned winery with excellent Rieslings' }
          };
          
          const lowerText = textContent.toLowerCase();
          
          for (const [keyword, data] of Object.entries(keywords)) {
            if (lowerText.includes(keyword)) {
              return (
                <InteractiveElement
                  name={data.name}
                  type={data.type}
                  onHighlight={onHighlight}
                  onUnhighlight={onUnhighlight}
                  onLocationClick={onLocationClick}
                  data={{
                    description: data.description,
                    pricePerNight: data.pricePerNight,
                    category: data.type === 'hotel' ? 'Hotel' : 'Sehenswürdigkeit',
                    location: 'Cochem, Germany',
                    rating: 4.2
                  }}
                >
                  {textContent}
                </InteractiveElement>
              );
            }
          }
          
          return <strong className="font-semibold text-slate-900">{children}</strong>;
        },
        em: ({children}) => <em className="italic text-slate-700">{children}</em>,
        a: ({href, children}) => (
          <a href={href} className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        ),
        blockquote: ({children}) => (
          <blockquote className="border-l-4 border-blue-200 pl-4 my-3 text-slate-700 italic bg-blue-50 py-2 rounded-r">
            {children}
          </blockquote>
        ),
        code: ({children}) => (
          <code className="bg-slate-100 px-1 py-0.5 rounded text-sm font-mono">
            {children}
          </code>
        ),
        pre: ({children}) => (
          <pre className="bg-slate-100 p-3 rounded-lg overflow-x-auto text-sm font-mono mb-3">
            {children}
          </pre>
        )
      }}
    >
      {content}
    </ReactMarkdown>
  );
}