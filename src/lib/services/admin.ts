import { supabase } from '../supabase/client';
import type { User, Experience } from '@/types';

class AdminService {
  async getUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  async getExperiences() {
    try {
      const { data, error } = await supabase
        .from('experiences')
        .select(`
          *,
          creator:creator_id (
            id,
            full_name,
            email,
            bio
          ),
          category:categories (
            name,
            icon
          ),
          media:experience_media (
            url,
            type,
            order_index
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching experiences:', error);
      throw error;
    }
  }

  async getAdminActions() {
    try {
      const { data, error } = await supabase
        .from('admin_actions')
        .select(`
          *,
          admin:admin_id (
            full_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching admin actions:', error);
      throw error;
    }
  }

  async updateUserRole(userId: string, newRole: 'user' | 'creator' | 'admin') {
    try {
      const { error } = await supabase.rpc('update_user_role', {
        user_id_param: userId,
        new_role: newRole
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  async deleteUser(userId: string) {
    try {
      const { error: deleteError } = await supabase.rpc('delete_user_data', {
        user_id_param: userId
      });

      if (deleteError) throw deleteError;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  async deleteExperience(experienceId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.rpc('delete_experience_rpc', {
        experience_id_param: experienceId,
        admin_id_param: user.id
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting experience:', error);
      throw error;
    }
  }
}

export const adminService = new AdminService();