import { useState } from "react";
import { Button } from "@/components/ui/button";
import TakemetoHeader from "@/components/TakemetoHeader";
import TakemetoHero from "@/components/TakemetoHero";
import TakemetoFeatures from "@/components/TakemetoFeatures";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Calendar, Users, Star, Globe } from "lucide-react";

interface TakemetoLandingProps {
  onGetStarted?: () => void;
}

export default function TakemetoLanding({ onGetStarted }: TakemetoLandingProps) {
  const destinations = [
    {
      title: "Romantic Escapes",
      description: "Cozy destinations for couples seeking connection and romance.",
      image: "/api/placeholder/300/200",
      category: "Romance"
    },
    {
      title: "Instagram Worthy",
      description: "Picture-perfect locations where your content will go viral. Always hilarious pictures.",
      image: "/api/placeholder/300/200", 
      category: "Social"
    },
    {
      title: "Culinary Adventures",
      description: "Savor authentic flavors and local ingredients in world-renowned authentic local flavors.",
      image: "/api/placeholder/300/200",
      category: "Food"
    },
    {
      title: "Adventure Seeking",
      description: "Thrilling experiences for those who crave adrenaline and exploration.",
      image: "/api/placeholder/300/200",
      category: "Adventure"
    },
    {
      title: "Cultural Immersion", 
      description: "Dive into local traditions, history, and art that connect you with authentic experiences.",
      image: "/api/placeholder/300/200",
      category: "Culture"
    },
    {
      title: "Luxury Retreats",
      description: "Premium accommodations and exclusive experiences for discerning travelers.",
      image: "/api/placeholder/300/200",
      category: "Luxury"
    }
  ];

  const steps = [
    {
      step: "1",
      title: "Take the Quiz",
      description: "Share your interests, budget, and travel preferences and unlock experiences."
    },
    {
      step: "2", 
      title: "AI Analysis",
      description: "Our advanced AI analyzes your personality and matches you with perfect destinations."
    },
    {
      step: "3",
      title: "Get Your Itinerary", 
      description: "Receive a personalized plan with recommendations, planning and advice."
    },
    {
      step: "4",
      title: "Trusted Reviews",
      description: "Read authentic reviews and social media integration from fellow travelers."
    },
    {
      step: "5",
      title: "Make it Social",
      description: "Share your travel experiences and inspire others."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <TakemetoHeader onGetStarted={onGetStarted} />
      
      <TakemetoHero onGetStarted={onGetStarted} />
      
      <TakemetoFeatures />
      
      {/* Destinations Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-medium text-foreground mb-4">
              Discover Your Perfect Destination
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From romantic getaways to thrilling adventures
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {destinations.map((destination, index) => (
              <motion.div
                key={destination.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group cursor-pointer"
              >
                <div className="bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300">
                  <div className="h-48 bg-gradient-to-br from-coral-primary/20 to-blue-end/20 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-coral-primary to-blue-end flex items-center justify-center">
                        <MapPin className="w-8 h-8 text-white" />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">
                        {destination.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {destination.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {destination.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-medium text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Five simple steps to your perfect social travel experience
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className={`w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-r from-coral-primary to-blue-end flex items-center justify-center text-white font-bold text-lg`}>
                  {step.step}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <img 
                src="/takemeto-logo.svg" 
                alt="takemeto" 
                className="h-10 w-auto mb-4 filter brightness-0 invert"
              />
              <p className="text-gray-400 text-sm">
                Your AI-powered travel concierge, creating perfectly personalized travel experiences.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">How it Works</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
            
            <div>
              <Button 
                onClick={onGetStarted}
                className="btn-primary w-full"
              >
                Start Planning
              </Button>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm text-gray-400">
            © 2025 takemeto. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}