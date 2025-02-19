export const APP_NAME = 'rendezvous';
export const APP_DESCRIPTION = 'Curated Experiences Marketplace';

export const ROUTES = {
  HOME: '/',
  EXPERIENCES: '/experiences',
  CREATORS: '/creators',
  ABOUT: '/about',
  APPLY: '/apply',
  SETTINGS: '/settings',
  ADMIN: '/admin',
} as const;

export const API_ENDPOINTS = {
  AUTH: '/auth',
  USERS: '/users',
  EXPERIENCES: '/experiences',
  BOOKINGS: '/bookings',
  REVIEWS: '/reviews',
} as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER: 'user',
  THEME: 'theme',
} as const;

export const QUERY_KEYS = {
  USER: 'user',
  EXPERIENCES: 'experiences',
  BOOKINGS: 'bookings',
  REVIEWS: 'reviews',
} as const;