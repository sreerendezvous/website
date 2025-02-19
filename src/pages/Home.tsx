import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Link, useNavigate } from 'react-router-dom';
import { homeContent } from '@/cms';
import { CreatorSpotlight } from '@/components/home/CreatorSpotlight';
import { useStore } from '@/lib/store';

export function Home() {
  const navigate = useNavigate();
  const { fetchExperiences, fetchSpotlights } = useStore();

  useEffect(() => {
    fetchExperiences();
    fetchSpotlights();
  }, [fetchExperiences, fetchSpotlights]);

  return (
    <div className="relative">
      {/* Hero Section with Static Background */}
      <section className="relative h-screen">
        {/* Background Image with Gradient Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `linear-gradient(to bottom, rgba(29, 25, 24, 0.3), rgba(29, 25, 24, 0.7)), url(${homeContent.hero.video.poster})` 
          }}
        />
        
        {/* Hero Content */}
        <div className="relative container mx-auto px-4 h-full flex items-center">
          <div className="max-w-2xl">
            <motion.h1 
              className="text-6xl md:text-7xl font-display font-light mb-8 text-sand-100 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {homeContent.hero.title}
            </motion.h1>
            <motion.p 
              className="text-xl text-sand-100 mb-12 font-light"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {homeContent.hero.subtitle}
            </motion.p>
            <motion.div 
              className="flex gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Button 
                size="lg" 
                onClick={() => navigate('/experiences')}
                className="text-lg px-8 py-4"
              >
                Explore
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
        >
          <div className="flex flex-col items-center text-sand-100">
            <span className="text-sm uppercase tracking-widest mb-2">Scroll</span>
            <div className="w-px h-16 bg-sand-100/50" />
          </div>
        </motion.div>
      </section>

      {/* Creator Spotlight Section */}
      <CreatorSpotlight />
    </div>
  );
}