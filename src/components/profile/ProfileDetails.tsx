import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth';
import type { User } from '@/types';

const schema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  bio: z.string().min(50, 'Bio must be at least 50 characters').optional(),
});

type ProfileFormData = z.infer<typeof schema>;

interface ProfileDetailsProps {
  user: User;
}

export function ProfileDetails({ user }: ProfileDetailsProps) {
  const { completeProfile } = useAuth();
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<ProfileFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: user.full_name,
      bio: user.bio,
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setIsUpdating(true);
      setError(null);
      
      // Preserve existing user data while updating profile
      await completeProfile({
        ...data,
        status: user.status, // Preserve existing status
        role: user.role, // Preserve existing role
      });
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to update profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-earth-800/50 p-6 rounded-lg">
      <h2 className="text-xl font-display mb-6">Profile Details</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-sand-300 mb-2">
            Full Name
          </label>
          <input
            {...register('full_name')}
            className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
          />
          {errors.full_name && (
            <p className="mt-1 text-sm text-red-500">{errors.full_name.message}</p>
          )}
        </div>

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

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-sm text-green-500">Profile updated successfully!</p>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!isDirty || isUpdating}
          >
            {isUpdating ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}