import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { ProfileSettings } from '@/components/profile/ProfileSettings';
import { SecuritySettings } from '@/components/profile/SecuritySettings';
import { NotificationSettings } from '@/components/profile/NotificationSettings';
import { useAuth } from '@/lib/auth';

export function Settings() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <p className="text-gray-400">Please sign in to access your settings.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 bg-dark-100">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

        <div className="max-w-4xl">
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <ProfileSettings user={user} />
            </TabsContent>

            <TabsContent value="security">
              <SecuritySettings />
            </TabsContent>

            <TabsContent value="notifications">
              <NotificationSettings />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}