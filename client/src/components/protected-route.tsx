import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { AuthOverlay } from '@/components/auth-overlay';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setShowAuthOverlay(true);
    } else if (isAuthenticated) {
      setShowAuthOverlay(false);
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Authentifizierung wird überprüft...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Willkommen bei TakeMeTo.ai
            </h1>
            <p className="text-gray-600 mb-8">
              Bitte melden Sie sich an, um fortzufahren
            </p>
          </div>
        </div>
        <AuthOverlay 
          isOpen={showAuthOverlay} 
          onClose={() => setShowAuthOverlay(false)} 
        />
      </>
    );
  }

  return <>{children}</>;
}