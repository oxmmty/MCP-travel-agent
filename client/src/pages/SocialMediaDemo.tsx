import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import SocialMediaDemoComponent from '@/components/SocialMediaDemo';

export default function SocialMediaDemo() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => setLocation('/')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück zur Hauptanwendung
        </Button>
      </div>
      
      <SocialMediaDemoComponent />
    </div>
  );
}