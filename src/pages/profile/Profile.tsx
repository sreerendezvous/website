import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileStats } from '@/components/profile/ProfileStats';
import { ProfileOverview } from '@/components/profile/ProfileOverview';
import { ProfileDetails } from '@/components/profile/ProfileDetails';
import { ProfileSocial } from '@/components/profile/ProfileSocial';
import { ProfileInterests } from '@/components/profile/ProfileInterests';
import { CommunicationPreferences } from '@/components/profile/CommunicationPreferences';
import { BookingsSummary } from '@/components/profile/BookingsSummary';
import { QuickActions } from '@/components/profile/QuickActions';

export function Profile() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <p className="text-sand-400">Please sign in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 bg-earth-900">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto space-y-8"
        >
          <ProfileHeader user={user} isOwnProfile={true} />
          
          <div className="mt-24 md:mt-16">
            <ProfileStats user={user} />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <ProfileOverview user={user} />
              <ProfileInterests user={user} />
              <BookingsSummary />
              <ProfileDetails user={user} />
              <ProfileSocial user={user} />
            </div>
            
            <div className="space-y-6">
              <QuickActions user={user} />
              <CommunicationPreferences />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}