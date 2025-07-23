import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { AuthOverlay } from "@/components/auth-overlay";

interface TakemetoHeroProps {
  onGetStarted?: () => void;
}

export default function TakemetoHero({ onGetStarted }: TakemetoHeroProps) {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  
  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center">
        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-8"
        >
          AI-Powered Travel Concierge
        </motion.p>

        {/* Main Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-4 mb-8"
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-foreground">
            Make every second count,
          </h1>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-foreground">
            take me to
          </h1>
          <h1 className="text-gradient text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-medium">
            the best restaurants in
          </h1>
          <h1 className="text-gradient text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-medium">
            Barcelona
          </h1>
        </motion.div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
        >
          Effortless travel planning powered by AI.
          <br />
          Personalized itineraries that match your unique travel style.
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button 
            onClick={isAuthenticated ? onGetStarted : () => setIsAuthOpen(true)}
            className="btn-primary text-lg px-8 py-4"
          >
            {isAuthenticated ? 'Jetzt planen →' : 'Discover Your Travel Personality →'}
          </Button>
          <p className="text-sm text-muted-foreground">
            And we start to plan the best route
          </p>
        </motion.div>
      </div>
      
      <AuthOverlay 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
      />
    </section>
  );
}