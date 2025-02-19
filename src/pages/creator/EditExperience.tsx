import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { MediaUpload } from '@/components/experiences/MediaUpload';
import { LocationPicker } from '@/components/experiences/LocationPicker';
import { useAuth } from '@/lib/auth';
import { useStore } from '@/lib/store';
import { experienceService } from '@/lib/supabase/services/experiences';

const schema = z.object({
  title: z.string()
    .min(10, 'Title must be at least 10 characters')
    .max(100, 'Title must not exceed 100 characters'),
  description: z.string()
    .min(100, 'Description must be at least 100 characters')
    .max(2000, 'Description must not exceed 2000 characters'),
  shortDescription: z.string()
    .max(200, 'Short description must not exceed 200 characters')
    .optional(),
  price: z.number()
    .min(0, 'Price must be positive')
    .max(10000, 'Price must not exceed 10000'),
  duration: z.number()
    .min(30, 'Duration must be at least 30 minutes')
    .max(480, 'Duration must not exceed 8 hours'),
  location: z.object({
    name: z.string().min(5, 'Location name is required'),
    address: z.string().min(5, 'Address is required'),
    city: z.string().min(2, 'City is required'),
    country: z.string().min(2, 'Country is required'),
    coordinates: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }).optional(),
  }),
  category: z.enum(['cultural', 'wellness', 'thought-leadership', 'entertainment', 'adventure']),
  maxParticipants: z.number()
    .min(1, 'Must accept at least 1 participant')
    .max(100, 'Maximum 100 participants'),
  media: z.array(z.object({
    url: z.string().url(),
    type: z.enum(['image', 'video']),
    order: z.number(),
  })).min(1, 'At least one media item is required'),
  requirements: z.array(z.string()).optional(),
  included: z.array(z.string()).optional(),
  notIncluded: z.array(z.string()).optional(),
  cancellationPolicy: z.enum(['flexible', 'moderate', 'strict']),
  languages: z.array(z.string()).min(1, 'At least one language is required'),
  accessibility: z.object({
    wheelchairAccessible: z.boolean(),
    mobilityAccess: z.boolean(),
    hearingAccess: z.boolean(),
    visualAccess: z.boolean(),
  }).optional(),
});

type ExperienceFormData = z.infer<typeof schema>;

