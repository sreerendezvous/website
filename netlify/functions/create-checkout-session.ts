import { Handler } from '@netlify/functions';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
    };
  }

  try {
    const { experienceId, quantity, date, userId, creatorId } = JSON.parse(event.body!);

    // Get experience details
    const { data: experience, error: expError } = await supabase
      .from('experiences')
      .select('*')
      .eq('id', experienceId)
      .single();

    if (expError || !experience) {
      throw new Error('Experience not found');
    }

    // Get creator details for the Stripe account
    const { data: creator, error: creatorError } = await supabase
      .from('creators')
      .select('stripe_account_id')
      .eq('id', creatorId)
      .single();

    if (creatorError || !creator?.stripe_account_id) {
      throw new Error('Creator Stripe account not found');
    }

    // Create a booking record
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        experience_id: experienceId,
        user_id: userId,
        participant_count: quantity,
        status: 'pending',
        payment_status: 'pending',
        total_amount: experience.price * quantity,
        special_requests: '',
      })
      .select()
      .single();

    if (bookingError) {
      throw new Error('Failed to create booking');
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: experience.title,
              description: experience.description,
            },
            unit_amount: Math.round(experience.price * 100), // Convert to cents
          },
          quantity,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.URL}/bookings?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.URL}/experiences/${experienceId}/book?canceled=true`,
      payment_intent_data: {
        application_fee_amount: Math.round(experience.price * quantity * 0.05 * 100), // 5% platform fee
        transfer_data: {
          destination: creator.stripe_account_id,
        },
      },
      metadata: {
        booking_id: booking.id,
        experience_id: experienceId,
        user_id: userId,
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ sessionId: session.id }),
    };
  } catch (error) {
    console.error('Checkout session error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to create checkout session' }),
    };
  }
};