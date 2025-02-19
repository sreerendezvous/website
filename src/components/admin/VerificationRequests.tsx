import React from 'react';
import { Shield, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/lib/store';

export function VerificationRequests() {
  const { pendingVerifications, approveVerification, rejectVerification } = useStore();

  const handleApprove = async (verificationId: string) => {
    try {
      await approveVerification(verificationId);
    } catch (error) {
      console.error('Failed to approve verification:', error);
    }
  };

  const handleReject = async (verificationId: string) => {
    try {
      await rejectVerification(verificationId);
    } catch (error) {
      console.error('Failed to reject verification:', error);
    }
  };

  if (pendingVerifications.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sand-400">No pending verification requests</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {pendingVerifications.map((verification) => (
        <div
          key={verification.id}
          className="bg-earth-800/50 rounded-lg p-6"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-earth-700/50 flex items-center justify-center">
                <Shield className="h-6 w-6 text-sand-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-sand-100">
                  {verification.type.charAt(0).toUpperCase() + verification.type.slice(1)} Verification
                </h3>
                <p className="text-sand-400">Creator: {verification.creator.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400">
              <Clock className="h-4 w-4" />
              <span>Pending Review</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="text-red-500 hover:text-red-400"
              onClick={() => handleReject(verification.id)}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button
              onClick={() => handleApprove(verification.id)}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}