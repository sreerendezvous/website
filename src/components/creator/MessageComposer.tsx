import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Mail, MessageSquare, Phone } from 'lucide-react';
import { sendMessage } from '@/lib/messaging';
import type { Experience, User, Message } from '@/types';

const schema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  content: z.string().min(1, 'Message content is required'),
  type: z.enum(['update', 'reminder', 'cancellation', 'general']),
});

type MessageFormData = z.infer<typeof schema>;

interface MessageComposerProps {
  experience: Experience;
  attendees: User[];
  onMessageSent?: (message: Message) => void;
}

export function MessageComposer({ experience, attendees, onMessageSent }: MessageComposerProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<MessageFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'general',
    },
  });

  const onSubmit = async (data: MessageFormData) => {
    try {
      const message = await sendMessage({
        experienceId: experience.id,
        creatorId: experience.creatorId,
        subject: data.subject,
        content: data.content,
        type: data.type,
        recipients: attendees,
      });

      reset();
      onMessageSent?.(message);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const channelStats = attendees.reduce(
    (acc, attendee) => {
      const prefs = attendee.communicationPreferences;
      if (prefs) {
        if (prefs.email) acc.email++;
        if (prefs.whatsapp) acc.whatsapp++;
        if (prefs.sms) acc.sms++;
      }
      return acc;
    },
    { email: 0, whatsapp: 0, sms: 0 }
  );

  return (
    <div className="bg-earth-800/50 rounded-lg p-6">
      <h3 className="text-xl font-display mb-6">Message Attendees</h3>

      <div className="flex items-center gap-6 mb-6">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-sand-400" />
          <span className="text-sm text-sand-300">{channelStats.email} via email</span>
        </div>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-sand-400" />
          <span className="text-sm text-sand-300">{channelStats.whatsapp} via WhatsApp</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="h-5 w-5 text-sand-400" />
          <span className="text-sm text-sand-300">{channelStats.sms} via SMS</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-sand-300 mb-1">
            Message Type
          </label>
          <select
            {...register('type')}
            className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
          >
            <option value="general">General Message</option>
            <option value="update">Experience Update</option>
            <option value="reminder">Reminder</option>
            <option value="cancellation">Cancellation Notice</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-sand-300 mb-1">
            Subject
          </label>
          <input
            {...register('subject')}
            className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
            placeholder="Enter message subject"
          />
          {errors.subject && (
            <p className="mt-1 text-sm text-red-500">{errors.subject.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-sand-300 mb-1">
            Message
          </label>
          <textarea
            {...register('content')}
            rows={4}
            className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
            placeholder="Enter your message"
          />
          {errors.content && (
            <p className="mt-1 text-sm text-red-500">{errors.content.message}</p>
          )}
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </Button>
        </div>
      </form>
    </div>
  );
}