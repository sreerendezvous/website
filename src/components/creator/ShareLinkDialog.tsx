import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Experience } from '@/types';

interface ShareLinkDialogProps {
  experience: Experience | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareLinkDialog({ experience, isOpen, onClose }: ShareLinkDialogProps) {
  const [copied, setCopied] = React.useState(false);
  const shareLink = experience ? `${window.location.origin}/experiences/${experience.id}?key=${experience.shareKey}` : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-earth-900 p-6 rounded-lg shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <Dialog.Title className="text-xl font-display">
              Share Experience
            </Dialog.Title>
            <Dialog.Close className="text-sand-400 hover:text-sand-300">
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>

          <p className="text-sand-400 mb-4">
            Share this private link with people you want to invite to your experience.
            They will need to create an account to book.
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              value={shareLink}
              readOnly
              className="flex-1 px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none"
            />
            <Button onClick={handleCopy}>
              {copied ? (
                <Check className="h-5 w-5 mr-2" />
              ) : (
                <Copy className="h-5 w-5 mr-2" />
              )}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}