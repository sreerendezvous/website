import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth';
import { Mail, Apple } from 'lucide-react';
import { authValidation } from '@/lib/utils/validation';
import type { SignInValidation } from '@/lib/utils/validation';

interface SignInFormProps {
  onSuccess?: () => void;
}

export function SignInForm({ onSuccess }: SignInFormProps) {
  const { signIn, signInWithProvider, error } = useAuth();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignInValidation>({
    resolver: zodResolver(authValidation.signIn),
  });

  const onSubmit = async (data: SignInValidation) => {
    try {
      await signIn(data.email, data.password);
      onSuccess?.();
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'apple') => {
    try {
      await signInWithProvider(provider);
    } catch (error) {
      console.error('OAuth sign in error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-sand-300 mb-1">
          Email
        </label>
        <input
          {...register('email')}
          type="email"
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
          className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
          placeholder="••••••••"
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Signing in...' : 'Sign In'}
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
        >
          <Mail className="h-4 w-4 mr-2" />
          Google
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleOAuthSignIn('apple')}
          className="w-full"
        >
          <Apple className="h-4 w-4 mr-2" />
          Apple
        </Button>
      </div>

      <p className="text-sm text-sand-400 text-center">
        <a href="#" className="text-sand-300 hover:text-sand-200">
          Forgot your password?
        </a>
      </p>
    </form>
  );
}