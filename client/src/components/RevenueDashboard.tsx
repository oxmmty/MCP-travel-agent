import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Euro, TrendingUp, Hotel, Users, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface RevenueMetrics {
  totalRevenue: number;
  totalBookings: number;
  averageCommission: number;
  conversionRate: number;
  monthlyGrowth: number;
}

interface BookingStats {
  id: number;
  hotelName: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  commission: number;
  status: string;
  createdAt: string;
}

export function RevenueDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');

  // Mock data for demonstration - in real implementation this would come from the API
  const mockMetrics: RevenueMetrics = {
    totalRevenue: 2847.50,
    totalBookings: 23,
    averageCommission: 123.80,
    conversionRate: 2.4,
    monthlyGrowth: 15.8
  };

  const mockBookings: BookingStats[] = [
    {
      id: 1,
      hotelName: "Hotel Vier Jahreszeiten München",
      checkIn: "2025-07-15",
      checkOut: "2025-07-17",
      totalPrice: 420.00,
      commission: 42.00,
      status: "confirmed",
      createdAt: "2025-06-28T10:30:00Z"
    },
    {
      id: 2,
      hotelName: "Mandarin Oriental Munich",
      checkIn: "2025-08-01",
      checkOut: "2025-08-03",
      totalPrice: 680.00,
      commission: 68.00,
      status: "confirmed",
      createdAt: "2025-06-27T14:15:00Z"
    },
    {
      id: 3,
      hotelName: "Hotel Bayerischer Hof",
      checkIn: "2025-07-20",
      checkOut: "2025-07-22",
      totalPrice: 350.00,
      commission: 35.00,
      status: "pending",
      createdAt: "2025-06-26T09:45:00Z"
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      confirmed: 'default',
      pending: 'secondary',
      cancelled: 'destructive'
    };
    
    const labels: Record<string, string> = {
      confirmed: 'Bestätigt',
      pending: 'Ausstehend',
      cancelled: 'Storniert'
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Revenue Dashboard</h1>
          <p className="text-gray-600 mt-1">Übersicht über Buchungen und Provisionen</p>
        </div>
        <div className="flex gap-2">
          {(['week', 'month', 'quarter'] as const).map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
            >
              {period === 'week' ? 'Woche' : period === 'month' ? 'Monat' : 'Quartal'}
            </Button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamtumsatz</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(mockMetrics.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
              +{mockMetrics.monthlyGrowth}% zum Vormonat
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Buchungen</CardTitle>
            <Hotel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockMetrics.totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              Durchschnitt: {formatCurrency(mockMetrics.averageCommission)} Provision
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockMetrics.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Von Suche zu Buchung
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ø Kommission</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(mockMetrics.averageCommission)}</div>
            <p className="text-xs text-muted-foreground">
              Pro Buchung
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="bookings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bookings">Aktuelle Buchungen</TabsTrigger>
          <TabsTrigger value="analytics">Analytik</TabsTrigger>
          <TabsTrigger value="hotels">Top Hotels</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Letzte Buchungen</CardTitle>
              <CardDescription>
                Übersicht über die neuesten Hotelbuchungen und deren Status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{booking.hotelName}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}</span>
                        </div>
                        <span>Buchung #{booking.id}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(booking.totalPrice)}</p>
                        <p className="text-sm text-green-600">+{formatCurrency(booking.commission)} Provision</p>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monatliche Entwicklung</CardTitle>
                <CardDescription>Umsatz und Buchungen der letzten 6 Monate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-center text-gray-500">
                    <TrendingUp className="w-12 h-12 mx-auto mb-2" />
                    <p>Chart Komponente</p>
                    <p className="text-sm">Hier würde das Umsatz-Chart angezeigt</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Buchungsquellen</CardTitle>
                <CardDescription>Herkunft der Buchungen nach Kanal</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Chat-Interface</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                      </div>
                      <span className="text-sm font-medium">65%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Kartensuche</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                      </div>
                      <span className="text-sm font-medium">25%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Direkte Suche</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: '10%' }}></div>
                      </div>
                      <span className="text-sm font-medium">10%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="hotels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top performende Hotels</CardTitle>
              <CardDescription>Hotels nach Umsatz und Buchungsanzahl</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "Hotel Vier Jahreszeiten München", bookings: 8, revenue: 1240.00, commission: 124.00 },
                  { name: "Mandarin Oriental Munich", bookings: 5, revenue: 890.00, commission: 89.00 },
                  { name: "Hotel Bayerischer Hof", bookings: 6, revenue: 780.00, commission: 78.00 },
                  { name: "Hilton Munich Park", bookings: 4, revenue: 520.00, commission: 52.00 }
                ].map((hotel, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{hotel.name}</p>
                        <p className="text-sm text-gray-600">{hotel.bookings} Buchungen</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(hotel.revenue)}</p>
                      <p className="text-sm text-green-600">+{formatCurrency(hotel.commission)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>LiteAPI Status & Actions</CardTitle>
          <CardDescription>Aktuelle Integration und verfügbare Aktionen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div>
                <p className="font-medium">LiteAPI Integration</p>
                <p className="text-sm text-gray-600">
                  API-Schlüssel konfiguriert, aber Authentifizierung fehlgeschlagen (401)
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                API testen
              </Button>
              <Button size="sm">
                Konfiguration prüfen
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}