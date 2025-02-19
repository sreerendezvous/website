import { supabase } from '../supabase/client';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function handleStripeWebhook(event: Stripe.Event) {
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Update booking status
        await supabase
          .from('bookings')
          .update({
            status: 'confirmed',
            payment_status: 'paid',
            stripe_payment_intent_id: session.payment_intent as string
          })
          .eq('id', session.metadata?.booking_id);

        // Update availability
        await supabase.rpc('increment_availability_bookings', {
          availability_id: session.metadata?.availability_id
        });

        break;
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        
        // Update creator's Stripe account status
        await supabase
          .from('experience_creators')
          .update({
            stripe_account_status: {
              charges_enabled: account.charges_enabled,
              payouts_enabled: account.payouts_enabled,
              requirements: account.requirements
            }
          })
          .eq('stripe_account_id', account.id);

        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        
        // Update booking payment status
        await supabase
          .from('bookings')
          .update({
            payment_status: 'refunded'
          })
          .eq('stripe_payment_intent_id', charge.payment_intent);

        break;
      }
    }
  } catch (error) {
    console.error('Webhook error:', error);
    throw error;
  }
}