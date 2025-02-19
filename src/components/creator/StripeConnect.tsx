import React from 'react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth';
import { CreditCard, CheckCircle, AlertCircle } from 'lucide-react';

export function StripeConnect() {
  const { user } = useAuth();
  const [isConnecting, setIsConnecting] = React.useState(false);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      const response = await fetch('/api/stripe/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
        }),
      });

      const data = await response.json();
      window.location.href = data.url;
    } catch (error) {
      console.error('Failed to initiate Stripe connection:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-earth-800/50 rounded-lg p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-12 w-12 rounded-full bg-sand-400/10 flex items-center justify-center">
            <CreditCard className="h-6 w-6 text-sand-400" />
          </div>
          <div>
            <h2 className="text-xl font-display">Payment Settings</h2>
            <p className="text-sand-400">Connect your Stripe account to receive payments</p>
          </div>
        </div>

        {user?.stripeAccountId ? (
          <div className="flex items-start gap-4 p-4 bg-green-500/10 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-400 font-medium">
                Your Stripe account is connected
              </p>
              <p className="text-sand-400 text-sm mt-1">
                You can now receive payments for your experiences
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => window.open('https://dashboard.stripe.com', '_blank')}
              >
                View Stripe Dashboard
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-start gap-4 p-4 bg-yellow-500/10 rounded-lg mb-6">
              <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-400 font-medium">
                  Stripe account not connected
                </p>
                <p className="text-sand-400 text-sm mt-1">
                  Connect your Stripe account to start receiving payments for your experiences
                </p>
              </div>
            </div>

            <Button
              onClick={handleConnect}
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Connect Stripe Account'}
            </Button>
          </div>
        )}
      </div>

      <div className="bg-earth-800/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
        <div className="space-y-4 text-sand-400">
          <p>
            • Payments are processed securely through Stripe
          </p>
          <p>
            • You'll receive payouts automatically to your connected bank account
          </p>
          <p>
            • Standard Stripe processing fees apply (2.9% + $0.30 per transaction)
          </p>
          <p>
            • Platform fee: 5% of the experience price
          </p>
        </div>
      </div>
    </div>
  );
}