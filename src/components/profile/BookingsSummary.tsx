import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/lib/store';
import { useAuth } from '@/lib/auth';

export function BookingsSummary() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { bookings, experiences } = useStore();

  const userBookings = bookings.filter(booking => booking.userId === user?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3); // Show only the 3 most recent bookings

  return (
    <div className="bg-earth-800/50 p-6 rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-display">Recent Bookings</h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate('/bookings')}
        >
          View All
        </Button>
      </div>

      {userBookings.length > 0 ? (
        <div className="space-y-4">
          {userBookings.map((booking) => {
            const experience = experiences.find(exp => exp.id === booking.experienceId);
            if (!experience) return null;

            return (
              <div 
                key={booking.id}
                className="flex items-start gap-4 p-4 bg-earth-800 rounded-lg"
              >
                <img
                  src={experience.images[0]}
                  alt={experience.title}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="font-medium text-sand-100 mb-2">{experience.title}</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm text-sand-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(booking.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{experience.duration} min</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-sand-400 mt-1">
                    <MapPin className="h-4 w-4" />
                    <span>{experience.location}</span>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs ${
                  booking.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                  booking.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-sand-400 mb-4">No bookings yet</p>
          <Button onClick={() => navigate('/experiences')}>
            Explore Experiences
          </Button>
        </div>
      )}
    </div>
  );
}