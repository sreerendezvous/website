export * from './forms';
export * from './media';
export * from './validation';
export * from './hooks';
export * from './animations';

// Centralized validation functions
export const validateEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validatePassword = (password: string) => {
  return {
    isValid: password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[^A-Za-z0-9]/.test(password),
    errors: []
  };
};

// Centralized auth checks
export const checkAuth = (user: any) => {
  if (!user) throw new Error('Not authenticated');
  return user;
};

export const checkRole = (user: any, role: string) => {
  checkAuth(user);
  if (user.role !== role) throw new Error(`Must be a ${role}`);
  return user;
};