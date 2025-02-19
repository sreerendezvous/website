import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth';
import { AuthModal } from '@/components/auth/AuthModal';
import { supabase } from '@/lib/supabase/client';
import type { Experience } from '@/types';

interface BookingButtonProps {
  experience: Experience;
  quantity: number;
  date: string;
  className?: string;
}

export function BookingButton({ experience, quantity, date, className }: BookingButtonProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const handleBooking = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      setIsSubmitting(true);

      if (experience.booking_type === 'instant') {
        // Redirect to checkout for instant bookings
        const response = await fetch('/.netlify/functions/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            experienceId: experience.id,
            quantity,
            date,
            userId: user.id,
            creatorId: experience.creator_id,
          }),
        });

        const { sessionId } = await response.json();
        const stripe = await import('@stripe/stripe-js').then(m => m.loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY));
        await stripe?.redirectToCheckout({ sessionId });
      } else {
        // Create booking request for request-to-join
        const { error } = await supabase
          .from('booking_requests')
          .insert({
            experience_id: experience.id,
            user_id: user.id,
            status: 'pending',
            participant_count: quantity,
            total_amount: experience.price * quantity,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (error) throw error;

        // Show success message or redirect to confirmation page
        // You can implement this based on your UI requirements
      }
    } catch (error) {
      console.error('Booking error:', error);
      // Handle error appropriately
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        className={className}
        onClick={handleBooking}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Processing...' : 
          experience.booking_type === 'instant' ? 
            `Book for $${experience.price * quantity}` : 
            'Request to Join'}
      </Button>

      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultTab="sign-up"
        redirectTo={`/experiences/${experience.id}/book`}
      />
    </>
  );
}