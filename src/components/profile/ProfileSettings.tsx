import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { ImageUpload } from '@/components/experiences/ImageUpload';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import type { User } from '@/types';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  bio: z.string().optional(),
  avatar: z.string().optional(),
  interests: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  preferences: z.object({
    communicationPreference: z.enum(['email', 'sms', 'push']),
    languagePreference: z.string(),
    timeZone: z.string(),
    dietaryRestrictions: z.array(z.string()),
    accessibilityNeeds: z.array(z.string()),
  }).optional(),
});

type ProfileFormData = z.infer<typeof schema>;

interface Props {
  user: User;
}

export function ProfileSettings({ user }: Props) {
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<ProfileFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user.full_name,
      email: user.email,
      bio: user.bio,
      interests: user.interests || [],
      languages: user.languages || [],
      preferences: {
        communicationPreference: "email",
        languagePreference: "English",
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        dietaryRestrictions: [],
        accessibilityNeeds: [],
      },
    },
  });

  const avatar = watch('avatar');

  const onSubmit = async (data: ProfileFormData) => {
    try {
      console.log('Profile data:', data);
      // Implement API call to update profile
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div>
        <h2 className="text-xl font-display mb-4">Profile Picture</h2>
        <ImageUpload
          value={avatar ? [avatar] : []}
          onChange={(urls) => setValue('avatar', urls[0])}
          maxFiles={1}
        />
      </div>

      <div>
        <h2 className="text-xl font-display mb-4">Basic Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-sand-300 mb-2">
              Full Name
            </label>
            <input
              {...register('name')}
              className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-sand-300 mb-2">
              Email
            </label>
            <input
              {...register('email')}
              type="email"
              className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
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
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-display mb-4">Preferences</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-sand-300 mb-2">
              Communication Preference
            </label>
            <select
              {...register('preferences.communicationPreference')}
              className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
            >
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="push">Push Notifications</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-sand-300 mb-2">
              Language Preference
            </label>
            <select
              {...register('preferences.languagePreference')}
              className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
            >
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
              <option value="German">German</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-sand-300 mb-2">
              Time Zone
            </label>
            <select
              {...register('preferences.timeZone')}
              className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
            >
              {Intl.supportedValuesOf('timeZone').map((zone) => (
                <option key={zone} value={zone}>{zone}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}