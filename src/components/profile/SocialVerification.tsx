import React from 'react';
import { motion } from 'framer-motion';
import { Instagram, Linkedin, Globe, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface SocialVerificationProps {
  onVerify: (platform: string) => Promise<void>;
  verificationStatus: Record<string, 'pending' | 'verified' | 'failed'>;
}

export function SocialVerification({ onVerify, verificationStatus }: SocialVerificationProps) {
  const [isVerifying, setIsVerifying] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleVerify = async (platform: string) => {
    try {
      setIsVerifying(platform);
      setError(null);
      await onVerify(platform);
    } catch (error) {
      console.error(`Failed to verify ${platform}:`, error);
      setError(error instanceof Error ? error.message : `Failed to verify ${platform}`);
    } finally {
      setIsVerifying(null);
    }
  };

  const platforms = [
    {
      id: 'instagram',
      name: 'Instagram',
      icon: Instagram,
      description: 'Verify your Instagram account to show your content'
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: Linkedin,
      description: 'Connect your professional profile'
    },
    {
      id: 'website',
      name: 'Website',
      icon: Globe,
      description: 'Verify ownership of your personal website'
    }
  ];

  return (
    <div className="space-y-6">
      {platforms.map((platform) => {
        const status = verificationStatus[platform.id];
        const Icon = platform.icon;

        return (
          <motion.div
            key={platform.id}
            className="bg-earth-800/50 p-6 rounded-lg"
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-earth-700/50 flex items-center justify-center">
                  <Icon className="h-6 w-6 text-sand-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-sand-100 mb-1">
                    {platform.name}
                  </h3>
                  <p className="text-sm text-sand-400">
                    {platform.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {status === 'verified' ? (
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="h-5 w-5" />
                    <span>Verified</span>
                  </div>
                ) : status === 'failed' ? (
                  <div className="flex items-center gap-2 text-red-400">
                    <XCircle className="h-5 w-5" />
                    <span>Failed</span>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVerify(platform.id)}
                    disabled={isVerifying === platform.id}
                  >
                    {isVerifying === platform.id ? 'Verifying...' : 'Verify'}
                  </Button>
                )}
              </div>
            </div>

            {error && platform.id === isVerifying && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}