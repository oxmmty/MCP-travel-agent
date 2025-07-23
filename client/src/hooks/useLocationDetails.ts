import { useQuery } from "@tanstack/react-query";

interface LocationDetailsParams {
  locationName: string;
  lat?: number;
  lng?: number;
}

export function useLocationDetails({ locationName, lat, lng }: LocationDetailsParams) {
  return useQuery({
    queryKey: ['/api/locations', locationName, 'details'],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (lat) params.append('lat', lat.toString());
      if (lng) params.append('lng', lng.toString());
      
      const response = await fetch(`/api/locations/${encodeURIComponent(locationName)}/details?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch location details');
      }
      return response.json();
    },
    enabled: !!locationName,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });
}