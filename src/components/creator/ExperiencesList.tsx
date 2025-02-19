import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth';
import { useStore } from '@/lib/store';

export function ExperiencesList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { experiences } = useStore();

  const creatorExperiences = experiences.filter(exp => exp.creator_id === user?.id);

  // Helper function to get the first image URL from media array
  const getFirstImageUrl = (experience: any) => {
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

  // Helper function to get fallback profile image URL
  const getFallbackImageUrl = (name: string) => {
    return `https://api.dicebear.com/7.x/initials/svg?seed=${name}&backgroundColor=1d1918&textColor=e8e4dc`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-display">My Experiences</h2>
        <Button onClick={() => navigate('/creator/experiences/new')}>
          <Plus className="h-5 w-5 mr-2" />
          Create Experience
        </Button>
      </div>

      {creatorExperiences.length === 0 ? (
        <div className="text-center py-12 bg-earth-800/50 rounded-lg">
          <h3 className="text-xl font-display mb-4">Create Your First Experience</h3>
          <p className="text-sand-400 mb-6">
            Share your passion with others by creating unique and memorable experiences.
          </p>
          <Button onClick={() => navigate('/creator/experiences/new')}>
            Get Started
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {creatorExperiences.map((experience) => (
            <div
              key={experience.id}
              className="bg-earth-800/50 rounded-lg overflow-hidden group"
            >
              <div className="relative h-48">
                <img
                  src={getFirstImageUrl(experience)}
                  alt={experience.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-earth-900/80 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-lg font-semibold text-sand-100 truncate">{experience.title}</h3>
                  <p className="text-sm text-sand-300">{experience.category?.name}</p>
                </div>
              </div>

              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold text-sand-100">${experience.price}</span>
                  <div className={`px-2 py-1 rounded-full text-xs ${
                    experience.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                    experience.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {experience.status.charAt(0).toUpperCase() + experience.status.slice(1)}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/creator/experiences/${experience.id}/edit`);
                    }}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/experiences/${experience.id}`);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}