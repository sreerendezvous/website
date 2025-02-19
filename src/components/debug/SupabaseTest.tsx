import React from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth';

export function SupabaseTest() {
  const { user } = useAuth();
  const [status, setStatus] = React.useState<'checking' | 'connected' | 'error'>('checking');
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function checkConnection() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const { error: healthCheck } = await supabase.from('users').select('count').single();
        
        if (healthCheck) {
          setStatus('error');
          setError(healthCheck.message);
          return;
        }

        setStatus('connected');
      } catch (err) {
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      }
    }

    checkConnection();
  }, []);

  return (
    <div className="fixed bottom-4 right-4 p-4 rounded-lg shadow-lg bg-earth-800 text-sand-100">
      <h3 className="text-lg font-semibold mb-2">Supabase Status</h3>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            status === 'checking' ? 'bg-yellow-500' :
            status === 'connected' ? 'bg-green-500' :
            'bg-red-500'
          }`} />
          <span className="capitalize">{status}</span>
        </div>
        {user && (
          <div className="text-sm text-sand-300">
            Logged in as: {user.email}
          </div>
        )}
        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}
      </div>
    </div>
  );
}