import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nextProvider } from "react-i18next";
import i18n from "./lib/i18n";
import { AuthProvider } from "@/hooks/useAuth";
import { FavoritesProvider } from "@/hooks/useFavorites";
import { TripPlanningProvider } from "@/contexts/TripPlanningContext";
import { ProtectedRoute } from "@/components/protected-route";
import ErrorBoundary from "@/components/ErrorBoundary";
import Home from "@/pages/Home";
import SavedPage from "@/pages/SavedPage";
import BookingsPage from "@/pages/BookingsPage";
import LiteAPIMapTest from "@/pages/LiteAPIMapTest";
import LiteAPIMapboxTest from "@/pages/LiteAPIMapboxTest";
import SocialMediaDemo from "@/pages/SocialMediaDemo";
import TravelInspirationDemo from "@/pages/TravelInspirationDemo";
import MapComparison from "@/pages/MapComparison";
import SimpleMapTest from "@/pages/SimpleMapTest";
import WorkingMapTest from "@/pages/WorkingMapTest";
import NotFound from "@/pages/not-found";
import { ResetPassword } from "@/pages/ResetPassword";

function Router() {
  return (
    <Switch>
      <Route path="/">
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      </Route>
      <Route path="/saved">
        <ProtectedRoute>
          <SavedPage />
        </ProtectedRoute>
      </Route>
      <Route path="/bookings">
        <ProtectedRoute>
          <BookingsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/liteapi-map">
        <ProtectedRoute>
          <LiteAPIMapTest />
        </ProtectedRoute>
      </Route>
      <Route path="/liteapi-mapbox">
        <ProtectedRoute>
          <LiteAPIMapboxTest />
        </ProtectedRoute>
      </Route>
      <Route path="/social-media-demo">
        <ProtectedRoute>
          <SocialMediaDemo />
        </ProtectedRoute>
      </Route>
      <Route path="/travel-inspiration-demo">
        <ProtectedRoute>
          <TravelInspirationDemo />
        </ProtectedRoute>
      </Route>
      <Route path="/map-comparison">
        <ProtectedRoute>
          <MapComparison />
        </ProtectedRoute>
      </Route>
      <Route path="/simple-map-test">
        <ProtectedRoute>
          <SimpleMapTest />
        </ProtectedRoute>
      </Route>
      <Route path="/working-map-test">
        <ProtectedRoute>
          <WorkingMapTest />
        </ProtectedRoute>
      </Route>
      <Route path="/reset-password">
        <ResetPassword />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <TooltipProvider>
            <AuthProvider>
              <FavoritesProvider>
                <TripPlanningProvider>
                  <Toaster />
                  <Router />
                </TripPlanningProvider>
              </FavoritesProvider>
            </AuthProvider>
          </TooltipProvider>
        </I18nextProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
