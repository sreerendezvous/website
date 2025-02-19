import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Instagram, Linkedin, Globe } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import type { User } from '@/types';

const schema = z.object({
  instagram: z.string()
    .transform(val => {
      if (!val) return '';
      // Remove @ and any URL parts, just keep username
      const username = val.replace(/^@/, '').split('/').pop();
      return username || '';
    })
    .optional(),
  linkedin: z.string()
    .transform(val => {
      if (!val) return '';
      // Handle different LinkedIn URL formats
      if (val.includes('linkedin.com')) {
        return val.startsWith('http') ? val : `https://${val}`;
      }
      // If just username/profile path provided
      const username = val.replace(/^@/, '').split('/').pop();
      return `https://linkedin.com/in/${username}`;
    })
    .optional(),
  website: z.string()
    .transform(val => {
      if (!val) return '';
      return val.startsWith('http') ? val : `https://${val}`;
    })
    .optional(),
});

type SocialFormData = z.infer<typeof schema>;

interface ProfileSocialProps {
  user: User;
}

export function ProfileSocial({ user }: ProfileSocialProps) {
  const { completeProfile } = useAuth();
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<SocialFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      instagram: user.instagram,
      linkedin: user.linkedin,
      website: user.other_social_links?.website,
    },
  });

  const onSubmit = async (data: SocialFormData) => {
    try {
      setIsUpdating(true);
      setError(null);

      await completeProfile({
        instagram: data.instagram,
        linkedin: data.linkedin,
        other_social_links: {
          ...user.other_social_links,
          website: data.website,
        },
        status: user.status, // Preserve existing status
        role: user.role, // Preserve existing role
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to update social links:', error);
      setError(error instanceof Error ? error.message : 'Failed to update social links');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-earth-800/50 p-6 rounded-lg">
      <h2 className="text-xl font-display mb-6">Social Links</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="relative">
          <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-sand-400" />
          <input
            {...register('instagram')}
            className="w-full pl-10 pr-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
            placeholder="Instagram username (e.g. @username)"
          />
        </div>

        <div className="relative">
          <Linkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-sand-400" />
          <input
            {...register('linkedin')}
            className="w-full pl-10 pr-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
            placeholder="LinkedIn profile URL or username"
          />
        </div>

        <div className="relative">
          <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-sand-400" />
          <input
            {...register('website')}
            className="w-full pl-10 pr-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
            placeholder="Personal website URL"
          />
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-sm text-green-500">Social links updated successfully!</p>
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