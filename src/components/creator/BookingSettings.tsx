import React from 'react';
import { Shield, Users, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase/client';
import type { Experience } from '@/types';

interface BookingSettingsProps {
  experience: Experience;
  onUpdate: () => void;
}

export function BookingSettings({ experience, onUpdate }: BookingSettingsProps) {
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleBookingTypeChange = async (type: 'instant' | 'request') => {
    try {
      setIsUpdating(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('experiences')
        .update({
          booking_type: type,
          updated_at: new Date().toISOString()
        })
        .eq('id', experience.id);

      if (updateError) throw updateError;
      onUpdate();
    } catch (err) {
      console.error('Failed to update booking type:', err);
      setError(err instanceof Error ? err.message : 'Failed to update booking type');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRequirementsUpdate = async (requireApproval: boolean, description?: string) => {
    try {
      setIsUpdating(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('experiences')
        .update({
          approval_required: requireApproval,
          requirements_description: description || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', experience.id);

      if (updateError) throw updateError;
      onUpdate();
    } catch (err) {
      console.error('Failed to update requirements:', err);
      setError(err instanceof Error ? err.message : 'Failed to update requirements');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Booking Type Selection */}
      <div className="bg-earth-800/50 p-6 rounded-lg">
        <h3 className="text-xl font-display mb-4">Booking Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => handleBookingTypeChange('instant')}
            disabled={isUpdating}
            className={`p-4 rounded-lg border-2 transition-colors ${
              experience.booking_type === 'instant'
                ? 'border-green-500 bg-green-500/10'
                : 'border-earth-700 hover:border-sand-400'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-green-400" />
              <h4 className="font-medium text-sand-100">Instant Book</h4>
            </div>
            <p className="text-sm text-sand-400">
              Guests can book instantly without approval
            </p>
          </button>

          <button
            onClick={() => handleBookingTypeChange('request')}
            disabled={isUpdating}
            className={`p-4 rounded-lg border-2 transition-colors ${
              experience.booking_type === 'request'
                ? 'border-yellow-500 bg-yellow-500/10'
                : 'border-earth-700 hover:border-sand-400'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-yellow-400" />
              <h4 className="font-medium text-sand-100">Request to Join</h4>
            </div>
            <p className="text-sm text-sand-400">
              Review and approve guest requests before booking
            </p>
          </button>
        </div>
      </div>

      {/* Requirements Settings */}
      {experience.booking_type === 'request' && (
        <div className="bg-earth-800/50 p-6 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-sand-400" />
            <h3 className="text-xl font-display">Guest Requirements</h3>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={experience.approval_required}
                onChange={(e) => handleRequirementsUpdate(e.target.checked, experience.requirements_description)}
                disabled={isUpdating}
                className="rounded bg-earth-700 border-earth-600 text-sand-500 focus:ring-sand-400"
              />
              <span className="text-sand-300">Require approval for all bookings</span>
            </label>

            {experience.approval_required && (
              <div>
                <label className="block text-sm font-medium text-sand-300 mb-2">
                  Requirements Description
                </label>
                <textarea
                  value={experience.requirements_description || ''}
                  onChange={(e) => handleRequirementsUpdate(true, e.target.value)}
                  disabled={isUpdating}
                  rows={4}
                  placeholder="Describe any requirements or qualifications guests should meet..."
                  className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}
    </div>
  );
}