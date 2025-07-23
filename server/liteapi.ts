/**
 * LiteAPI Integration Service
 * Provides hotel booking and accommodation services with commission-based monetization
 */

interface LiteAPIConfig {
  publicKey: string;
  privateKey: string;
  baseUrl: string;
  version: string;
}

interface LiteAPIHotel {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  rating: number;
  description?: string;
  amenities: string[];
  images: string[];
  checkInTime: string;
  checkOutTime: string;
}

interface LiteAPIRate {
  roomTypeId: string;
  roomTypeName: string;
  boardType: string;
  boardName: string;
  pricePerNight: number;
  totalPrice: number;
  currency: string;
  cancellationPolicy: string;
  paymentPolicy: string;
  commission?: {
    amount: number;
    percentage: number;
    currency: string;
  };
}

interface LiteAPISearchRequest {
  cityId?: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  adults: number;
  children?: number;
  rooms?: number;
  currency?: string;
  language?: string;
}

interface LiteAPISearchResponse {
  hotels: LiteAPIHotel[];
  rates: Record<string, LiteAPIRate[]>; // hotelId -> rates
  searchId: string;
  totalResults: number;
}

interface LiteAPIBookingRequest {
  hotelId: string;
  rateId: string;
  checkIn: string;
  checkOut: string;
  guests: {
    adults: number;
    children?: number;
  };
  rooms: Array<{
    adults: number;
    children?: Array<{ age: number }>;
  }>;
  guestDetails: Array<{
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  }>;
  paymentMethod: 'credit_card' | 'pay_at_hotel' | 'bank_transfer';
  specialRequests?: string;
}

interface LiteAPIBookingResponse {
  bookingId: string;
  confirmationNumber: string;
  status: 'confirmed' | 'pending' | 'failed';
  hotel: LiteAPIHotel;
  rate: LiteAPIRate;
  totalPrice: number;
  currency: string;
  checkIn: string;
  checkOut: string;
  guests: any;
  commission?: {
    amount: number;
    percentage: number;
    currency: string;
  };
  cancellationPolicy: string;
  paymentInstructions?: string;
}

class LiteAPIService {
  private config: LiteAPIConfig;

  constructor() {
    // Detect sandbox environment from private key prefix
    const isSandbox = process.env.LITEAPI_PRIVATE_KEY?.startsWith('sand_') || 
                      process.env.LITEAPI_PUBLIC_KEY?.includes('sandbox');
    
    this.config = {
      publicKey: process.env.LITEAPI_PUBLIC_KEY || '',
      privateKey: process.env.LITEAPI_PRIVATE_KEY || '',
      baseUrl: 'https://api.liteapi.travel',
      version: 'v3.0'  // Official LiteAPI version from documentation
    };

    console.log(`LiteAPI: Using ${isSandbox ? 'sandbox' : 'production'} credentials with v3.0 API`);

    if (!this.config.publicKey || !this.config.privateKey) {
      console.warn('LiteAPI credentials not configured. Hotel booking features will be disabled.');
    }
  }

