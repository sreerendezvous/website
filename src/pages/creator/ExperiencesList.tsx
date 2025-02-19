import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth';
import type { Experience } from '@/types';

// Mock data - replace with actual API call
const mockExperiences: Experience[] = [
  {
    id: '1',
    title: 'Mountain Hiking Adventure',
    description: 'Experience the thrill of mountain hiking...',
    price: 99.99,
    duration: 240,
    location: 'Rocky Mountains',
    category: 'Adventure',
    images: ['https://images.unsplash.com/photo-1551632811-561732d1e306'],
    maxParticipants: 10,
    creatorId: '1',
    status: 'approved',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // Add more mock experiences...
];

export function ExperiencesList() {
  const { user } = useAuth();

  if (!user || user.role !== 'creator') {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <p className="text-gray-400">You must be an approved creator to view this page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 bg-dark-100">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Experiences</h1>
          <Link to="/creator/experiences/new">
            <Button>
              <Plus className="h-5 w-5 mr-2" />
              Create Experience
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockExperiences.map((experience) => (
            <div
              key={experience.id}
              className="bg-dark-200 rounded-lg overflow-hidden group"
            >
              <div className="relative h-48">
                <img
                  src={experience.images[0]}
                  alt={experience.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-100/80 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-lg font-semibold truncate">{experience.title}</h3>
                  <p className="text-sm text-gray-300">{experience.category}</p>
                </div>
              </div>

              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">${experience.price}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    experience.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                    experience.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {experience.status.charAt(0).toUpperCase() + experience.status.slice(1)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" size="sm">
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-500 hover:text-red-400">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}