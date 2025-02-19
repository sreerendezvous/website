import React from 'react';
import { Instagram, Linkedin, Globe } from 'lucide-react';
import { UseFormRegister } from 'react-hook-form';
import type { SignUpSchema } from '@/lib/supabase/utils/validation';

interface SocialLinksProps {
  register: UseFormRegister<SignUpSchema>;
}

export function SocialLinks({ register }: SocialLinksProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-sand-300">Social Media (Optional)</h3>
      
      <div className="relative">
        <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-sand-400" />
        <input
          {...register('instagram')}
          className="w-full pl-10 pr-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
          placeholder="Instagram username"
        />
      </div>

      <div className="relative">
        <Linkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-sand-400" />
        <input
          {...register('linkedin')}
          className="w-full pl-10 pr-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
          placeholder="LinkedIn profile URL"
        />
      </div>

      <div className="relative">
        <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-sand-400" />
        <input
          {...register('website')}
          className="w-full pl-10 pr-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
          placeholder="Personal website URL"
        />
      </div>
    </div>
  );
}