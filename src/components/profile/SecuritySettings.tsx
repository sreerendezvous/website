import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Shield, Key } from 'lucide-react';

const passwordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
  confirmPassword: z.string().min(8),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export function SecuritySettings() {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = async (data: PasswordFormData) => {
    try {
      // Implement password change logic
      console.log('Password data:', data);
      reset();
    } catch (error) {
      console.error('Failed to change password:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-dark-200 p-6 rounded-lg">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-10 w-10 rounded-full bg-primary-500/20 flex items-center justify-center">
            <Key className="h-5 w-5 text-primary-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Change Password</h2>
            <p className="text-gray-400">Update your password to keep your account secure</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Current Password
            </label>
            <input
              {...register('currentPassword')}
              type="password"
              className="w-full rounded-md bg-dark-300 border-dark-400 text-white"
            />
            {errors.currentPassword && (
              <p className="mt-1 text-sm text-red-500">{errors.currentPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              New Password
            </label>
            <input
              {...register('newPassword')}
              type="password"
              className="w-full rounded-md bg-dark-300 border-dark-400 text-white"
            />
            {errors.newPassword && (
              <p className="mt-1 text-sm text-red-500">{errors.newPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Confirm New Password
            </label>
            <input
              {...register('confirmPassword')}
              type="password"
              className="w-full rounded-md bg-dark-300 border-dark-400 text-white"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </form>
      </div>

      <div className="bg-dark-200 p-6 rounded-lg">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center">
            <Shield className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Danger Zone</h2>
            <p className="text-gray-400">Permanently delete your account and all of your content</p>
          </div>
        </div>

        <Button
          variant="outline"
          className="text-red-500 hover:text-red-400"
          onClick={() => {
            // Implement account deletion logic
            console.log('Delete account clicked');
          }}
        >
          Delete Account
        </Button>
      </div>
    </div>
  );
}