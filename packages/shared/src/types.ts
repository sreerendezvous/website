export interface User {
  id: string;
  email: string;
  full_name: string;
  bio?: string;
  role: 'user' | 'creator' | 'admin';
  profile_image?: string;
  instagram?: string;
  linkedin?: string;
  other_social_links?: {
    website?: string;
  };
  interests?: string[];
  languages?: string[];
  created_at: string;
  updated_at: string;
}

export interface CreatorProfile {
  id: string;
  user_id: string;
  business_name: string;
  bio?: string;
  specialties?: string[];
  languages?: string[];
  rating?: number;
  reviews_count?: number;
  stripe_account_id?: string;
  social_links?: {
    website?: string;
    instagram?: string;
    linkedin?: string;
  };
  cover_image?: string;
  profile_image?: string;
  created_at: string;
  updated_at: string;
}

export interface Experience {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  short_description?: string;
  price: number;
  duration: number;
  max_participants: number;
  booking_type: 'instant' | 'request';
  approval_required?: boolean;
  requirements_description?: string;
  category?: {
    id: string;
    name: string;
    icon?: string;
  };
  location?: {
    name: string;
    address: string;
    city: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  media?: Array<{
    url: string;
    type: 'image' | 'video';
    order_index: number;
  }>;
  requirements?: string[];
  included_items?: string[];
  not_included_items?: string[];
  cancellation_policy?: 'flexible' | 'moderate' | 'strict';
  languages?: string[];
  accessibility_options?: {
    wheelchairAccessible: boolean;
    mobilityAccess: boolean;
    hearingAccess: boolean;
    visualAccess: boolean;
  };
  rating?: number;
  reviews_count?: number;
  created_at: string;
  updated_at: string;
  creator?: User;
}

export interface Booking {
  id: string;
  experience_id: string;
  user_id: string;
  participant_count: number;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
  updated_at: string;
  experience?: Experience;
}