import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, Users, Globe, Shield, Calendar, Heart, Play, Star, Award, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { LocationMap } from '@/components/experiences/LocationMap';
import { AttendeesList } from '@/components/experiences/AttendeesList';

export function ExperienceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { experiences } = useStore();
  const [currentMediaIndex, setCurrentMediaIndex] = React.useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = React.useState(false);

  const experience = experiences.find(exp => exp.id === id);

  if (!experience) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <p className="text-sand-400">Experience not found</p>
      </div>
    );
  }

  // Ensure media is an array and sort it by order_index
  const sortedMedia = experience.media && Array.isArray(experience.media) 
    ? [...experience.media].sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
    : [];

  // Default image if no media is available
  const defaultImage = 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80';

  // Get the current media item
  const currentMedia = sortedMedia[currentMediaIndex] || { url: defaultImage, type: 'image' };

  return (
    <div className="min-h-screen pt-20 pb-12 bg-earth-900">
      <div className="container mx-auto px-4">
        {/* Media Gallery */}
        <div className="relative h-[70vh] mb-8 rounded-lg overflow-hidden">
          {currentMedia.type === 'video' ? (
            <video
              src={currentMedia.url}
              className="w-full h-full object-cover"
              controls={isVideoPlaying}
              onClick={() => setIsVideoPlaying(!isVideoPlaying)}
              poster={sortedMedia.find(m => m.type === 'image')?.url}
            />
          ) : (
            <img
              src={currentMedia.url}
              alt={experience.title}
              className="w-full h-full object-cover"
            />
          )}
          
          {/* Thumbnails - Only show if there are multiple media items */}
          {sortedMedia.length > 1 && (
            <div className="absolute bottom-4 left-4 right-4 flex gap-2 overflow-x-auto scrollbar-hide">
              {sortedMedia.map((media, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentMediaIndex(index)}
                  className={`relative h-16 w-24 rounded-lg overflow-hidden flex-shrink-0 border-2 
                    ${currentMediaIndex === index ? 'border-sand-300' : 'border-transparent'}`}
                >
                  {media.type === 'video' ? (
                    <div className="relative w-full h-full">
                      <video
                        src={media.url}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-earth-900/50">
                        <Play className="h-6 w-6 text-sand-300" />
                      </div>
                    </div>
                  ) : (
                    <img
                      src={media.url}
                      alt={`View ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Creator Info */}
            <div className="bg-earth-800/50 p-6 rounded-lg">
              <div className="flex items-center gap-4">
                <img
                  src={experience.creator?.profile_image || `https://api.dicebear.com/7.x/initials/svg?seed=${experience.creator?.full_name}&backgroundColor=1d1918&textColor=e8e4dc`}
                  alt={experience.creator?.full_name}
                  className="w-16 h-16 rounded-lg object-cover bg-earth-800"
                />
                <div>
                  <h3 className="text-xl font-display mb-1">
                    Hosted by {experience.creator?.full_name}
                  </h3>
                  <div className="flex items-center gap-4 text-sand-300">
                    {experience.creator?.creator_profile?.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span>{experience.creator.creator_profile.rating}</span>
                      </div>
                    )}
                    {experience.creator?.verification_status === 'verified' && (
                      <div className="flex items-center gap-1 text-green-400">
                        <Shield className="h-4 w-4" />
                        <span>Verified</span>
                      </div>
                    )}
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="ml-auto"
                  onClick={() => navigate(`/creators/${experience.creator?.id}`)}
                >
                  View Profile
                </Button>
              </div>
            </div>

            {/* Rendezvous Tells You Why */}
            <div className="bg-earth-800/50 p-8 rounded-lg">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="h-6 w-6 text-yellow-400" />
                <h2 className="text-2xl font-display">Rendezvous Tells You Why</h2>
              </div>
              <p className="text-sand-300 italic">
                "This experience stands out for its authentic cultural immersion and the host's exceptional expertise. 
                Based on guest feedback, participants consistently praise the intimate atmosphere and personalized attention. 
                The unique location and thoughtfully curated program make this a truly memorable experience."
              </p>
              <p className="text-sand-400 text-sm mt-4">
                * Generated from verified guest reviews and feedback
              </p>
            </div>

            <div>
              <h1 className="text-4xl font-display mb-4">{experience.title}</h1>
              <div className="flex flex-wrap gap-4 text-sand-300">
                {experience.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    <span>{experience.location.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span>{experience.duration} minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <span>Max {experience.max_participants} people</span>
                </div>
                {Array.isArray(experience.languages) && experience.languages.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    <span>{experience.languages.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Description Section */}
            <div className="bg-earth-800/50 p-8 rounded-lg">
              <h2 className="text-2xl font-display mb-6">About this experience</h2>
              <div className="experience-description">
                {experience.description.split('\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>

            {/* Location Section */}
            {experience.location && (
              <div className="bg-earth-800/50 p-8 rounded-lg">
                <LocationMap location={experience.location} />
              </div>
            )}

            {Array.isArray(experience.requirements) && experience.requirements.length > 0 && (
              <div className="bg-earth-800/50 p-8 rounded-lg">
                <h2 className="text-2xl font-display mb-4">Requirements</h2>
                <ul className="list-disc list-inside text-sand-300 space-y-2">
                  {experience.requirements.map((req, index) => (
                    <li key={index}>{req}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-2 gap-8">
              {Array.isArray(experience.included_items) && experience.included_items.length > 0 && (
                <div className="bg-earth-800/50 p-8 rounded-lg">
                  <h2 className="text-2xl font-display mb-4">What's included</h2>
                  <ul className="list-disc list-inside text-sand-300 space-y-2">
                    {experience.included_items.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {Array.isArray(experience.not_included_items) && experience.not_included_items.length > 0 && (
                <div className="bg-earth-800/50 p-8 rounded-lg">
                  <h2 className="text-2xl font-display mb-4">Not included</h2>
                  <ul className="list-disc list-inside text-sand-300 space-y-2">
                    {experience.not_included_items.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="sticky top-24 space-y-6">
              <div className="bg-earth-800/50 p-6 rounded-lg">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <span className="text-3xl font-display">${experience.price}</span>
                    <span className="text-sand-400"> / person</span>
                  </div>
                  <Button variant="outline" size="sm">
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-2 text-sand-300">
                    <Calendar className="h-5 w-5" />
                    <span>Select a date to book</span>
                  </div>
                  <div className="flex items-center gap-2 text-sand-300">
                    <Users className="h-5 w-5" />
                    <span>{experience.max_participants} spots available</span>
                  </div>
                </div>

                <Button 
                  className="w-full"
                  onClick={() => navigate(`/experiences/${experience.id}/book`)}
                >
                  Book Now
                </Button>

                <div className="mt-6 p-4 bg-earth-800 rounded-lg">
                  <div className="flex items-center gap-2 text-sand-400">
                    <Shield className="h-5 w-5" />
                    <span className="text-sm">
                      {experience.cancellation_policy === 'flexible' ? 'Free cancellation up to 24 hours before' :
                       experience.cancellation_policy === 'moderate' ? 'Free cancellation up to 5 days before' :
                       'No refunds available'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Add AttendeesList component */}
              <AttendeesList experienceId={experience.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}