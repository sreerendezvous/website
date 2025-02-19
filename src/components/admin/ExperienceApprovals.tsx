import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Users, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { adminService } from '@/lib/services/admin';
import { useStore } from '@/lib/store';
import type { Experience } from '@/types';

export function ExperienceApprovals() {
  const navigate = useNavigate();
  const { experiences, loading, error, fetchExperiences } = useStore();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchExperiences(true); // Force refresh on mount
  }, [fetchExperiences]);

  const handleDelete = async (experienceId: string) => {
    if (window.confirm('Are you sure you want to delete this experience? This action cannot be undone.')) {
      try {
        setIsDeleting(true);
        await adminService.deleteExperience(experienceId);
        await fetchExperiences(true); // Force refresh after deletion
      } catch (error) {
        console.error('Failed to delete experience:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const filteredExperiences = experiences.filter(experience => {
    if (filter === 'all') return true;
    return experience.status === filter;
  });

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-sand-400">Loading experiences...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">{error}</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => fetchExperiences(true)}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-4 mb-6">
        <Button
          variant={filter === 'all' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All Experiences
        </Button>
        <Button
          variant={filter === 'pending' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('pending')}
        >
          Pending
        </Button>
        <Button
          variant={filter === 'approved' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('approved')}
        >
          Approved
        </Button>
        <Button
          variant={filter === 'rejected' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('rejected')}
        >
          Rejected
        </Button>
      </div>

      {filteredExperiences.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sand-400">No experiences found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredExperiences.map((experience) => (
            <motion.div
              key={experience.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-earth-800/50 rounded-lg overflow-hidden"
            >
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/3">
                  <img
                    src={experience.media?.[0]?.url || 'https://via.placeholder.com/400x300'}
                    alt={experience.title}
                    className="w-full h-48 object-cover"
                  />
                </div>
                <div className="p-6 md:w-2/3">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-sand-100 mb-2">{experience.title}</h3>
                      <p className="text-sand-400">{experience.description}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm ${
                      experience.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                      experience.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {experience.status.charAt(0).toUpperCase() + experience.status.slice(1)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="flex items-center gap-2 text-sand-300">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(experience.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sand-300">
                      <Clock className="h-4 w-4" />
                      <span>{experience.duration} minutes</span>
                    </div>
                    <div className="flex items-center gap-2 text-sand-300">
                      <MapPin className="h-4 w-4" />
                      <span>{experience.location?.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sand-300">
                      <Users className="h-4 w-4" />
                      <span>Max {experience.max_participants}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-sand-400">Total Price</p>
                      <p className="text-xl font-semibold text-sand-100">
                        ${experience.price}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:text-red-400"
                      onClick={() => handleDelete(experience.id)}
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Deleting...' : 'Delete Experience'}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}