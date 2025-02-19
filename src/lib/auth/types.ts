import type { User } from '@/types';

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface AuthStore extends AuthState {
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
  clearError: () => void;
}