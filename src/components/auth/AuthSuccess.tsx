import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

interface AuthSuccessProps {
  message: string;
  submessage?: string;
}

export function AuthSuccess({ message, submessage }: AuthSuccessProps) {
  return (
    <motion.div 
      className="text-center py-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2 }}
        className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center"
      >
        <CheckCircle className="w-8 h-8 text-green-500" />
      </motion.div>
      <h2 className="text-2xl font-display text-sand-100 mb-4">{message}</h2>
      {submessage && (
        <p className="text-sand-300">{submessage}</p>
      )}
    </motion.div>
  );
}