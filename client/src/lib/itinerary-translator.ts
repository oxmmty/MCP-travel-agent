import { useTranslation } from "react-i18next";
import type { ItineraryItem } from "@shared/schema";

export function useItineraryTranslation() {
  const { t } = useTranslation();

  const translateDuration = (duration: string): string => {
    if (!duration) return duration;
    
    const lowerDuration = duration.toLowerCase();
    
    // Handle German translations
    if (lowerDuration.includes('stunde')) {
      const match = duration.match(/(\d+(?:\.\d+)?)\s*stunden?/i);
      if (match) {
        const number = parseFloat(match[1]);
        const unit = number === 1 ? t('itinerary.hour') : t('itinerary.hours');
        return `${number} ${unit}`;
      }
    }
    
    if (lowerDuration.includes('minute')) {
      const match = duration.match(/(\d+)\s*minuten?/i);
      if (match) {
        const number = parseInt(match[1]);
        const unit = number === 1 ? t('itinerary.minute') : t('itinerary.minutes');
        return `${number} ${unit}`;
      }
    }
    
    // Handle English translations
    if (lowerDuration.includes('hour')) {
      const match = duration.match(/(\d+(?:\.\d+)?)\s*hours?/i);
      if (match) {
        const number = parseFloat(match[1]);
        const unit = number === 1 ? t('itinerary.hour') : t('itinerary.hours');
        return `${number} ${unit}`;
      }
    }
    
    if (lowerDuration.includes('minute')) {
      const match = duration.match(/(\d+)\s*minutes?/i);
      if (match) {
        const number = parseInt(match[1]);
        const unit = number === 1 ? t('itinerary.minute') : t('itinerary.minutes');
        return `${number} ${unit}`;
      }
    }
    
    return duration;
  };

  const translateCost = (cost: string): string => {
    if (!cost) return cost;
    
    const lowerCost = cost.toLowerCase();
    
    // Handle German translations
    if (lowerCost.includes('kostenlos')) {
      return t('itinerary.free');
    }
    
    // Handle English translations
    if (lowerCost.includes('free')) {
      return t('itinerary.free');
    }
    
    // Handle Spanish translations
    if (lowerCost.includes('gratis')) {
      return t('itinerary.free');
    }
    
    // Handle French translations
    if (lowerCost.includes('gratuit')) {
      return t('itinerary.free');
    }
    
    return cost;
  };

  const translateTitle = (title: string): string => {
    if (!title) return title;
    
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('cultural discovery') || 
        lowerTitle.includes('kulturelle entdeckung') ||
        lowerTitle.includes('descubrimiento cultural') ||
        lowerTitle.includes('découverte culturelle')) {
      return t('itinerary.culturalDiscovery');
    }
    
    return title;
  };

  const translateContent = (text: string, currentLang: string): string => {
    if (!text) return text;
    
    // Comprehensive travel terms dictionary
    const translations: Record<string, Record<string, string>> = {
      // Common verbs and phrases
      'Besuchen Sie': { en: 'Visit', es: 'Visite', fr: 'Visitez' },
      'Genießen Sie': { en: 'Enjoy', es: 'Disfrute', fr: 'Profitez' },
      'Entdecken Sie': { en: 'Discover', es: 'Descubra', fr: 'Découvrez' },
      'Machen Sie': { en: 'Take', es: 'Haga', fr: 'Faites' },
      'Beginnen Sie': { en: 'Start', es: 'Comience', fr: 'Commencez' },
      'Beenden Sie': { en: 'End', es: 'Termine', fr: 'Terminez' },
      
      // Activities and locations
      'Spaziergang': { en: 'walk', es: 'paseo', fr: 'promenade' },
      'Mittagessen': { en: 'lunch', es: 'almuerzo', fr: 'déjeuner' },
      'Biergarten': { en: 'beer garden', es: 'jardín de cerveza', fr: 'jardin de bière' },
      'Museum': { en: 'museum', es: 'museo', fr: 'musée' },
      'Brunnen': { en: 'fountain', es: 'fuente', fr: 'fontaine' },
      'Garten': { en: 'garden', es: 'jardín', fr: 'jardin' },
      'Besuch': { en: 'visit', es: 'visita', fr: 'visite' },
      
      // Descriptions and adjectives
      'malerischen': { en: 'picturesque', es: 'pintoresco', fr: 'pittoresque' },
      'herrlichen': { en: 'magnificent', es: 'magnífico', fr: 'magnifique' },
      'gemütlichen': { en: 'cozy', es: 'acogedor', fr: 'confortable' },
      'typischen': { en: 'typical', es: 'típico', fr: 'typique' },
      'historisches': { en: 'historic', es: 'histórico', fr: 'historique' },
      'weitläufigen': { en: 'extensive', es: 'extenso', fr: 'étendu' },
      'friedliche': { en: 'peaceful', es: 'pacífica', fr: 'paisible' },
      
      // Common travel phrases
      'einen gemütlichen Spaziergang': { 
        en: 'a leisurely walk', 
        es: 'un paseo relajante', 
        fr: 'une promenade tranquille' 
      },
      'Ihren Tag': { en: 'your day', es: 'su día', fr: 'votre journée' },
      'den Tag': { en: 'the day', es: 'el día', fr: 'la journée' },
      'eine Auswahl': { en: 'a selection', es: 'una selección', fr: 'une sélection' },
      'bei herrlichem': { en: 'with magnificent', es: 'con magnífico', fr: 'avec magnifique' },
      
      // Time and duration
      'Minuten': { en: 'minutes', es: 'minutos', fr: 'minutes' },
      'Stunden': { en: 'hours', es: 'horas', fr: 'heures' },
      'Stunde': { en: 'hour', es: 'hora', fr: 'heure' },
      
      // Food and drinks
      'kühles Bier': { en: 'cold beer', es: 'cerveza fría', fr: 'bière fraîche' },
      'bayerische Spezialitäten': { 
        en: 'Bavarian specialties', 
        es: 'especialidades bávaras', 
        fr: 'spécialités bavaroises' 
      },
      'leichten Gerichten': { 
        en: 'light dishes', 
        es: 'platos ligeros', 
        fr: 'plats légers' 
      },
      'Getränken': { en: 'beverages', es: 'bebidas', fr: 'boissons' },
      
      // Geographic terms
      'München': { en: 'Munich', es: 'Múnich', fr: 'Munich' },
      'Grünflächen': { en: 'green spaces', es: 'espacios verdes', fr: 'espaces verts' },
      'Atmosphäre': { en: 'atmosphere', es: 'atmósfera', fr: 'atmosphère' },
      'Seeblick': { en: 'lake view', es: 'vista al lago', fr: 'vue sur le lac' }
    };

    let translatedText = text;
    
    // Apply translations from German to target language
    if (currentLang !== 'de') {
      Object.entries(translations).forEach(([german, langMap]) => {
        if (translatedText.includes(german) && langMap[currentLang]) {
          translatedText = translatedText.replace(new RegExp(german, 'gi'), langMap[currentLang]);
        }
      });
    }
    
    return translatedText;
  };

  const translateItinerary = (itinerary: {
    title: string;
    day: number;
    items: ItineraryItem[];
  }) => {
    const currentLang = t('itinerary.day') === 'Day' ? 'en' : 
                        t('itinerary.day') === 'Tag' ? 'de' :
                        t('itinerary.day') === 'Día' ? 'es' : 'fr';
    
    return {
      title: translateTitle(itinerary.title),
      day: itinerary.day,
      items: itinerary.items.map(item => ({
        ...item,
        title: translateContent(item.title, currentLang),
        description: translateContent(item.description, currentLang),
        duration: item.duration ? translateDuration(item.duration) : undefined,
        cost: item.cost ? translateCost(item.cost) : undefined
      }))
    };
  };

  return {
    translateDuration,
    translateCost,
    translateTitle,
    translateItinerary,
    t
  };
}