const categories = [
  'cultural',
  'wellness',
  'thought-leadership',
  'entertainment',
  'adventure'
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

export function EditExperience() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { experiences, fetchExperiences } = useStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const experience = experiences.find(exp => exp.id === id);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isDirty } } = useForm<ExperienceFormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (experience) {
      reset({
        title: experience.title,
        description: experience.description,
        shortDescription: experience.short_description || '',
        price: experience.price,
        duration: experience.duration,
        location: experience.location || {
          name: '',
          address: '',
          city: '',
          country: ''
        },
        category: experience.category?.name as any || 'cultural',
        maxParticipants: experience.max_participants,
        media: experience.media?.map((m, index) => ({
          url: m.url,
          type: m.type as 'image' | 'video',
          order: index
        })) || [],
        requirements: experience.requirements || [],
        included: experience.included_items || [],
        notIncluded: experience.not_included_items || [],
        cancellationPolicy: experience.cancellation_policy || 'flexible',
        languages: experience.languages || ['English'],
        accessibility: experience.accessibility_options || {
          wheelchairAccessible: false,
          mobilityAccess: false,
          hearingAccess: false,
          visualAccess: false
        }
      });
      setLoading(false);
    }
  }, [experience, reset]);

  const media = watch('media');

  const onSubmit = async (data: ExperienceFormData) => {
    try {
      if (!user) throw new Error('User not authenticated');
      if (!id) throw new Error('Experience ID not found');

      setError(null);
      setIsSaving(true);

      const mediaPromises = data.media.map(async (media, index) => {
        if (media.url.startsWith('http')) {
          return {
            url: media.url,
            type: media.type,
            order: index
          };
        }
        const file = await fetch(media.url).then(r => r.blob());
        const uploadedUrl = await experienceService.uploadMedia(file, user.id);
        return {
          url: uploadedUrl,
          type: media.type,
          order: index
        };
      });

      const uploadedMedia = await Promise.all(mediaPromises);

      await experienceService.update(id, {
        ...data,
        media: uploadedMedia,
        location: {
          ...data.location,
          coordinates: data.location.coordinates || {
            latitude: 0,
            longitude: 0
          }
        }
      });

      await fetchExperiences();
      navigate('/creator/dashboard');
    } catch (error) {
      console.error('Failed to update experience:', error);
      setError(error instanceof Error ? error.message : 'Failed to update experience');
      setIsSaving(false);
    }
  };

  if (!user || user.role !== 'creator') {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <p className="text-sand-400">You must be an approved creator to edit experiences.</p>
      </div>
    );
  }

  if (!experience) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <p className="text-sand-400">Experience not found.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <p className="text-sand-400">Loading experience data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 bg-earth-900">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-display mb-8">Edit Experience</h1>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-earth-800/50 p-6 rounded-lg">
            <div>
              <h2 className="text-xl font-display mb-4">Media</h2>
              <MediaUpload
                value={media}
                onChange={(value) => setValue('media', value)}
                maxFiles={10}
              />
              {errors.media && (
                <p className="mt-1 text-sm text-red-500">{errors.media.message}</p>
              )}
            </div>

            <div>
              <h2 className="text-xl font-display mb-4">Basic Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-sand-300 mb-2">
                    Title
                  </label>
                  <input
                    {...register('title')}
                    className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
                    placeholder="Give your experience a catchy title"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-sand-300 mb-2">
                    Short Description
                  </label>
                  <input
                    {...register('shortDescription')}
                    className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
                    placeholder="A brief summary that appears in search results"
                  />
                  {errors.shortDescription && (
                    <p className="mt-1 text-sm text-red-500">{errors.shortDescription.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-sand-300 mb-2">
                    Full Description
                  </label>
                  <textarea
                    {...register('description')}
                    rows={6}
                    className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
                    placeholder="Describe what participants can expect..."
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-sand-300 mb-2">
                    Category
                  </label>
                  <select
                    {...register('category')}
                    className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category} value={category} className="capitalize">
                        {category}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-500">{errors.category.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-display mb-4">Location & Logistics</h2>
              <LocationPicker
                value={watch('location')}
                onChange={(newLocation) => setValue('location', newLocation)}
                className="mb-6"
              />
              {errors.location && (
                <p className="mt-1 text-sm text-red-500">{errors.location.message}</p>
              )}
            </div>

            <div>
              <h2 className="text-xl font-display mb-4">Experience Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-sand-300 mb-2">
                    Price (USD)
                  </label>
                  <input
                    {...register('price', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
                  />
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-500">{errors.price.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-sand-300 mb-2">
                    Duration (minutes)
                  </label>
                  <input
                    {...register('duration', { valueAsNumber: true })}
                    type="number"
                    min="30"
                    step="30"
                    className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
                  />
                  {errors.duration && (
                    <p className="mt-1 text-sm text-red-500">{errors.duration.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-sand-300 mb-2">
                    Max Participants
                  </label>
                  <input
                    {...register('maxParticipants', { valueAsNumber: true })}
                    type="number"
                    min="1"
                    className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
                  />
                  {errors.maxParticipants && (
                    <p className="mt-1 text-sm text-red-500">{errors.maxParticipants.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-display mb-4">Languages & Accessibility</h2>
              <div className="space-y-4">
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
                    Accessibility Options
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        {...register('accessibility.wheelchairAccessible')}
                        className="rounded bg-earth-700 border-earth-600 text-sand-500 focus:ring-sand-400"
                      />
                      <span className="text-sand-300">Wheelchair Accessible</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        {...register('accessibility.mobilityAccess')}
                        className="rounded bg-earth-700 border-earth-600 text-sand-500 focus:ring-sand-400"
                      />
                      <span className="text-sand-300">Mobility Access</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        {...register('accessibility.hearingAccess')}
                        className="rounded bg-earth-700 border-earth-600 text-sand-500 focus:ring-sand-400"
                      />
                      <span className="text-sand-300">Hearing Access</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        {...register('accessibility.visualAccess')}
                        className="rounded bg-earth-700 border-earth-600 text-sand-500 focus:ring-sand-400"
                      />
                      <span className="text-sand-300">Visual Access</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-display mb-4">Policies</h2>
              <div>
                <label className="block text-sm font-medium text-sand-300 mb-2">
                  Cancellation Policy
                </label>
                <select
                  {...register('cancellationPolicy')}
                  className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
                >
                  <option value="flexible">Flexible - Full refund 24h prior</option>
                  <option value="moderate">Moderate - Full refund 5 days prior</option>
                  <option value="strict">Strict - No refunds</option>
                </select>
                {errors.cancellationPolicy && (
                  <p className="mt-1 text-sm text-red-500">{errors.cancellationPolicy.message}</p>
                )}
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-500">{error}</p>
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/creator/dashboard')}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!isDirty || isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}