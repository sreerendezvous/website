import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MapPin, Award, Calendar, MessageSquare, Shield, ExternalLink, Globe, Instagram, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { ExperienceCard } from '@/components/experiences/ExperienceCard';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { useStore } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { useMessageStore } from '@/lib/store/messageStore';
import { AuthModal } from '@/components/auth/AuthModal';

export function CreatorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startConversation } = useMessageStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const { fetchCreator } = useStore();
  const [creator, setCreator] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCreator = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchCreator(id!);
        setCreator(data);
      } catch (err) {
        console.error('Error loading creator:', err);
        setError(err instanceof Error ? err.message : 'Failed to load creator profile');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadCreator();
    }
  }, [id, fetchCreator]);

  const handleMessageClick = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      setIsStartingChat(true);
      const conversationId = await startConversation(creator.id);
      navigate(`/messages/${conversationId}`);
    } catch (error) {
      console.error('Failed to start conversation:', error);
    } finally {
      setIsStartingChat(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <p className="text-sand-400">Loading...</p>
      </div>
    );
  }

  if (error || !creator) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <p className="text-sand-400">{error || 'Creator not found'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 bg-earth-900">
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <div className="relative mb-24 md:mb-8">
          <div className="h-48 md:h-64 w-full bg-gradient-to-r from-earth-800 to-earth-700 rounded-lg overflow-hidden">
            {creator.creator_profile?.cover_image && (
              <img 
                src={creator.creator_profile.cover_image} 
                alt={creator.full_name} 
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-earth-900/80 to-transparent" />
          </div>
          
          <div className="absolute -bottom-16 left-0 right-0 px-4 md:px-8">
            <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6">
              <img
                src={creator.profile_image || `https://api.dicebear.com/7.x/initials/svg?seed=${creator.full_name}&backgroundColor=1d1918&textColor=e8e4dc`}
                alt={creator.full_name}
                className="w-32 h-32 rounded-lg border-4 border-earth-900 object-cover bg-earth-800"
              />
              <div className="flex-1">
                <h1 className="text-3xl font-display mb-2">
                  {creator.creator_profile?.business_name || creator.full_name}
                </h1>
                <div className="flex flex-wrap items-center gap-4">
                  {creator.creator_profile?.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 text-yellow-400 fill-current" />
                      <span className="font-medium">{creator.creator_profile.rating}</span>
                      <span className="text-sand-400">
                        ({creator.creator_profile.reviews_count || 0} reviews)
                      </span>
                    </div>
                  )}
                  {creator.verification_status === 'verified' && (
                    <div className="flex items-center gap-1 text-green-400">
                      <Shield className="h-5 w-5" />
                      <span>Verified Creator</span>
                    </div>
                  )}
                </div>
              </div>
              {/* Message Button - Only show if not own profile */}
              {user?.id !== creator.id && (
                <Button 
                  onClick={handleMessageClick}
                  disabled={isStartingChat}
                  className="w-full md:w-auto"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {isStartingChat ? 'Starting Chat...' : 'Message'}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-24 md:mt-16">
          {/* Sidebar */}
          <div className="space-y-6">
            {/* About */}
            <motion.div
              className="bg-earth-800/50 p-6 rounded-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-xl font-display mb-4">About</h2>
              <p className="text-sand-300 mb-6">{creator.bio}</p>
              
              {creator.creator_profile?.languages && creator.creator_profile.languages.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-sand-300 mb-2">Languages</h3>
                  <div className="flex flex-wrap gap-2">
                    {creator.creator_profile.languages.map((lang: string) => (
                      <span
                        key={lang}
                        className="px-2 py-1 bg-earth-700/50 rounded-full text-sm text-sand-300"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {creator.creator_profile?.specialties && creator.creator_profile.specialties.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-sand-300 mb-2">Specialties</h3>
                  <div className="flex flex-wrap gap-2">
                    {creator.creator_profile.specialties.map((specialty: string) => (
                      <span
                        key={specialty}
                        className="px-2 py-1 bg-earth-700/50 rounded-full text-sm text-sand-300"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Social Links */}
            {(creator.creator_profile?.social_links?.website || 
              creator.creator_profile?.social_links?.instagram || 
              creator.creator_profile?.social_links?.linkedin) && (
              <motion.div
                className="bg-earth-800/50 p-6 rounded-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-xl font-display mb-4">Connect</h2>
                <div className="space-y-3">
                  {creator.creator_profile?.social_links?.instagram && (
                    <a
                      href={`https://instagram.com/${creator.creator_profile.social_links.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sand-300 hover:text-sand-200 transition-colors"
                    >
                      <Instagram className="h-5 w-5" />
                      <span>Instagram</span>
                      <ExternalLink className="h-4 w-4 ml-auto" />
                    </a>
                  )}
                  {creator.creator_profile?.social_links?.website && (
                    <a
                      href={creator.creator_profile.social_links.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sand-300 hover:text-sand-200 transition-colors"
                    >
                      <Globe className="h-5 w-5" />
                      <span>Website</span>
                      <ExternalLink className="h-4 w-4 ml-auto" />
                    </a>
                  )}
                  {creator.creator_profile?.social_links?.linkedin && (
                    <a
                      href={creator.creator_profile.social_links.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sand-300 hover:text-sand-200 transition-colors"
                    >
                      <Linkedin className="h-5 w-5" />
                      <span>LinkedIn</span>
                      <ExternalLink className="h-4 w-4 ml-auto" />
                    </a>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="experiences" className="space-y-6">
              <TabsList>
                <TabsTrigger value="experiences">Experiences</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="experiences">
                {creator.creator_profile?.experiences?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {creator.creator_profile.experiences.map((experience: any) => (
                      <ExperienceCard key={experience.id} experience={experience} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-sand-400">No experiences yet</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="reviews">
                {creator.creator_profile?.reviews?.length > 0 ? (
                  <div className="space-y-6">
                    {creator.creator_profile.reviews.map((review: any) => (
                      <ReviewCard key={review.id} review={review} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-sand-400">No reviews yet</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultTab="sign-in"
      />
    </div>
  );
}