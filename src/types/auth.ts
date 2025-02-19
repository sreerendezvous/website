export interface AuthConfig {
  providers: {
    google: {
      clientId: string;
      redirectUrl: string;
    };
    apple: {
      clientId: string;
      redirectUrl: string;
    };
  };
  redirects: {
    signIn: string;
    signUp: string;
    passwordReset: string;
  };
  defaultRole: string;
}

export interface AuthStore {
  user: User | null;
  loading: boolean;
  error: string | null;
  signUp: (data: SignUpData) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithProvider: (provider: 'google' | 'apple') => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  bio?: string;
  phone?: string;
  instagram?: string;
  linkedin?: string;
}