  private getHeaders(usePrivateKey: boolean = false): Record<string, string> {
    // For LiteAPI, always use private key for authentication
    const apiKey = this.config.privateKey;
    
    return {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  private async makeRequest<T>(
    endpoint: string, 
    method: 'GET' | 'POST' = 'GET', 
    data?: any,
    usePrivateKey: boolean = false
  ): Promise<T> {
    const url = `${this.config.baseUrl}/${this.config.version}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        method,
        headers: this.getHeaders(usePrivateKey),
        body: data ? JSON.stringify(data) : undefined
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`LiteAPI Error (${response.status}): ${errorData}`);
      }

      return await response.json();
    } catch (error) {
      console.error('LiteAPI request failed:', error);
      throw error;
    }
  }

  /**
   * Search for hotels based on location and dates
   */
  async searchHotels(request: LiteAPISearchRequest): Promise<LiteAPISearchResponse> {
    const params = new URLSearchParams();
    
    if (request.cityId) params.append('cityId', request.cityId);
    if (request.countryCode) params.append('countryCode', request.countryCode);
    if (request.latitude) params.append('latitude', request.latitude.toString());
    if (request.longitude) params.append('longitude', request.longitude.toString());
    
    params.append('checkin', request.checkIn);
    params.append('checkout', request.checkOut);
    params.append('adults', request.adults.toString());
    
    if (request.children) params.append('children', request.children.toString());
    if (request.rooms) params.append('rooms', request.rooms.toString());
    if (request.currency) params.append('currency', request.currency);
    if (request.language) params.append('language', request.language);

    return this.makeRequest<LiteAPISearchResponse>(`/hotels/search?${params.toString()}`);
  }

  /**
   * Get detailed hotel information
   */
  async getHotelDetails(hotelId: string, language?: string): Promise<LiteAPIHotel> {
    const params = new URLSearchParams();
    if (language) params.append('language', language);
    
    return this.makeRequest<LiteAPIHotel>(`/hotels/${hotelId}?${params.toString()}`);
  }

  /**
   * Get available rates for specific hotels (POST request as per LiteAPI spec)
   */
  async getHotelRates(
    hotelIds: string[], 
    checkIn: string, 
    checkOut: string, 
    adults: number,
    children?: number,
    currency?: string,
    guestNationality?: string
  ): Promise<{ data: LiteAPIRate[]; hotelId: string }[]> {
    const requestBody = {
      hotelIds,
      checkin: checkIn,
      checkout: checkOut,
      occupancies: [
        {
          adults,
          children: children || 0
        }
      ],
      currency: currency || 'EUR',
      guestNationality: guestNationality || 'DE'
    };

    const response = await this.makeRequest<{ data: { data: LiteAPIRate[]; hotelId: string }[] }>(
      '/hotels/rates',
      'POST',
      requestBody,
      true // Use private key for rates
    );
    
    return response.data;
  }

  /**
   * Get available rates for a single hotel (convenience method)
   */
  async getSingleHotelRates(
    hotelId: string, 
    checkIn: string, 
    checkOut: string, 
    adults: number,
    children?: number,
    currency?: string,
    guestNationality?: string
  ): Promise<LiteAPIRate[]> {
    const results = await this.getHotelRates(
      [hotelId], 
      checkIn, 
      checkOut, 
      adults, 
      children, 
      currency, 
      guestNationality
    );
    
    return results.find(r => r.hotelId === hotelId)?.data || [];
  }

  /**
   * Pre-book a rate (step 1 of booking process)
   */
  async prebookRate(request: {
    hotelId: string;
    rateId: string;
    checkIn: string;
    checkOut: string;
    guests: { adults: number; children?: number };
    rooms: Array<{ adults: number; children?: Array<{ age: number }> }>;
  }): Promise<{ prebookId: string; expiresAt: string; totalPrice: number; currency: string }> {
    return this.makeRequest<any>(
      '/rates/prebook',
      'POST',
      request,
      true
    );
  }

  /**
   * Complete booking using prebookId (step 2 of booking process)
   */
  async completeBooking(request: {
    prebookId: string;
    guestDetails: Array<{
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
    }>;
    paymentMethod: 'credit_card' | 'pay_at_hotel' | 'bank_transfer';
    specialRequests?: string;
  }): Promise<LiteAPIBookingResponse> {
    return this.makeRequest<LiteAPIBookingResponse>(
      '/rates/book',
      'POST',
      request,
      true
    );
  }

  /**
   * Create a hotel booking (legacy method - replaced by prebook + book workflow)
   */
  async createBooking(request: LiteAPIBookingRequest): Promise<LiteAPIBookingResponse> {
    return this.makeRequest<LiteAPIBookingResponse>(
      '/bookings',
      'POST',
      request,
      true // Use private key for booking operations
    );
  }

  /**
   * Get booking details
   */
  async getBooking(bookingId: string): Promise<LiteAPIBookingResponse> {
    return this.makeRequest<LiteAPIBookingResponse>(`/bookings/${bookingId}`, 'GET', undefined, true);
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(bookingId: string, reason?: string): Promise<{ success: boolean; cancellationId?: string }> {
    const data = reason ? { reason } : undefined;
    return this.makeRequest<{ success: boolean; cancellationId?: string }>(
      `/bookings/${bookingId}/cancel`,
      'POST',
      data,
      true
    );
  }

  /**
   * Search for cities/destinations
   */
  async searchDestinations(query: string, language?: string): Promise<Array<{
    id: string;
    name: string;
    country: string;
    countryCode: string;
    type: 'city' | 'region' | 'country';
  }>> {
    // Use cities endpoint instead of destinations for working search
    const params = new URLSearchParams({ limit: '10' });
    if (query) params.append('cityName', query);
    
    const response = await this.makeRequest<{ data: any[] }>(`/data/cities?${params.toString()}`);
    
    // Convert cities response to expected format
    return (response.data || []).map(city => ({
      id: city.id || city.code,
      name: city.name,
      country: city.country || 'Unknown',
      countryCode: city.countryCode || 'XX',
      type: 'city' as const
    }));
  }

  /**
   * Get commission information for partner revenue
   */
  async getCommissionInfo(hotelId: string, rateId: string): Promise<{
    commission: number;
    percentage: number;
    currency: string;
  }> {
    return this.makeRequest<{
      commission: number;
      percentage: number;
      currency: string;
    }>(`/partners/commission?hotelId=${hotelId}&rateId=${rateId}`, 'GET', undefined, true);
  }

  /**
   * Helper method to convert Google Maps location to LiteAPI search
   */
  async searchHotelsByLocation(
    location: { lat: number; lng: number },
    checkIn: string,
    checkOut: string,
    guests: { adults: number; children?: number } = { adults: 2 },
    radius: number = 10 // km
  ): Promise<LiteAPISearchResponse> {
    return this.searchHotels({
      latitude: location.lat,
      longitude: location.lng,
      checkIn,
      checkOut,
      adults: guests.adults,
      children: guests.children,
      currency: 'EUR'
    });
  }

  /**
   * Integration helper: Convert LiteAPI hotel to our internal format
   * Preispolitik: Zeige LiteAPI-Originalpreise ohne Markup
   * Monetarisierung erfolgt über separate Provision (8-15%)
   */
  convertToInternalHotel(liteHotel: LiteAPIHotel, rates?: LiteAPIRate[]): {
    name: string;
    description: string;
    pricePerNight: number;
    rating: number;
    imageUrl: string | null;
    coordinates: { lat: number; lng: number };
    amenities: string[];
    liteApiId: string;
    bookable: boolean;
    commission?: number;
  } {
    const lowestRate = rates?.length ? Math.min(...rates.map(r => r.pricePerNight)) : 0;
    const avgCommission = rates?.length 
      ? rates.reduce((sum, r) => sum + (r.commission?.amount || 0), 0) / rates.length 
      : 0;

    return {
      name: liteHotel.name,
      description: liteHotel.description || `${liteHotel.name} in ${liteHotel.city}, ${liteHotel.country}`,
      pricePerNight: lowestRate,
      rating: liteHotel.rating,
      imageUrl: liteHotel.images?.[0] || null,
      coordinates: {
        lat: liteHotel.latitude,
        lng: liteHotel.longitude
      },
      amenities: liteHotel.amenities,
      liteApiId: liteHotel.id,
      bookable: true,
      commission: avgCommission
    };
  }

  /**
   * Check if service is properly configured
   */
  isConfigured(): boolean {
    return !!(this.config.publicKey && this.config.privateKey);
  }

  /**
   * Get current configuration info for debugging
   */
  getConfigInfo(): {
    baseUrl: string;
    version: string;
    isSandbox: boolean;
    hasPublicKey: boolean;
    hasPrivateKey: boolean;
    keyType: string;
  } {
    const keyType = this.config.privateKey.startsWith('sand_') || this.config.publicKey.includes('sandbox') ? 'sandbox' : 'production';
    return {
      baseUrl: this.config.baseUrl,
      version: this.config.version,
      isSandbox: keyType === 'sandbox',
      hasPublicKey: !!this.config.publicKey,
      hasPrivateKey: !!this.config.privateKey,
      keyType
    };
  }

  /**
   * Test different sandbox endpoints to find the correct one
   */
  async testSandboxEndpoints(): Promise<{
    workingEndpoint?: string;
    results: Array<{ url: string; status: string; error?: string }>;
  }> {
    const testEndpoints = [
      'https://api.sandbox.liteapi.travel',
      'https://sandbox-api.liteapi.travel',
      'https://api-sandbox.liteapi.travel',
      'https://test.api.liteapi.travel',
      'https://dev.api.liteapi.travel',
      'https://staging.api.liteapi.travel'
    ];

    const results = [];
    let workingEndpoint: string | undefined;

    for (const endpoint of testEndpoints) {
      try {
        const testUrl = `${endpoint}/${this.config.version}/data/destinations?query=test`;
        const response = await fetch(testUrl, {
          method: 'GET',
          headers: this.getHeaders(false)
        });

        const result = {
          url: endpoint,
          status: `${response.status} ${response.statusText}`
        };

        if (response.ok || response.status === 400) { // 400 might indicate valid endpoint but bad params
          workingEndpoint = endpoint;
          results.push(result);
          break;
        } else {
          results.push({ ...result, error: await response.text() });
        }
      } catch (error) {
        results.push({
          url: endpoint,
          status: 'Connection failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return { workingEndpoint, results };
  }
}

export const liteApiService = new LiteAPIService();

export type {
  LiteAPIHotel,
  LiteAPIRate,
  LiteAPISearchRequest,
  LiteAPISearchResponse,
  LiteAPIBookingRequest,
  LiteAPIBookingResponse
};