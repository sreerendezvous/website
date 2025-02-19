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
  const sig = event.headers['stripe-signature']!;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  try {
    const stripeEvent = stripe.webhooks.constructEvent(
      event.body!,
      sig,
      webhookSecret
    );

    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object as Stripe.Checkout.Session;
        
        // Update booking status
        await supabase
          .from('bookings')
          .update({
            status: 'confirmed',
            payment_status: 'paid',
            stripe_payment_intent_id: session.payment_intent as string,
          })
          .eq('id', session.metadata?.booking_id);

        break;
      }

      case 'charge.refunded': {
        const charge = stripeEvent.data.object as Stripe.Charge;
        
        await supabase
          .from('bookings')
          .update({
            status: 'cancelled',
            payment_status: 'refunded',
          })
          .eq('stripe_payment_intent_id', charge.payment_intent);

        break;
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };
  } catch (error) {
    console.error('Webhook error:', error);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Webhook error' }),
    };
  }
};