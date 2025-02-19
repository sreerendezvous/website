import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';

export function CreatorSpotlight() {
  const navigate = useNavigate();
  const { spotlights, fetchSpotlights } = useStore();
  const [currentImageIndexes, setCurrentImageIndexes] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchSpotlights();
  }, [fetchSpotlights]);

  // Initialize image indexes
  useEffect(() => {
    const indexes: Record<string, number> = {};
    spotlights.forEach(spotlight => {
      indexes[spotlight.id] = 0;
    });
    setCurrentImageIndexes(indexes);
  }, [spotlights]);

  // Rotate images every 3 seconds when hovered
  const startImageRotation = (spotlightId: string) => {
    const spotlight = spotlights.find(s => s.id === spotlightId);
    if (!spotlight || !spotlight.media?.length) return;

    const interval = setInterval(() => {
      setCurrentImageIndexes(prev => ({
        ...prev,
        [spotlightId]: (prev[spotlightId] + 1) % spotlight.media.length
      }));
    }, 3000);

    return () => clearInterval(interval);
  };

  if (spotlights.length === 0) {
    return null;
  }

  return (
    <section className="py-24 bg-earth-900/95 relative overflow-hidden">
      <div className="absolute inset-0 bg-texture opacity-5" />
      
      <div className="container mx-auto px-4 relative">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {spotlights.slice(0, 3).map((spotlight) => (
            <motion.div
              key={spotlight.id}
              className="relative aspect-[3/4] cursor-pointer group"
              onClick={() => navigate(`/creators/${spotlight.creator.id}`)}
              onHoverStart={() => startImageRotation(spotlight.id)}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImageIndexes[spotlight.id]}
                  src={spotlight.media[currentImageIndexes[spotlight.id]]?.url}
                  alt={spotlight.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                />
              </AnimatePresence>

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-earth-900 via-earth-900/50 to-transparent opacity-80" />

              {/* Content - Always Visible */}
              <div className="absolute inset-x-0 bottom-0 p-8">
                <div className="space-y-2">
                  <h3 className="text-2xl font-display text-sand-100">
                    {spotlight.creator.full_name}
                  </h3>
                  <p className="text-xl font-display text-sand-300">
                    {spotlight.title}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}