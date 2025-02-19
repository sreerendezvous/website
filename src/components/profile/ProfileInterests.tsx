import React from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import type { User } from '@/types';

interface ProfileInterestsProps {
  user: User;
}

// Define available interests
const availableInterests = [
  'Art & Culture',
  'Food & Drink',
  'Music',
  'Nature',
  'Photography',
  'Sports',
  'Technology',
  'Travel',
  'Wellness',
  'Writing',
  'Fashion',
  'Film',
  'Dance',
  'History',
  'Science',
  'Language'
];

export function ProfileInterests({ user }: ProfileInterestsProps) {
  const { completeProfile } = useAuth();
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [selectedInterests, setSelectedInterests] = React.useState<string[]>(
    user.interests || []
  );

  const toggleInterest = async (interest: string) => {
    try {
      setIsUpdating(true);
      const newInterests = selectedInterests.includes(interest)
        ? selectedInterests.filter(i => i !== interest)
        : [...selectedInterests, interest];
      
      setSelectedInterests(newInterests);
      await completeProfile({ interests: newInterests });
    } catch (error) {
      console.error('Failed to update interests:', error);
      // Revert selection on error
      setSelectedInterests(user.interests || []);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-earth-800/50 p-6 rounded-lg"
    >
      <div className="flex items-center gap-2 mb-4">
        <Heart className="h-5 w-5 text-sand-400" />
        <h3 className="text-xl font-display">Interests</h3>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {availableInterests.map((interest) => {
          const isSelected = selectedInterests.includes(interest);
          return (
            <button
              key={interest}
              onClick={() => !isUpdating && toggleInterest(interest)}
              disabled={isUpdating}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                isSelected
                  ? 'bg-sand-400/20 text-sand-100 hover:bg-sand-400/30'
                  : 'bg-earth-700/50 text-sand-400 hover:bg-earth-700'
              }`}
            >
              {interest}
            </button>
          );
        })}
      </div>

      {isUpdating && (
        <p className="text-sm text-sand-400 mt-4">Updating interests...</p>
      )}
    </motion.div>
  );
}