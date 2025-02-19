import React from 'react';
import { useStore } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Calendar, Clock, MapPin, AlertCircle } from 'lucide-react';

export function Bookings() {
  const { user } = useAuth();
  const { bookings, experiences, cancelBooking } = useStore();

  if (!user) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <p className="text-gray-400">Please sign in to view your bookings</p>
      </div>
    );
  }

  const userBookings = bookings.filter((booking) => booking.userId === user.id);

  return (
    <div className="min-h-screen pt-20 pb-12 bg-dark-100">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">My Bookings</h1>

        <div className="space-y-6">
          {userBookings.map((booking) => {
            const experience = experiences.find((exp) => exp.id === booking.experienceId);
            if (!experience) return null;

            return (
              <div key={booking.id} className="bg-dark-200 rounded-lg overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/3">
                    <img
                      src={experience.images[0]}
                      alt={experience.title}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                  <div className="p-6 md:w-2/3">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{experience.title}</h3>
                        <p className="text-gray-400">{experience.description}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm ${
                        booking.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                        booking.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        booking.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Calendar className="h-5 w-5" />
                        <span>{new Date(booking.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <Clock className="h-5 w-5" />
                        <span>{experience.duration} minutes</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <MapPin className="h-5 w-5" />
                        <span>{experience.location}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-400">Total Price</p>
                        <p className="text-xl font-semibold">${booking.totalPrice}</p>
                      </div>
                      {booking.status === 'pending' && (
                        <Button
                          variant="outline"
                          className="text-red-500 hover:text-red-400"
                          onClick={() => cancelBooking(booking.id)}
                        >
                          Cancel Booking
                        </Button>
                      )}
                    </div>

                    {booking.status === 'confirmed' && (
                      <div className="mt-4 flex items-start gap-2 p-3 bg-primary-500/10 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-primary-500 flex-shrink-0" />
                        <p className="text-sm text-primary-300">
                          Your booking is confirmed! Please arrive 15 minutes before the scheduled time.
                          The meeting point details will be sent to your email.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {userBookings.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">You haven't made any bookings yet</p>
              <Button onClick={() => navigate('/experiences')}>
                Explore Experiences
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}