import React from 'react';
import { Users, Shield } from 'lucide-react';
import { useStore } from '@/lib/store';
import type { Booking } from '@/types';

interface AttendeesListProps {
  experienceId: string;
  className?: string;
}

export function AttendeesList({ experienceId, className }: AttendeesListProps) {
  const { bookings, loading, error } = useStore();

  // Get confirmed bookings for this experience
  const confirmedBookings = bookings.filter(
    booking => booking.experience_id === experienceId && booking.status === 'confirmed'
  );

  // Calculate total attendees
  const totalAttendees = confirmedBookings.reduce(
    (sum, booking) => sum + (booking.participant_count || 1), 
    0
  );

  if (loading) {
    return (
      <div className={`${className} animate-pulse`}>
        <div className="h-32 bg-earth-800/50 rounded-lg"></div>
      </div>
    );
  }

  if (error) {
    return null;
  }

  if (confirmedBookings.length === 0) {
    return (
      <div className={`${className} bg-earth-800/50 p-6 rounded-lg`}>
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-sand-400" />
          <h3 className="text-lg font-display">Who's Attending</h3>
        </div>
        <p className="text-sand-400 text-sm">
          Be the first to join this experience!
        </p>
      </div>
    );
  }

  return (
    <div className={`${className} bg-earth-800/50 p-6 rounded-lg`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-sand-400" />
          <h3 className="text-lg font-display">Who's Attending</h3>
        </div>
        <span className="text-sm text-sand-400">
          {totalAttendees} {totalAttendees === 1 ? 'person' : 'people'} attending
        </span>
      </div>

      <div className="space-y-4">
        {/* Attendee Avatars */}
        <div className="flex -space-x-2">
          {confirmedBookings.slice(0, 5).map((booking, index) => (
            <div 
              key={booking.id}
              className="relative"
              style={{ zIndex: 5 - index }}
            >
              <img
                src={booking.user?.profile_image || `https://api.dicebear.com/7.x/initials/svg?seed=${booking.user?.full_name}`}
                alt={booking.user?.full_name}
                className="w-10 h-10 rounded-full border-2 border-earth-800 bg-earth-700"
              />
              {booking.user?.verification_status === 'verified' && (
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5">
                  <Shield className="h-3 w-3 text-earth-900" />
                </div>
              )}
            </div>
          ))}
          {confirmedBookings.length > 5 && (
            <div className="w-10 h-10 rounded-full border-2 border-earth-800 bg-earth-700 flex items-center justify-center">
              <span className="text-xs text-sand-300">
                +{confirmedBookings.length - 5}
              </span>
            </div>
          )}
        </div>

        {/* Recent Bookings */}
        <div className="space-y-3">
          {confirmedBookings.slice(0, 3).map((booking) => (
            <div key={booking.id} className="flex items-center gap-3">
              <img
                src={booking.user?.profile_image || `https://api.dicebear.com/7.x/initials/svg?seed=${booking.user?.full_name}`}
                alt={booking.user?.full_name}
                className="w-8 h-8 rounded-full bg-earth-700"
              />
              <div className="flex-1">
                <p className="text-sm text-sand-100">
                  {booking.user?.full_name}
                  {booking.participant_count > 1 && (
                    <span className="text-sand-400">
                      {' '}+{booking.participant_count - 1} {booking.participant_count - 1 === 1 ? 'guest' : 'guests'}
                    </span>
                  )}
                </p>
                <p className="text-xs text-sand-400">
                  Booked {new Date(booking.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}