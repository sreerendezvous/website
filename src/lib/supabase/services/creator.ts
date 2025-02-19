import { supabase } from '../client';
import type { CreatorProfile, User } from '@/types';

class CreatorService {
  async getProfile(userId: string): Promise<CreatorProfile | null> {
    try {
      const { data, error } = await supabase
        .from('creator_profiles')
        .select(`
          *,
          user:user_id (
            id,
            full_name,
            bio,
            email,
            role,
            status
          )
        `)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No profile found
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching creator profile:', error);
      throw error;
    }
  }

  async updateProfile(userId: string, data: Partial<CreatorProfile>): Promise<CreatorProfile> {
    try {
      // First update the user bio if provided
      if (data.bio !== undefined) {
        const { error: userError } = await supabase
          .from('users')
          .update({
            bio: data.bio,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (userError) throw userError;
      }

      // Use the secure RPC function to update the profile
      const { data: profile, error: profileError } = await supabase
        .rpc('update_creator_profile', {
          creator_id: userId,
          business_name: data.business_name || '',
          languages: Array.isArray(data.languages) ? data.languages : ['English'],
          specialties: Array.isArray(data.specialties) ? data.specialties : [],
          social_links: data.social_links || {},
          cover_image: data.cover_image || null,
          profile_image: data.profile_image || null
        });

      if (profileError) throw profileError;

      return profile;
    } catch (error) {
      console.error('Error updating creator profile:', error);
      throw error;
    }
  }

  async getExperiences(creatorId: string) {
    try {
      const { data, error } = await supabase
        .from('experiences')
        .select(`
          *,
          media:experience_media (
            url,
            type,
            order_index
          ),
          category:categories (
            id,
            name,
            icon
          )
        `)
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching creator experiences:', error);
      throw error;
    }
  }

  async getReviews(creatorId: string) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          user:users!user_id (
            id,
            full_name,
            profile_image
          )
        `)
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching creator reviews:', error);
      throw error;
    }
  }
}

export const creatorService = new CreatorService();