import { create } from 'zustand';
import { supabase } from '../supabase';
import type { User, Experience, Booking, CreatorProfile } from '../types';

interface StoreState {
  users: User[];
  creators: (User & { creator_profile: CreatorProfile })[];
  experiences: Experience[];
  bookings: Booking[];
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

interface StoreActions {
  fetchExperiences: (force?: boolean) => Promise<void>;
  fetchCreators: (force?: boolean) => Promise<void>;
  fetchUserBookings: (userId: string) => Promise<void>;
  fetchCreator: (creatorId: string) => Promise<any>;
  setBookings: (bookings: Booking[]) => void;
  addBooking: (booking: Booking) => void;
  updateBooking: (id: string, booking: Partial<Booking>) => void;
  cancelBooking: (id: string) => void;
  reset: () => void;
}

export const useStore = create<StoreState & StoreActions>()((set, get) => ({
  users: [],
  creators: [],
  experiences: [],
  bookings: [],
  loading: false,
  error: null,
  initialized: false,

  fetchExperiences: async (force = false) => {
    try {
      set({ loading: true, error: null });
      
      const { data: experiences, error } = await supabase
        .from('experiences')
        .select(`
          *,
          creator:creator_id (
            id,
            full_name,
            bio,
            profile_image,
            creator_profile:creator_profiles(*)
          ),
          category:categories(*),
          media:experience_media (
            url,
            type,
            order_index
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ 
        experiences: experiences || [],
        loading: false,
        initialized: true,
        error: null
      });
    } catch (error) {
      console.error('Failed to fetch experiences:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch experiences',
        loading: false,
        initialized: true
      });
    }
  },

  fetchCreators: async (force = false) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          creator_profile:creator_profiles(*)
        `)
        .eq('role', 'creator');

      if (error) throw error;

      const creators = (data || []).filter(user => user.creator_profile);

      set({ 
        creators,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Failed to fetch creators:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch creators',
        loading: false
      });
    }
  },

  fetchCreator: async (creatorId: string) => {
    try {
      const { data: creator, error } = await supabase
        .from('users')
        .select(`
          *,
          creator_profile:creator_profiles(
            *,
            experiences:experiences(
              *,
              media:experience_media(*)
            )
          )
        `)
        .eq('id', creatorId)
        .single();

      if (error) throw error;
      return creator;
    } catch (error) {
      console.error('Failed to fetch creator:', error);
      throw error;
    }
  },

  fetchUserBookings: async (userId: string) => {
    try {
      set({ loading: true, error: null });
      
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          *,
          experience:experiences!experience_id (
            *,
            creator:creator_id (
              full_name,
              profile_image
            ),
            media:experience_media (
              url,
              type,
              order_index
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ bookings: bookings || [], loading: false, error: null });
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch bookings',
        loading: false 
      });
    }
  },

  setBookings: (bookings) => set({ bookings }),
  addBooking: (booking) => set((state) => ({ bookings: [...state.bookings, booking] })),
  updateBooking: (id, booking) => set((state) => ({
    bookings: state.bookings.map((b) => (b.id === id ? { ...b, ...booking } : b))
  })),
  cancelBooking: (id) => set((state) => ({
    bookings: state.bookings.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b))
  })),

  reset: () => set({
    users: [],
    creators: [],
    experiences: [],
    bookings: [],
    loading: false,
    error: null,
    initialized: false
  })
}));