import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, Hotel, MapPin, Euro, Phone, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface HotelBooking {
  id: number;
  liteApiBookingId: string;
  confirmationNumber: string;
  status: string;
  hotelName: string;
  hotelAddress: string;
  checkInDate: string;
  checkOutDate: string;
  totalPrice: string;
  currency: string;
  commission: string;
  guestDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  roomDetails: {
    roomType: string;
    adults: number;
    children: number;
  };
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'confirmed': return 'bg-green-100 text-green-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getPaymentStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'paid': case 'confirmed': return 'bg-green-100 text-green-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'failed': case 'refunded': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function BookingsPage() {
  const { data: bookings, isLoading, error } = useQuery<HotelBooking[]>({
    queryKey: ['/api/bookings'],
    queryFn: async () => {
      const response = await fetch('/api/bookings');
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">Fehler beim Laden der Buchungen. Bitte versuchen Sie es erneut.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Meine Buchungen</h1>
        <p className="text-gray-600 mt-2">Verwalten Sie Ihre Hotelbuchungen und Reisepläne</p>
      </div>

      {!bookings || bookings.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <Hotel className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Buchungen vorhanden</h3>
            <p className="text-gray-600 mb-4">Sie haben noch keine Hotelbuchungen getätigt.</p>
            <Button onClick={() => window.location.href = '/'}>
              Hotels suchen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {bookings.map((booking) => (
            <Card key={booking.id} className="overflow-hidden">
              <CardHeader className="bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl font-semibold text-gray-900">
                      {booking.hotelName}
                    </CardTitle>
                    <div className="flex items-center text-gray-600 mt-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      {booking.hotelAddress}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status}
                    </Badge>
                    <p className="text-sm text-gray-600 mt-1">
                      Buchung #{booking.confirmationNumber}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Termine */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 flex items-center">
                      <CalendarDays className="h-4 w-4 mr-2" />
                      Reisedaten
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Check-in:</span>
                        <p className="font-medium">
                          {format(new Date(booking.checkInDate), 'dd. MMMM yyyy', { locale: de })}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Check-out:</span>
                        <p className="font-medium">
                          {format(new Date(booking.checkOutDate), 'dd. MMMM yyyy', { locale: de })}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Zimmer:</span>
                        <p className="font-medium">{booking.roomDetails.roomType}</p>
                        <p className="text-xs text-gray-500">
                          {booking.roomDetails.adults} Erwachsene
                          {booking.roomDetails.children > 0 && `, ${booking.roomDetails.children} Kinder`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Gast */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Hauptgast</h4>
                    <div className="space-y-2 text-sm">
                      <p className="font-medium">
                        {booking.guestDetails.firstName} {booking.guestDetails.lastName}
                      </p>
                      <div className="flex items-center text-gray-600">
                        <Mail className="h-3 w-3 mr-2" />
                        {booking.guestDetails.email}
                      </div>
                      {booking.guestDetails.phone && (
                        <div className="flex items-center text-gray-600">
                          <Phone className="h-3 w-3 mr-2" />
                          {booking.guestDetails.phone}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Preis & Zahlung */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 flex items-center">
                      <Euro className="h-4 w-4 mr-2" />
                      Preis & Zahlung
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Gesamtpreis:</span>
                        <p className="font-semibold text-lg">
                          {parseFloat(booking.totalPrice).toFixed(2)} {booking.currency}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Zahlungsmethode:</span>
                        <p className="font-medium">{booking.paymentMethod}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Zahlungsstatus:</span>
                        <Badge className={`${getPaymentStatusColor(booking.paymentStatus)} ml-2`}>
                          {booking.paymentStatus}
                        </Badge>
                      </div>
                      {booking.commission && parseFloat(booking.commission) > 0 && (
                        <div className="pt-2 border-t">
                          <span className="text-xs text-gray-500">
                            Kommission: {parseFloat(booking.commission).toFixed(2)} {booking.currency}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t flex justify-between items-center">
                  <p className="text-xs text-gray-500">
                    Gebucht am {format(new Date(booking.createdAt), 'dd.MM.yyyy HH:mm', { locale: de })}
                  </p>
                  <div className="space-x-2">
                    <Button variant="outline" size="sm">
                      Details anzeigen
                    </Button>
                    {booking.status === 'confirmed' && (
                      <Button variant="outline" size="sm">
                        Stornieren
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}