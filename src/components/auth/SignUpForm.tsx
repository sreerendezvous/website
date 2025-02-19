import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Mail, Apple } from 'lucide-react';
import { authValidation } from '@/lib/utils/validation';
import type { SignUpValidation } from '@/lib/utils/validation';

interface SignUpFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export function SignUpForm({ onSuccess, redirectTo }: SignUpFormProps) {
  const navigate = useNavigate();
  const { signUp, signInWithProvider, error, clearError } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<SignUpValidation>({
    resolver: zodResolver(authValidation.signUp)
  });

  React.useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const onSubmit = async (data: SignUpValidation) => {
    try {
      setIsSubmitting(true);
      clearError();

      await signUp(data.email, data.password, {
        full_name: data.full_name
      });
      
      onSuccess?.();
      
      if (redirectTo) {
        navigate(redirectTo);
      }
    } catch (err) {
      setIsSubmitting(false);
      console.error('Sign up error:', err);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'apple') => {
    try {
      setIsSubmitting(true);
      await signInWithProvider(provider);
    } catch (err) {
      console.error('OAuth sign in error:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-sand-300 mb-1">
          Full Name
        </label>
        <input
          {...register('full_name')}
          type="text"
          id="full_name"
          autoComplete="name"
          className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
          placeholder="Your full name"
        />
        {errors.full_name && (
          <p className="mt-1 text-sm text-red-500">{errors.full_name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-sand-300 mb-1">
          Email
        </label>
        <input
          {...register('email')}
          type="email"
          id="email"
          autoComplete="email"
          className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
          placeholder="you@example.com"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-sand-300 mb-1">
          Password
        </label>
        <input
          {...register('password')}
          type="password"
          id="password"
          autoComplete="new-password"
          className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
          placeholder="••••••••"
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
        )}
        <p className="mt-1 text-xs text-sand-400">
          Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-500 text-center">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Creating account...' : 'Sign Up'}
      </Button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-earth-700"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-earth-800 text-sand-400">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleOAuthSignIn('google')}
          className="w-full"
          disabled={isSubmitting}
        >
          <Mail className="h-4 w-4 mr-2" />
          Google
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleOAuthSignIn('apple')}
          className="w-full"
          disabled={isSubmitting}
        >
          <Apple className="h-4 w-4 mr-2" />
          Apple
        </Button>
      </div>
    </form>
  );
}