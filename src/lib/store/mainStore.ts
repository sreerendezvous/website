import { create } from 'zustand';
import { supabase } from '../supabase/client';
import type { User, Experience, Booking, CreatorProfile } from '@/types';

// Constants
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

interface StoreState {
  users: User[];
  creators: (User & { creator_profile: CreatorProfile })[];
  experiences: Experience[];
  bookings: Booking[];
  spotlights: any[];
  loading: boolean;
  error: string | null;
  initialized: boolean;
  retryCount: number;
  lastFetch: number | null;
  fetchInProgress: boolean;
  creatorsLastFetch: number | null;
}

interface StoreActions {
  fetchExperiences: (force?: boolean) => Promise<void>;
  fetchCreators: (force?: boolean) => Promise<void>;
  fetchUserBookings: (userId: string) => Promise<void>;
  fetchSpotlights: () => Promise<void>;
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
  spotlights: [],
  loading: false,
  error: null,
  initialized: false,
  retryCount: 0,
  lastFetch: null,
  fetchInProgress: false,
  creatorsLastFetch: null,

  fetchExperiences: async (force = false) => {
    const state = get();
    
    if (state.fetchInProgress) return;
    
    if (
      !force &&
      state.initialized &&
      state.lastFetch &&
      Date.now() - state.lastFetch < CACHE_DURATION &&
      state.experiences.length > 0
    ) {
      return;
    }

    try {
      set({ loading: true, error: null, fetchInProgress: true });
      
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
        lastFetch: Date.now(),
        retryCount: 0,
        fetchInProgress: false,
        error: null
      });
    } catch (error) {
      console.error('Failed to fetch experiences:', error);
      
      const retryCount = get().retryCount;
      if (retryCount < MAX_RETRIES) {
        set({ retryCount: retryCount + 1 });
        setTimeout(() => {
          get().fetchExperiences(true);
        }, RETRY_DELAY * Math.pow(2, retryCount));
      } else {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to fetch experiences',
          loading: false,
          initialized: true,
          retryCount: 0,
          fetchInProgress: false
        });
      }
    }
  },

  fetchCreators: async (force = false) => {
    const state = get();
    
    if (state.fetchInProgress) return;
    
    if (
      !force &&
      state.creatorsLastFetch &&
      Date.now() - state.creatorsLastFetch < CACHE_DURATION &&
      state.creators.length > 0
    ) {
      return;
    }

    try {
      set({ loading: true, error: null, fetchInProgress: true });
      
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
        creatorsLastFetch: Date.now(),
        retryCount: 0,
        fetchInProgress: false,
        error: null
      });
    } catch (error) {
      console.error('Failed to fetch creators:', error);
      
      const retryCount = get().retryCount;
      if (retryCount < MAX_RETRIES) {
        set({ retryCount: retryCount + 1 });
        setTimeout(() => {
          get().fetchCreators(true);
        }, RETRY_DELAY * Math.pow(2, retryCount));
      } else {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to fetch creators',
          loading: false,
          retryCount: 0,
          fetchInProgress: false
        });
      }
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

  fetchSpotlights: async () => {
    try {
      const { data, error } = await supabase
        .from('creator_spotlights')
        .select(`
          *,
          creator:creator_id (
            id,
            full_name,
            profile_image,
            creator_profile:creator_profiles(*)
          )
        `)
        .eq('active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      set({ spotlights: data || [] });
    } catch (error) {
      console.error('Failed to fetch spotlights:', error);
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
    spotlights: [],
    loading: false,
    error: null,
    initialized: false,
    retryCount: 0,
    lastFetch: null,
    fetchInProgress: false,
    creatorsLastFetch: null
  })
}));