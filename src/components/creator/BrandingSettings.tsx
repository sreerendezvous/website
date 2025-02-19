import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { ImageUpload } from '@/components/experiences/ImageUpload';
import { Palette, Image } from 'lucide-react';
import { useAuth } from '@/lib/auth';

const schema = z.object({
  brandColor: z.string(),
  coverImage: z.string().optional(),
  logo: z.string().optional(),
  bio: z.string().min(100, 'Bio must be at least 100 characters'),
  socialLinks: z.object({
    website: z.string().url().optional(),
    instagram: z.string().optional(),
    facebook: z.string().optional(),
    twitter: z.string().optional(),
  }),
});

type BrandingFormData = z.infer<typeof schema>;

export function BrandingSettings() {
  const { user, completeProfile } = useAuth();
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<BrandingFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      brandColor: user?.branding?.color || '#000000',
      coverImage: user?.branding?.coverImage,
      logo: user?.branding?.logo,
      bio: user?.bio || '',
      socialLinks: user?.branding?.socialLinks || {},
    },
  });

  const coverImage = watch('coverImage');
  const logo = watch('logo');

  const onSubmit = async (data: BrandingFormData) => {
    try {
      await completeProfile({
        bio: data.bio,
        branding: {
          color: data.brandColor,
          coverImage: data.coverImage,
          logo: data.logo,
          socialLinks: data.socialLinks,
        },
      });
    } catch (error) {
      console.error('Failed to update branding:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-earth-800/50 rounded-lg p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-12 w-12 rounded-full bg-sand-400/10 flex items-center justify-center">
            <Palette className="h-6 w-6 text-sand-400" />
          </div>
          <div>
            <h2 className="text-xl font-display">Branding & Design</h2>
            <p className="text-sand-400">Customize your experience pages</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-sand-300 mb-2">
              Brand Color
            </label>
            <div className="flex items-center gap-4">
              <input
                {...register('brandColor')}
                type="color"
                className="h-10 w-20 bg-transparent border-0 rounded-lg cursor-pointer"
              />
              <input
                {...register('brandColor')}
                type="text"
                className="w-32 px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-sand-300 mb-2">
              Cover Image
            </label>
            <ImageUpload
              value={coverImage ? [coverImage] : []}
              onChange={(urls) => setValue('coverImage', urls[0])}
              maxFiles={1}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-sand-300 mb-2">
              Logo
            </label>
            <ImageUpload
              value={logo ? [logo] : []}
              onChange={(urls) => setValue('logo', urls[0])}
              maxFiles={1}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-sand-300 mb-2">
              Bio
            </label>
            <textarea
              {...register('bio')}
              rows={4}
              className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
              placeholder="Tell your story..."
            />
            {errors.bio && (
              <p className="mt-1 text-sm text-red-500">{errors.bio.message}</p>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-sand-200">Social Links</h3>
            
            <div>
              <label className="block text-sm font-medium text-sand-300 mb-1">
                Website
              </label>
              <input
                {...register('socialLinks.website')}
                type="url"
                className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
                placeholder="https://example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-sand-300 mb-1">
                Instagram
              </label>
              <input
                {...register('socialLinks.instagram')}
                className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
                placeholder="@username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-sand-300 mb-1">
                Facebook
              </label>
              <input
                {...register('socialLinks.facebook')}
                className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
                placeholder="username or page URL"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-sand-300 mb-1">
                Twitter
              </label>
              <input
                {...register('socialLinks.twitter')}
                className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
                placeholder="@username"
              />
            </div>
          </div>

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