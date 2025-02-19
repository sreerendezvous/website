import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { SignInForm } from './SignInForm';
import { SignUpForm } from './SignUpForm';
import { AuthSuccess } from './AuthSuccess';
import { useAuth } from '@/lib/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'sign-in' | 'sign-up';
  redirectTo?: string;
}

export function AuthModal({ isOpen, onClose, defaultTab = 'sign-in', redirectTo }: AuthModalProps) {
  const { error, clearError } = useAuth();
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState('');

  React.useEffect(() => {
    if (!isOpen) {
      clearError();
      setShowSuccess(false);
    }
  }, [isOpen, clearError]);

  const handleSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccess(true);
    setTimeout(() => {
      onClose();
      setShowSuccess(false);
    }, 2000);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-earth-900/80 backdrop-blur-sm z-40" />
        <Dialog.Content className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-md bg-earth-800 rounded-lg shadow-xl z-50 flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-earth-700">
            <Dialog.Title className="text-2xl font-display text-sand-100">
              Welcome to rendezvous
            </Dialog.Title>
            <Dialog.Close className="text-sand-400 hover:text-sand-300">
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {showSuccess ? (
              <AuthSuccess 
                message={successMessage}
                submessage={defaultTab === 'sign-up' ? 
                  "You can now sign in to your account." :
                  "You're now signed in."
                }
              />
            ) : (
              <div className="p-6">
                <Tabs defaultValue={defaultTab} className="space-y-6">
                  <TabsList className="w-full">
                    <TabsTrigger value="sign-in" className="flex-1">Sign In</TabsTrigger>
                    <TabsTrigger value="sign-up" className="flex-1">Sign Up</TabsTrigger>
                  </TabsList>

                  <TabsContent value="sign-in">
                    <SignInForm 
                      onSuccess={() => handleSuccess("Welcome back!")}
                    />
                  </TabsContent>

                  <TabsContent value="sign-up">
                    <SignUpForm 
                      onSuccess={() => handleSuccess("Account created successfully!")}
                      redirectTo={redirectTo}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 border-t border-earth-700">
              <p className="text-sm text-red-500 text-center">{error}</p>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}