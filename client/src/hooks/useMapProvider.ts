import { useState, useCallback } from 'react';

export type MapProvider = 'google' | 'mapbox';

export interface MapProviderConfig {
  provider: MapProvider;
  googleMapsApiKey?: string;
  mapboxAccessToken?: string;
}

export const useMapProvider = (defaultProvider: MapProvider = 'google') => {
  const [provider, setProvider] = useState<MapProvider>(defaultProvider);

  const switchProvider = useCallback((newProvider: MapProvider) => {
    setProvider(newProvider);
    
    // Store preference in localStorage
    localStorage.setItem('preferred-map-provider', newProvider);
  }, []);

  const getProvider = useCallback((): MapProvider => {
    // Check localStorage first
    const stored = localStorage.getItem('preferred-map-provider') as MapProvider;
    return stored || provider;
  }, [provider]);

  const isProviderAvailable = useCallback((providerType: MapProvider): boolean => {
    switch (providerType) {
      case 'google':
        return !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 
               typeof window !== 'undefined' && !!window.google;
      case 'mapbox':
        return !!import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
      default:
        return false;
    }
  }, []);

  const getAvailableProviders = useCallback((): MapProvider[] => {
    const providers: MapProvider[] = [];
    if (isProviderAvailable('google')) providers.push('google');
    if (isProviderAvailable('mapbox')) providers.push('mapbox');
    return providers;
  }, [isProviderAvailable]);

  const getCurrentProvider = useCallback((): MapProvider => {
    const current = getProvider();
    
    // Fallback logic if current provider is not available
    if (!isProviderAvailable(current)) {
      const available = getAvailableProviders();
      if (available.length > 0) {
        const fallback = available[0];
        switchProvider(fallback);
        return fallback;
      }
    }
    
    return current;
  }, [getProvider, isProviderAvailable, getAvailableProviders, switchProvider]);

  return {
    provider: getCurrentProvider(),
    switchProvider,
    isProviderAvailable,
    getAvailableProviders,
    availableProviders: getAvailableProviders()
  };
};