import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, Star, Euro, Bed, Wifi, Car, Coffee, Dumbbell } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface BookableHotel {
  id: string;
  name: string;
  description: string;
  rating: number;
  pricePerNight: number;
  imageUrl: string | null;
  coordinates: { lat: number; lng: number };
  amenities: string[];
  liteApiId: string;
  bookable: boolean;
  commission: number;
  liteApiData: {
    id: string;
    rates: Array<{
      roomTypeId: string;
      roomTypeName: string;
      boardType: string;
      pricePerNight: number;
      cancellationPolicy: string;
      commission?: { amount: number; percentage: number };
    }>;
    amenities: string[];
    checkInTime: string;
    checkOutTime: string;
  };
}

interface HotelBookingWidgetProps {
  hotel: BookableHotel;
  checkIn: string;
  checkOut: string;
  guests: { adults: number; children?: number };
  onBookingRequest: (bookingData: any) => void;
}

const amenityIcons: Record<string, React.ReactNode> = {
  'wifi': <Wifi className="w-4 h-4" />,
  'parking': <Car className="w-4 h-4" />,
  'breakfast': <Coffee className="w-4 h-4" />,
  'gym': <Dumbbell className="w-4 h-4" />,
  'pool': <div className="w-4 h-4 bg-blue-500 rounded-full" />,
  'spa': <div className="w-4 h-4 bg-green-500 rounded-full" />,
};

