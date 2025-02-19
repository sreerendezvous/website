import { supabase } from '../client';
import type { User } from '@/types';

class UserService {
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          creator_profile:creator_profiles(*)
        `)
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting current user:', error);
      throw error;
    }
  }

  async createProfile(userData: Partial<User>): Promise<User> {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  async updateProfile(userId: string, data: Partial<User>): Promise<User> {
    try {
      const { data: updatedUser, error } = await supabase
        .from('users')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select(`
          *,
          creator_profile:creator_profiles(*)
        `)
        .single();

      if (error) throw error;
      return updatedUser;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }
}

export const userService = new UserService();