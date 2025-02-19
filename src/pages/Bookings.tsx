import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Users, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';

export function Bookings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { bookings, fetchUserBookings } = useStore();
  const [filter, setFilter] = React.useState<'all' | 'upcoming' | 'past' | 'cancelled'>('all');

  useEffect(() => {
    if (user?.id) {
      fetchUserBookings(user.id);
    }
  }, [user?.id, fetchUserBookings]);

  if (!user) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <p className="text-sand-400">Please sign in to view your bookings</p>
      </div>
    );
  }

  const filteredBookings = bookings.filter(booking => {
    const bookingDate = new Date(booking.created_at);
    const now = new Date();

    switch (filter) {
      case 'upcoming':
        return bookingDate > now && booking.status !== 'cancelled';
      case 'past':
        return bookingDate < now && booking.status !== 'cancelled';
      case 'cancelled':
        return booking.status === 'cancelled';
      default:
        return true;
    }
  });

  return (
    <div className="min-h-screen pt-20 pb-12 bg-earth-900">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/profile')}
                className="mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Profile
              </Button>
              <h1 className="text-3xl font-display">My Bookings</h1>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button
                variant={filter === 'upcoming' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilter('upcoming')}
              >
                Upcoming
              </Button>
              <Button
                variant={filter === 'past' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilter('past')}
              >
                Past
              </Button>
              <Button
                variant={filter === 'cancelled' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilter('cancelled')}
              >
                Cancelled
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            {filteredBookings.map((booking) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-earth-800/50 rounded-lg overflow-hidden"
              >
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/3">
                    <img
                      src={booking.experience?.media?.[0]?.url || 'https://via.placeholder.com/400x300'}
                      alt={booking.experience?.title}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                  <div className="p-6 md:w-2/3">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-sand-100 mb-2">
                          {booking.experience?.title}
                        </h3>
                        <p className="text-sand-400">{booking.experience?.description}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm ${
                        booking.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                        booking.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="flex items-center gap-2 text-sand-300">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(booking.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sand-300">
                        <Clock className="h-4 w-4" />
                        <span>{booking.experience?.duration} minutes</span>
                      </div>
                      <div className="flex items-center gap-2 text-sand-300">
                        <MapPin className="h-4 w-4" />
                        <span>{booking.experience?.location?.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sand-300">
                        <Users className="h-4 w-4" />
                        <span>{booking.participant_count} participants</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-sand-400">Total Price</p>
                        <p className="text-xl font-semibold text-sand-100">
                          ${booking.total_amount}
                        </p>
                      </div>
                      {booking.status === 'pending' && (
                        <Button
                          variant="outline"
                          className="text-red-500 hover:text-red-400"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to cancel this booking?')) {
                              useStore.getState().cancelBooking(booking.id);
                            }
                          }}
                        >
                          Cancel Booking
                        </Button>
                      )}
                    </div>

                    {booking.status === 'confirmed' && (
                      <div className="mt-4 flex items-start gap-2 p-3 bg-sand-400/10 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-sand-400 flex-shrink-0" />
                        <p className="text-sm text-sand-300">
                          Your booking is confirmed! Please arrive 15 minutes before the scheduled time.
                          The meeting point details will be sent to your email.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {filteredBookings.length === 0 && (
              <div className="text-center py-12">
                <p className="text-sand-400 mb-4">No bookings found</p>
                <Button onClick={() => navigate('/experiences')}>
                  Explore Experiences
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}