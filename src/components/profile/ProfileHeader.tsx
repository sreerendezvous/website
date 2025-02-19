import React from 'react';
import { motion } from 'framer-motion';
import { Camera, Star, Instagram, Globe } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth';
import { uploadMedia } from '@/lib/utils/media';
import type { User } from '@/types';

interface ProfileHeaderProps {
  user: User;
  isOwnProfile?: boolean;
}

export function ProfileHeader({ user, isOwnProfile = false }: ProfileHeaderProps) {
  const { completeProfile } = useAuth();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError(null);

      // Upload the image
      const imageUrl = await uploadMedia(file, user.id, 'profile');
      
      // Update the user profile
      await completeProfile({ profile_image: imageUrl });
    } catch (error) {
      console.error('Failed to upload image:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setUploading(false);
      // Clear the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="relative">
      {/* Cover Image */}
      <div className="h-48 md:h-64 bg-gradient-to-r from-earth-800 to-earth-700 rounded-xl overflow-hidden">
        <div className="absolute inset-0 bg-texture opacity-10"></div>
      </div>
      
      {/* Profile Content */}
      <div className="absolute -bottom-16 left-0 right-0 px-4 md:px-8">
        <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-8">
          {/* Profile Image */}
          <div className="relative group mx-auto md:mx-0">
            <img
              src={user.profile_image || `https://api.dicebear.com/7.x/initials/svg?seed=${user.full_name}&backgroundColor=1d1918&textColor=e8e4dc`}
              alt={user.full_name}
              className="w-32 h-32 rounded-xl border-4 border-earth-900 object-cover bg-earth-800 shadow-lg"
            />
            {isOwnProfile && (
              <Button
                size="sm"
                variant="secondary"
                className="absolute -bottom-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Camera className="h-4 w-4" />
              </Button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleImageUpload}
              disabled={uploading}
            />
          </div>
          
          {/* User Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
              <h1 className="text-3xl font-display text-sand-100">{user.full_name}</h1>
              {user.role === 'creator' && (
                <div className="flex items-center gap-1 bg-sand-400/10 px-2 py-1 rounded-full">
                  <Star className="h-4 w-4 text-sand-400" />
                  <span className="text-sm text-sand-400">Creator</span>
                </div>
              )}
            </div>
            
            {/* Social Links */}
            <div className="flex justify-center md:justify-start items-center gap-4 text-sand-400">
              {user.instagram && (
                <a
                  href={`https://instagram.com/${user.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-sand-300 transition-colors"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {user.other_social_links?.website && (
                <a
                  href={user.other_social_links.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-sand-300 transition-colors"
                >
                  <Globe className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="absolute top-4 right-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}
    </div>
  );
}