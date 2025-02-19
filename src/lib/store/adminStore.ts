import { create } from 'zustand';
import { supabase } from '../supabase/client';
import type { User, Experience } from '@/types';

interface AdminState {
  users: User[];
  experiences: Experience[];
  adminActions: any[];
  loading: boolean;
  error: string | null;
}

interface AdminStore extends AdminState {
  fetchUsers: () => Promise<void>;
  fetchExperiences: () => Promise<void>;
  fetchAdminActions: () => Promise<void>;
  updateUserRole: (userId: string, newRole: 'user' | 'creator' | 'admin') => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  deleteExperience: (experienceId: string) => Promise<void>;
  clearError: () => void;
}

export const useAdminStore = create<AdminStore>((set, get) => ({
  users: [],
  experiences: [],
  adminActions: [],
  loading: false,
  error: null,

  fetchUsers: async () => {
    try {
      set({ loading: true, error: null });

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ users: data || [], loading: false });
    } catch (error) {
      console.error('Failed to fetch users:', error);
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch users',
        users: []
      });
    }
  },

  fetchExperiences: async () => {
    try {
      set({ loading: true, error: null });

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
      set({ experiences: data || [], loading: false });
    } catch (error) {
      console.error('Failed to fetch experiences:', error);
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch experiences',
        experiences: []
      });
    }
  },

  fetchAdminActions: async () => {
    try {
      set({ loading: true, error: null });

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
      set({ adminActions: data || [], loading: false });
    } catch (error) {
      console.error('Failed to fetch admin actions:', error);
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch admin actions',
        adminActions: []
      });
    }
  },

  updateUserRole: async (userId: string, newRole: 'user' | 'creator' | 'admin') => {
    try {
      set({ loading: true, error: null });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.rpc('update_user_role', {
        user_id_param: userId,
        new_role: newRole,
        admin_id: user.id
      });

      if (error) throw error;

      // Refresh lists
      await Promise.all([
        get().fetchUsers(),
        get().fetchAdminActions()
      ]);

      set({ loading: false });
    } catch (error) {
      console.error('Failed to update user role:', error);
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to update user role' 
      });
    }
  },

  deleteUser: async (userId: string) => {
    try {
      set({ loading: true, error: null });

      const { error } = await supabase.rpc('delete_user_data', {
        user_id_param: userId
      });

      if (error) throw error;

      // Refresh lists
      await Promise.all([
        get().fetchUsers(),
        get().fetchAdminActions()
      ]);

      set({ loading: false });
    } catch (error) {
      console.error('Failed to delete user:', error);
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to delete user' 
      });
    }
  },

  deleteExperience: async (experienceId: string) => {
    try {
      set({ loading: true, error: null });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.rpc('delete_experience_rpc', {
        experience_id_param: experienceId,
        admin_id_param: user.id
      });

      if (error) throw error;

      // Refresh lists
      await Promise.all([
        get().fetchExperiences(),
        get().fetchAdminActions()
      ]);

      set({ loading: false });
    } catch (error) {
      console.error('Failed to delete experience:', error);
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to delete experience' 
      });
    }
  },

  clearError: () => set({ error: null })
}));