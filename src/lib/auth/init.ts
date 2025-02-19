import { supabase } from '../supabase/client';
import { useAuth } from './store';
import { useStore } from '../store';

export const initAuth = async () => {
  try {
    // Get the initial session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;

    if (session?.user) {
      // Get user profile from database
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profile) {
        useAuth.setState({ 
          user: profile,
          loading: false,
          error: null
        });
        
        // Fetch store data after successful auth
        const store = useStore.getState();
        await Promise.all([
          store.fetchExperiences(true),
          store.fetchCreators(true)
        ]);
      } else {
        useAuth.setState({ 
          loading: false,
          error: profileError ? profileError.message : 'User profile not found'
        });
      }
    } else {
      useAuth.setState({ loading: false });
    }

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileError) throw profileError;
        
        if (profile) {
          useAuth.setState({ user: profile });
          // Fetch store data after sign in
          const store = useStore.getState();
          await Promise.all([
            store.fetchExperiences(true),
            store.fetchCreators(true)
          ]);
        }
      } else if (event === 'SIGNED_OUT') {
        useAuth.setState({ user: null });
        useStore.getState().reset();
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  } catch (error) {
    console.error('Auth initialization error:', error);
    useAuth.setState({ 
      loading: false,
      error: error instanceof Error ? error.message : 'Failed to initialize auth'
    });
  }
};