import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { getStripe } from '@/lib/stripe';
import { useAuth } from '@/lib/auth';
import type { Experience } from '@/types';

interface CheckoutButtonProps {
  experience: Experience;
  quantity: number;
  date: string;
  className?: string;
}

export function CheckoutButton({ experience, quantity, date, className }: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCheckout = async () => {
    try {
      setIsLoading(true);
      const stripe = await getStripe();

      if (!stripe) {
        throw new Error('Payment system is currently unavailable');
      }

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Create a checkout session
      const response = await fetch('/.netlify/functions/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          experienceId: experience.id,
          quantity,
          date,
          userId: user.id,
          creatorId: experience.creator_id,
        }),
      });

      const { sessionId } = await response.json();

      // Redirect to Stripe Checkout
      const result = await stripe.redirectToCheckout({
        sessionId,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      // Handle error appropriately
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      className={className}
      onClick={handleCheckout}
      disabled={isLoading}
    >
      {isLoading ? 'Processing...' : `Book for $${experience.price * quantity}`}
    </Button>
  );
}