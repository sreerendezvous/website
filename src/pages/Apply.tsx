import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { useAuth } from '@/lib/auth';

export function Apply() {
  const { type } = useParams<{ type: 'user' | 'creator' }>();
  const { user } = useAuth();

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/profile" replace />;
  }

  // Validate application type
  if (!type || !['user', 'creator'].includes(type)) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen pt-20 pb-12 bg-earth-900">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <h1 className="text-3xl font-display mb-4">
            {type === 'creator' ? 'Become a Creator' : 'Join Our Community'}
          </h1>
          <p className="text-sand-400 mb-8">
            {type === 'creator'
              ? 'Share your passion and create unique experiences for others to enjoy.'
              : 'Discover and book unique experiences from amazing creators.'}
          </p>
          
          <div className="bg-earth-800/50 p-6 rounded-lg">
            <SignUpForm />
          </div>
        </motion.div>
      </div>
    </div>
  );
}