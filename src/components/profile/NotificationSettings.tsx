import React from 'react';
import { Button } from '@/components/ui/Button';
import { Bell, Mail, MessageSquare, Calendar } from 'lucide-react';

export function NotificationSettings() {
  return (
    <div className="bg-dark-200 p-6 rounded-lg space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="h-10 w-10 rounded-full bg-primary-500/20 flex items-center justify-center">
          <Bell className="h-5 w-5 text-primary-500" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Notification Preferences</h2>
          <p className="text-gray-400">Manage how you receive notifications</p>
        </div>
      </div>

      <div className="space-y-4">
        <NotificationOption
          icon={<Mail className="h-5 w-5" />}
          title="Email Notifications"
          description="Receive notifications about your bookings and account updates via email"
        />

        <NotificationOption
          icon={<MessageSquare className="h-5 w-5" />}
          title="Chat Messages"
          description="Get notified when you receive messages from experience creators"
        />

        <NotificationOption
          icon={<Calendar className="h-5 w-5" />}
          title="Booking Reminders"
          description="Receive reminders about your upcoming experience bookings"
        />
      </div>

      <div className="flex justify-end">
        <Button>Save Preferences</Button>
      </div>
    </div>
  );
}

function NotificationOption({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  const [enabled, setEnabled] = React.useState(true);

  return (
    <div className="flex items-start justify-between p-4 rounded-lg bg-dark-300">
      <div className="flex gap-4">
        <div className="text-gray-400">{icon}</div>
        <div>
          <h3 className="font-medium">{title}</h3>
          <p className="text-sm text-gray-400">{description}</p>
        </div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={enabled}
          onChange={() => setEnabled(!enabled)}
        />
        <div className={`w-11 h-6 rounded-full peer ${
          enabled ? 'bg-primary-600' : 'bg-dark-400'
        } peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
      </label>
    </div>
  );
}