export function HotelBookingWidget({ hotel, checkIn, checkOut, guests, onBookingRequest }: HotelBookingWidgetProps) {
  const [selectedRate, setSelectedRate] = useState(hotel.liteApiData.rates[0] || null);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [guestDetails, setGuestDetails] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'pay_at_hotel'>('credit_card');
  const [specialRequests, setSpecialRequests] = useState('');
  const { toast } = useToast();

  const calculateStayDuration = () => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const calculateTotalPrice = () => {
    if (!selectedRate) return 0;
    return selectedRate.pricePerNight * calculateStayDuration();
  };

  

  const handleBooking = async () => {
    if (!selectedRate) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie einen Zimmertyp aus.",
        variant: "destructive"
      });
      return;
    }

    if (!guestDetails.firstName || !guestDetails.lastName || !guestDetails.email) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Pflichtfelder aus.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Step 1: Pre-book the rate
      const prebookData = {
        hotelId: hotel.liteApiId,
        rateId: selectedRate.roomTypeId,
        checkIn,
        checkOut,
        guests,
        rooms: [{ adults: guests.adults, children: guests.children ? [{ age: 10 }] : [] }]
      };

      const prebookResponse = await fetch('/api/liteapi/prebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prebookData)
      });

      if (!prebookResponse.ok) {
        throw new Error('Pre-booking failed');
      }

      const prebookResult = await prebookResponse.json();

      // Extract transaction ID from prebook response - this is crucial for LiteAPI
      const transactionId = prebookResult.transactionId || prebookResult.data?.transactionId;
      
      console.log('Prebook result:', prebookResult);
      console.log('Using transaction ID:', transactionId);

      // Step 2: Complete booking with guest details, offerId AND transactionId
      const bookingData = {
        prebookId: prebookResult.data?.prebookId || prebookResult.prebookId,
        offerId: prebookResult.data?.offerId || prebookResult.offerId,
        transactionId: transactionId, // Pass the transaction ID from prebook
        guestDetails: [{
          ...guestDetails,
          phone: guestDetails.phone || '',
          nationality: 'DE'
        }],
        paymentMethod,
        specialRequests: specialRequests || ''
      };

      const bookingResponse = await fetch('/api/liteapi/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });

      if (!bookingResponse.ok) {
        throw new Error('Booking completion failed');
      }

      const bookingResult = await bookingResponse.json();
      
      onBookingRequest(bookingResult);
      setIsBookingDialogOpen(false);
      
      toast({
        title: "Buchung erfolgreich!",
        description: `Ihre Buchung für ${hotel.name} wurde bestätigt. Buchungsnummer: ${bookingResult.confirmationNumber}`,
      });

    } catch (error) {
      toast({
        title: "Buchungsfehler",
        description: "Die Buchung konnte nicht abgeschlossen werden. Bitte versuchen Sie es erneut.",
        variant: "destructive"
      });
      console.error('Booking error:', error);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const formatAmenity = (amenity: string) => {
    if (!amenity) return null;
    const key = amenity.toLowerCase();
    const icon = amenityIcons[key] || <Bed className="w-4 h-4" />;
    return (
      <div key={amenity} className="flex items-center gap-1 text-sm text-gray-600">
        {icon}
        <span className="capitalize">{amenity}</span>
      </div>
    );
  };

  return (
    <Card className="w-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
              {hotel.name}
            </CardTitle>
            <div className="flex items-center gap-1 mb-2">
              {renderStars(hotel.rating)}
              <span className="text-sm text-gray-600 ml-1">({hotel.rating}/5)</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span className="truncate">{hotel.description}</span>
            </div>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-700 ml-2">
            Buchbar
          </Badge>
        </div>
      </CardHeader>

      {hotel.imageUrl && (
        <div className="px-6 pb-3">
          <img
            src={hotel.imageUrl}
            alt={hotel.name}
            className="w-full h-24 object-cover rounded-lg"
          />
        </div>
      )}

      <CardContent className="pt-0 space-y-3">
        {/* Zimmertypen und Preise */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Verfügbare Zimmer</h4>
          {hotel.liteApiData.rates.map((rate, index) => (
            <div
              key={rate.roomTypeId}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedRate?.roomTypeId === rate.roomTypeId
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedRate(rate)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium text-sm">{rate.roomTypeName}</p>
                  <p className="text-xs text-gray-600">{rate.boardType}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-blue-600">€{rate.pricePerNight}</p>
                  <p className="text-xs text-gray-500">pro Nacht</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Ausstattung - kompakt */}
        {hotel.liteApiData.amenities.length > 0 && (
          <div className="space-y-1">
            <h4 className="font-medium text-gray-900 text-sm">Ausstattung</h4>
            <div className="flex flex-wrap gap-1">
              {hotel.liteApiData.amenities.slice(0, 4).map((amenity) => (
                <span key={amenity} className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {amenity}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Aufenthaltsdetails - kompakt */}
        <div className="bg-gray-50 p-2 rounded text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-600">Check-in: {new Date(checkIn).toLocaleDateString('de-DE')}</span>
            <span className="text-gray-600">Check-out: {new Date(checkOut).toLocaleDateString('de-DE')}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3 text-gray-500" />
            <span>{guests.adults} Erwachsene{guests.children ? `, ${guests.children} Kinder` : ''}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <div className="w-full space-y-3">
          {selectedRate && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">{calculateStayDuration()} Nächte</span>
              <div className="text-right">
                <p className="font-semibold text-lg">€{calculateTotalPrice()}</p>
                <p className="text-xs text-gray-500">Gesamtpreis</p>
              </div>
            </div>
          )}

          <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="w-full" 
                disabled={!selectedRate}
                size="lg"
              >
                <Euro className="w-4 h-4 mr-2" />
                Jetzt buchen
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Hotelbuchung</DialogTitle>
                <DialogDescription>
                  Vervollständigen Sie Ihre Buchung für {hotel.name}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Buchungsübersicht */}
                <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                  <h4 className="font-medium">Buchungsdetails</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Hotel:</strong> {hotel.name}</p>
                    <p><strong>Zimmer:</strong> {selectedRate?.roomTypeName}</p>
                    <p><strong>Zeitraum:</strong> {new Date(checkIn).toLocaleDateString('de-DE')} - {new Date(checkOut).toLocaleDateString('de-DE')}</p>
                    <p><strong>Gäste:</strong> {guests.adults} Erwachsene{guests.children ? `, ${guests.children} Kinder` : ''}</p>
                    <p><strong>Gesamtpreis:</strong> €{calculateTotalPrice()}</p>
                    
                  </div>
                </div>

                {/* Gästedetails */}
                <div className="space-y-3">
                  <h4 className="font-medium">Hauptgast</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="firstName">Vorname *</Label>
                      <Input
                        id="firstName"
                        value={guestDetails.firstName}
                        onChange={(e) => setGuestDetails(prev => ({ ...prev, firstName: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Nachname *</Label>
                      <Input
                        id="lastName"
                        value={guestDetails.lastName}
                        onChange={(e) => setGuestDetails(prev => ({ ...prev, lastName: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">E-Mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={guestDetails.email}
                      onChange={(e) => setGuestDetails(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="ihre.email@example.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={guestDetails.phone}
                      onChange={(e) => setGuestDetails(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+49 123 456789"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      value={guestDetails.phone}
                      onChange={(e) => setGuestDetails(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Zahlungsmethode */}
                <div className="space-y-2">
                  <Label htmlFor="payment">Zahlungsmethode</Label>
                  <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit_card">Kreditkarte</SelectItem>
                      <SelectItem value="pay_at_hotel">Zahlung im Hotel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sonderwünsche */}
                <div className="space-y-2">
                  <Label htmlFor="requests">Sonderwünsche (optional)</Label>
                  <Input
                    id="requests"
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="z.B. späte Anreise, ruhiges Zimmer..."
                  />
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setIsBookingDialogOpen(false)}>
                  Abbrechen
                </Button>
                <Button onClick={handleBooking}>
                  Buchung bestätigen
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardFooter>
    </Card>
  );
}