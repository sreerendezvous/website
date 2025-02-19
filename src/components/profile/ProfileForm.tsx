import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authValidation } from '@/lib/utils/validation';
import { Button } from '@/components/ui/Button';
import type { ProfileValidation } from '@/lib/utils/validation';

interface ProfileFormProps {
  onSuccess: () => void;
  initialData?: {
    bio?: string;
    instagram?: string;
    linkedin?: string;
    website?: string;
  };
}

const interests = [
  'Art & Culture',
  'Food & Drink',
  'Music',
  'Nature',
  'Photography',
  'Sports',
  'Technology',
  'Travel',
  'Wellness',
  'Writing'
];

const languages = [
  'English',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Chinese',
  'Japanese',
  'Korean',
  'Arabic'
];

export function ProfileForm({ onSuccess, initialData }: ProfileFormProps) {
  const [error, setError] = React.useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileValidation>({
    resolver: zodResolver(authValidation.profile),
    defaultValues: initialData
  });

  const onSubmit = async (data: ProfileValidation) => {
    try {
      setError(null);
      // Call API to update profile
      onSuccess();
    } catch (error) {
      console.error('Failed to complete profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to complete profile');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-sand-300 mb-2">
          Bio
        </label>
        <textarea
          {...register('bio')}
          rows={4}
          className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
          placeholder="Tell us about yourself..."
        />
        {errors.bio && (
          <p className="mt-1 text-sm text-red-500">{errors.bio.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-sand-300 mb-2">
          Languages
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {languages.map((lang) => (
            <label key={lang} className="flex items-center gap-2">
              <input
                type="checkbox"
                value={lang}
                className="rounded bg-earth-700 border-earth-600 text-sand-500 focus:ring-sand-400"
              />
              <span className="text-sand-300">{lang}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-sand-300 mb-2">
          Interests
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {interests.map((interest) => (
            <label key={interest} className="flex items-center gap-2">
              <input
                type="checkbox"
                value={interest}
                className="rounded bg-earth-700 border-earth-600 text-sand-500 focus:ring-sand-400"
              />
              <span className="text-sand-300">{interest}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-sand-200">Social Links</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-sand-300 mb-2">
              Instagram Username
            </label>
            <input
              {...register('instagram')}
              className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
              placeholder="@username"
            />
            {errors.instagram && (
              <p className="mt-1 text-sm text-red-500">{errors.instagram.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-sand-300 mb-2">
              LinkedIn Profile
            </label>
            <input
              {...register('linkedin')}
              className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
              placeholder="Username or profile URL"
            />
            {errors.linkedin && (
              <p className="mt-1 text-sm text-red-500">{errors.linkedin.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-sand-300 mb-2">
              Website
            </label>
            <input
              {...register('website')}
              className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
              placeholder="www.example.com or https://example.com"
            />
            {errors.website && (
              <p className="mt-1 text-sm text-red-500">{errors.website.message}</p>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-500">{error}</p>
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Complete Profile'}
        </Button>
      </div>
    </form>
  );
}