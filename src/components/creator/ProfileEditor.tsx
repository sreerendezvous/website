import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase/client';
import { User, Globe, Instagram, Linkedin } from 'lucide-react';
import { creatorService } from '@/lib/supabase/services/creator';

const schema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  bio: z.string().min(50, 'Bio must be at least 50 characters'),
  specialties: z.string().transform(str => str.split(',').map(s => s.trim()).filter(Boolean)),
  languages: z.array(z.string()).min(1, 'Add at least one language'),
  socialLinks: z.object({
    website: z.string().url().optional().or(z.literal('')),
    instagram: z.string().optional(),
    linkedin: z.string().optional(),
  }),
  coverImage: z.string().optional(),
  profileImage: z.string().optional(),
});

type ProfileFormData = z.infer<typeof schema>;

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

export function ProfileEditor() {
  const { user } = useAuth();
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ProfileFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      languages: ['English']
    }
  });

  // Fetch initial data
  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!user?.id) return;

        const profile = await creatorService.getProfile(user.id);

        reset({
          businessName: profile?.business_name || '',
          bio: user.bio || '',
          specialties: profile?.specialties?.join(', ') || '',
          languages: profile?.languages || ['English'],
          socialLinks: profile?.social_links || {},
          coverImage: profile?.cover_image || '',
          profileImage: profile?.profile_image || '',
        });
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user?.id, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setError(null);
      setSuccess(false);
      
      if (!user?.id) throw new Error('User not authenticated');

      // Update the profile using the service
      await creatorService.updateProfile(user.id, {
        business_name: data.businessName,
        bio: data.bio,
        specialties: data.specialties,
        languages: data.languages,
        social_links: data.socialLinks,
        cover_image: data.coverImage,
        profile_image: data.profileImage,
      });

      // Show success message
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

      // Refresh the profile data
      const updatedProfile = await creatorService.getProfile(user.id);
      
      // Update local user state
      useAuth.setState((state) => ({
        ...state,
        user: state.user ? {
          ...state.user,
          bio: data.bio,
          creator_profile: updatedProfile
        } : null
      }));

    } catch (error) {
      console.error('Failed to update profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="bg-earth-800/50 p-6 rounded-lg">
        <p className="text-sand-400">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-earth-800/50 p-6 rounded-lg">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-12 w-12 rounded-full bg-sand-400/10 flex items-center justify-center">
            <User className="h-6 w-6 text-sand-400" />
          </div>
          <div>
            <h2 className="text-xl font-display">Profile Settings</h2>
            <p className="text-sand-400">Manage your creator profile information</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-sand-300 mb-2">
              Business Name
            </label>
            <input
              {...register('businessName')}
              className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
              placeholder="Your business or brand name"
            />
            {errors.businessName && (
              <p className="mt-1 text-sm text-red-500">{errors.businessName.message}</p>
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
              placeholder="Tell us about yourself and your expertise..."
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
                    {...register('languages')}
                    className="rounded bg-earth-700 border-earth-600 text-sand-500 focus:ring-sand-400"
                  />
                  <span className="text-sand-300">{lang}</span>
                </label>
              ))}
            </div>
            {errors.languages && (
              <p className="mt-1 text-sm text-red-500">{errors.languages.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-sand-300 mb-2">
              Specialties
            </label>
            <input
              {...register('specialties')}
              className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
              placeholder="Enter specialties separated by commas (e.g., Photography, Cooking, Yoga)"
            />
            <p className="mt-1 text-sm text-sand-400">Separate multiple specialties with commas</p>
            {errors.specialties && (
              <p className="mt-1 text-sm text-red-500">{errors.specialties.message}</p>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-sand-200">Social Links</h3>
            
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-sand-400" />
              <input
                {...register('socialLinks.website')}
                type="url"
                className="w-full pl-10 pr-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
                placeholder="https://example.com"
              />
            </div>

            <div className="relative">
              <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-sand-400" />
              <input
                {...register('socialLinks.instagram')}
                className="w-full pl-10 pr-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
                placeholder="@username"
              />
            </div>

            <div className="relative">
              <Linkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-sand-400" />
              <input
                {...register('socialLinks.linkedin')}
                className="w-full pl-10 pr-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
                placeholder="LinkedIn profile URL"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          {success && (
            <p className="text-sm text-green-500 text-center">Profile updated successfully!</p>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}