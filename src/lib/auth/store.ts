import { create } from 'zustand';
import { authService } from './service';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

interface AuthStore extends AuthState {
  signUp: (email: string, password: string, userData?: Partial<User>) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  completeProfile: (data: Partial<User>) => Promise<void>;
  setUser: (user: User | null) => void;
  clearError: () => void;
}

export const useAuth = create<AuthStore>((set, get) => ({
  user: null,
  loading: false,
  error: null,

  signUp: async (email, password, userData) => {
    try {
      set({ loading: true, error: null });
      await authService.signUp(email, password, {
        ...userData,
        status: 'approved' // Auto-approve new users
      });
      set({ loading: false });
    } catch (error) {
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to sign up' 
      });
      throw error;
    }
  },

  signIn: async (email, password) => {
    try {
      set({ loading: true, error: null });
      const user = await authService.signIn(email, password);
      set({ user, loading: false });
    } catch (error) {
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to sign in' 
      });
      throw error;
    }
  },

  signOut: async () => {
    try {
      set({ loading: true, error: null });
      await authService.signOut();
      set({ user: null, loading: false });
    } catch (error) {
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to sign out' 
      });
      throw error;
    }
  },

  completeProfile: async (data) => {
    try {
      const currentUser = get().user;
      if (!currentUser) throw new Error('Not authenticated');

      set({ loading: true, error: null });
      const updatedUser = await authService.updateProfile(currentUser.id, data);
      set({ user: updatedUser, loading: false, error: null });
    } catch (error) {
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to update profile' 
      });
      throw error;
    }
  },

  setUser: (user) => set({ user }),
  clearError: () => set({ error: null })
}));