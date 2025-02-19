import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Mail, MessageSquare, Phone } from 'lucide-react';
import { useAuth } from '@/lib/auth';

const schema = z.object({
  email: z.boolean(),
  whatsapp: z.boolean(),
  sms: z.boolean(),
  preferredChannel: z.enum(['email', 'whatsapp', 'sms']),
  phoneNumber: z.string().optional(),
  whatsappNumber: z.string().optional(),
}).refine(data => {
  if (data.preferredChannel === 'whatsapp' && !data.whatsapp) {
    return false;
  }
  if (data.preferredChannel === 'sms' && !data.sms) {
    return false;
  }
  return true;
}, {
  message: "You must enable your preferred communication channel",
});

type PreferencesFormData = z.infer<typeof schema>;

export function CommunicationPreferences() {
  const { user, completeProfile } = useAuth();
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<PreferencesFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: user?.communicationPreferences?.email ?? true,
      whatsapp: user?.communicationPreferences?.whatsapp ?? false,
      sms: user?.communicationPreferences?.sms ?? false,
      preferredChannel: user?.communicationPreferences?.preferredChannel ?? 'email',
      phoneNumber: user?.communicationPreferences?.phoneNumber,
      whatsappNumber: user?.communicationPreferences?.whatsappNumber,
    },
  });

  const watchWhatsapp = watch('whatsapp');
  const watchSms = watch('sms');

  const onSubmit = async (data: PreferencesFormData) => {
    try {
      await completeProfile({
        communicationPreferences: data,
      });
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  };

  return (
    <div className="bg-earth-800/50 rounded-lg p-6">
      <h3 className="text-xl font-display mb-6">Communication Preferences</h3>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              {...register('email')}
              className="rounded bg-earth-700 border-earth-600 text-sand-500 focus:ring-sand-400"
            />
            <Mail className="h-5 w-5 text-sand-400" />
            <span className="text-sand-100">Receive updates via email</span>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              {...register('whatsapp')}
              className="rounded bg-earth-700 border-earth-600 text-sand-500 focus:ring-sand-400"
            />
            <MessageSquare className="h-5 w-5 text-sand-400" />
            <span className="text-sand-100">Receive updates via WhatsApp</span>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              {...register('sms')}
              className="rounded bg-earth-700 border-earth-600 text-sand-500 focus:ring-sand-400"
            />
            <Phone className="h-5 w-5 text-sand-400" />
            <span className="text-sand-100">Receive updates via SMS</span>
          </label>
        </div>

        {watchWhatsapp && (
          <div>
            <label className="block text-sm font-medium text-sand-300 mb-1">
              WhatsApp Number
            </label>
            <input
              {...register('whatsappNumber')}
              type="tel"
              className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
              placeholder="+1234567890"
            />
          </div>
        )}

        {watchSms && (
          <div>
            <label className="block text-sm font-medium text-sand-300 mb-1">
              Phone Number (SMS)
            </label>
            <input
              {...register('phoneNumber')}
              type="tel"
              className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
              placeholder="+1234567890"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-sand-300 mb-1">
            Preferred Communication Channel
          </label>
          <select
            {...register('preferredChannel')}
            className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
          >
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="sms">SMS</option>
          </select>
          {errors.preferredChannel && (
            <p className="mt-1 text-sm text-red-500">{errors.preferredChannel.message}</p>
          )}
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </form>
    </div>
  );
}