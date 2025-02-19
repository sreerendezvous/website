import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Award } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';

export function Creators() {
  const navigate = useNavigate();
  const { creators, loading, error, fetchCreators } = useStore();

  useEffect(() => {
    fetchCreators();
  }, [fetchCreators]);

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <p className="text-sand-400">Loading creators...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 bg-earth-900">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-display mb-4">Meet Our Amazing Creators</h1>
          <p className="text-sand-400 max-w-2xl mx-auto">
            Discover passionate individuals who create unique and unforgettable experiences
          </p>
        </div>

        {/* Creators Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {creators.map((creator) => (
            <motion.div
              key={creator.id}
              className="bg-earth-800/50 rounded-lg overflow-hidden flex flex-col"
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
              onClick={() => navigate(`/creators/${creator.id}`)}
            >
              <div className="relative h-48">
                <img
                  src={creator.profile_image || 
                       `https://api.dicebear.com/7.x/initials/svg?seed=${creator.full_name}&backgroundColor=1d1918&textColor=e8e4dc`}
                  alt={creator.full_name}
                  className="w-full h-full object-cover bg-earth-800"
                />
                {creator.creator_profile?.rating && (
                  <div className="absolute top-4 right-4">
                    <div className="flex items-center gap-1 bg-earth-900/90 rounded-full px-3 py-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium">{creator.creator_profile.rating}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-display mb-2">
                  {creator.creator_profile?.business_name || creator.full_name}
                </h3>
                <p className="text-sand-400 mb-4 line-clamp-2">{creator.bio}</p>

                {creator.creator_profile?.specialties && creator.creator_profile.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {creator.creator_profile.specialties.slice(0, 3).map((specialty) => (
                      <span
                        key={specialty}
                        className="text-xs px-2 py-1 bg-earth-700/50 rounded-full text-sand-300"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-auto">
                  <div className="flex items-center gap-4 text-sm text-sand-400 mb-4">
                    <div className="flex items-center gap-1">
                      <Award className="h-4 w-4" />
                      <span>{creator.creator_profile?.reviews_count || 0} reviews</span>
                    </div>
                  </div>

                  <Button className="w-full">
                    View Profile
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {creators.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sand-400 mb-6">No creators found</p>
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-display mb-4">Want to become a creator?</h2>
          <p className="text-sand-400 mb-6">Share your passion and earn by creating unique experiences</p>
          <Button size="lg" onClick={() => navigate('/apply/creator')}>
            Apply Now
          </Button>
        </div>
      </div>
    </div>
  );
}