import React from 'react';
import { Star, Calendar } from 'lucide-react';
import type { User } from '@/types';

interface ProfileStatsProps {
  user: User;
}

export function ProfileStats({ user }: ProfileStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-earth-800/50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Star className="h-5 w-5 text-sand-400" />
          <span className="text-sm text-sand-300">Reviews</span>
        </div>
        <p className="text-2xl font-display text-sand-100">
          {user.experience_creators?.reviews_count || 0}
        </p>
      </div>
      
      <div className="bg-earth-800/50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="h-5 w-5 text-sand-400" />
          <span className="text-sm text-sand-300">Member Since</span>
        </div>
        <p className="text-2xl font-display text-sand-100">
          {new Date(user.created_at).getFullYear()}
        </p>
      </div>
    </div>
  );
}