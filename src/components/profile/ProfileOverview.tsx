import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Globe, Calendar } from 'lucide-react';
import type { User } from '@/types';

interface ProfileOverviewProps {
  user: User;
}

export function ProfileOverview({ user }: ProfileOverviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-earth-800/50 p-6 rounded-lg"
    >
      <h3 className="text-xl font-display mb-4">About</h3>
      <p className="text-sand-300 mb-6">{user.bio || 'No bio provided'}</p>

      <div className="space-y-4">
        {user.other_social_links?.website && (
          <div className="flex items-center gap-2 text-sand-400">
            <Globe className="h-5 w-5" />
            <a
              href={user.other_social_links.website}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-sand-300 transition-colors"
            >
              {new URL(user.other_social_links.website).hostname}
            </a>
          </div>
        )}

        <div className="flex items-center gap-2 text-sand-400">
          <Calendar className="h-5 w-5" />
          <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </motion.div>
  );
}