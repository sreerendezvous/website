import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Users, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';
import type { Experience } from '@/types';

interface ExperienceCardProps {
  experience: Experience;
}

export function ExperienceCard({ experience }: ExperienceCardProps) {
  const navigate = useNavigate();

  // Helper function to get the first image URL from media array
  const getFirstImageUrl = () => {
    if (experience.media && Array.isArray(experience.media)) {
      // Sort media by order_index and get the first image
      const sortedMedia = [...experience.media].sort((a, b) => 
        (a.order_index || 0) - (b.order_index || 0)
      );
      const firstImage = sortedMedia.find(m => m.type === 'image');
      if (firstImage) return firstImage.url;
    }
    // Fallback image if no media is available
    return 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80';
  };

  return (
    <motion.div
      className="group cursor-pointer flex flex-col h-full"
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
      onClick={() => navigate(`/experiences/${experience.id}`)}
    >
      <div className="bg-earth-800/50 rounded-lg overflow-hidden h-full flex flex-col">
        {/* Image Container */}
        <div className="relative h-48">
          <img
            src={getFirstImageUrl()}
            alt={experience.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-earth-900/80 via-earth-900/20 to-transparent" />
          
          {/* Category Tag */}
          {experience.category?.name && (
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1 bg-earth-900/80 backdrop-blur-sm rounded-full text-xs uppercase tracking-wider text-sand-300">
                {experience.category.name}
              </span>
            </div>
          )}

          {/* Rating */}
          {experience.rating && (
            <div className="absolute top-4 right-4">
              <div className="flex items-center gap-1 px-2 py-1 bg-earth-900/80 backdrop-blur-sm rounded-full">
                <Star className="h-3 w-3 text-yellow-400 fill-current" />
                <span className="text-xs text-sand-100">{experience.rating}</span>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 flex-1 flex flex-col">
          <h3 className="text-xl font-display text-sand-100 mb-2 line-clamp-2">
            {experience.title}
          </h3>
          
          <p className="text-sand-400 text-sm mb-4 line-clamp-2">
            {experience.description}
          </p>

          <div className="mt-auto">
            <div className="flex flex-wrap gap-4 text-sm text-sand-300 mb-4">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{experience.duration} min</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>Max {experience.max_participants}</span>
              </div>
              {experience.location?.city && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{experience.location.city}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xl font-display text-sand-100">
                ${experience.price}
              </span>
              <Button size="sm">View Details</Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}