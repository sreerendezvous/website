import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Maximum number of retries for failed requests
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    fetch: async (...args) => {
      let retries = 0;
      
      while (retries < MAX_RETRIES) {
        try {
          const response = await fetch(...args);
          
          // Check if response is ok
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          return response;
        } catch (error) {
          retries++;
          console.warn(`Supabase fetch attempt ${retries} failed:`, error);
          
          // If we've reached max retries, throw the error
          if (retries === MAX_RETRIES) {
            console.error('Supabase fetch error after max retries:', error);
            throw error;
          }
          
          // Wait before retrying, with exponential backoff
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, retries - 1)));
        }
      }
      
      // This should never be reached due to the throw in the loop
      throw new Error('Failed to fetch after max retries');
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Add error handling for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    // Clear any cached data
    localStorage.removeItem('supabase.auth.token');
  }
});

// Add health check function
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('users').select('count').single();
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Supabase connection error:', error);
    return false;
  }
};