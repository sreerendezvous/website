import { supabase } from '../supabase/client';
import { AUTH_ERRORS } from '../supabase/auth/config';
import type { User } from '@/types';

export const authService = {
  async signUp(email: string, password: string): Promise<void> {
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error(AUTH_ERRORS.UNKNOWN);

      // The trigger will handle user profile creation
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  },

  async signIn(email: string, password: string): Promise<User> {
    try {
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) throw signInError;
      if (!authData.user) throw new Error(AUTH_ERRORS.INVALID_CREDENTIALS);

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile) throw new Error(AUTH_ERRORS.PROFILE_NOT_FOUND);

      return profile;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  },

  async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }
};