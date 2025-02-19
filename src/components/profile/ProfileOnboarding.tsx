import React from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { LocationPicker } from '@/components/experiences/LocationPicker';
import { useAuth } from '@/lib/auth';
import { Shield, Globe, Languages, Tag } from 'lucide-react';

const schema = z.object({
  bio: z.string().min(50, 'Bio must be at least 50 characters'),
  interests: z.array(z.string()).min(1, 'Select at least one interest'),
  languages: z.array(z.string()).min(1, 'Select at least one language'),
  location: z.object({
    name: z.string().optional(),
    address: z.string().optional(),
    city: z.string(),
    country: z.string(),
    coordinates: z.object({
      latitude: z.number(),
      longitude: z.number()
    }).optional()
  }),
  social_links: z.object({
    instagram: z.string().optional(),
    linkedin: z.string().optional(),
    website: z.string().url().optional()
  }).optional()
});

type OnboardingFormData = z.infer<typeof schema>;

interface ProfileOnboardingProps {
  onComplete: () => void;
}

const interests = [
  'Adventure',
  'Art & Culture',
  'Cooking',
  'Dance',
  'Fashion',
  'Fitness',
  'Food & Drink',
  'History',
  'Language',
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

export function ProfileOnboarding({ onComplete }: ProfileOnboardingProps) {
  const { user, updateProfile } = useAuth();
  const [currentStep, setCurrentStep] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<OnboardingFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      bio: '',
      interests: [],
      languages: ['English'],
      location: {
        city: '',
        country: ''
      },
      social_links: {}
    }
  });

  const location = watch('location');

  const steps = [
    {
      title: 'Tell us about yourself',
      description: 'Help others get to know you better',
      component: (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-sand-300 mb-2">
              Bio
            </label>
            <textarea
              {...register('bio')}
              rows={4}
              className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
              placeholder="Share your story, passions, and what brings you here..."
            />
            {errors.bio && (
              <p className="mt-1 text-sm text-red-500">{errors.bio.message}</p>
            )}
          </div>
        </div>
      )
    },
    {
      title: 'Your interests',
      description: 'Select topics that interest you',
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {interests.map((interest) => (
              <label key={interest} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  value={interest}
                  {...register('interests')}
                  className="rounded bg-earth-700 border-earth-600 text-sand-500 focus:ring-sand-400"
                />
                <span className="text-sand-300">{interest}</span>
              </label>
            ))}
          </div>
          {errors.interests && (
            <p className="mt-1 text-sm text-red-500">{errors.interests.message}</p>
          )}
        </div>
      )
    },
    {
      title: 'Languages you speak',
      description: 'Select languages you're comfortable communicating in',
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {languages.map((language) => (
              <label key={language} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  value={language}
                  {...register('languages')}
                  className="rounded bg-earth-700 border-earth-600 text-sand-500 focus:ring-sand-400"
                />
                <span className="text-sand-300">{language}</span>
              </label>
            ))}
          </div>
          {errors.languages && (
            <p className="mt-1 text-sm text-red-500">{errors.languages.message}</p>
          )}
        </div>
      )
    },
    {
      title: 'Where are you based?',
      description: 'Help us show you relevant experiences',
      component: (
        <LocationPicker
          value={location}
          onChange={(newLocation) => setValue('location', newLocation)}
        />
      )
    },
    {
      title: 'Connect your social profiles',
      description: 'Optional: Link your social media accounts',
      component: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-sand-300 mb-2">
              Instagram Username
            </label>
            <input
              {...register('social_links.instagram')}
              className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
              placeholder="@username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-sand-300 mb-2">
              LinkedIn Profile
            </label>
            <input
              {...register('social_links.linkedin')}
              className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
              placeholder="LinkedIn profile URL"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-sand-300 mb-2">
              Personal Website
            </label>
            <input
              {...register('social_links.website')}
              type="url"
              className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
              placeholder="https://example.com"
            />
          </div>
        </div>
      )
    }
  ];

  const onSubmit = async (data: OnboardingFormData) => {
    try {
      setError(null);
      await updateProfile({
        bio: data.bio,
        interests: data.interests,
        languages: data.languages,
        location: data.location,
        social_links: data.social_links
      });
      onComplete();
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      setError(error instanceof Error ? error.message : 'Failed to complete onboarding');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="h-1 bg-earth-800 rounded-full">
          <div 
            className="h-full bg-sand-400 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl font-display mb-2">{steps[currentStep].title}</h2>
          <p className="text-sand-400">{steps[currentStep].description}</p>
        </div>

        {steps[currentStep].component}

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        <div className="flex justify-between pt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(current => current - 1)}
            disabled={currentStep === 0}
          >
            Back
          </Button>
          
          {currentStep < steps.length - 1 ? (
            <Button onClick={() => setCurrentStep(current => current + 1)}>
              Continue
            </Button>
          ) : (
            <Button onClick={handleSubmit(onSubmit)}>
              Complete Profile
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}