import React from 'react';
import { User, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { User as UserType } from '@/types';

// Mock data - replace with actual API call
const mockApplications: UserType[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    bio: 'Passionate about discovering unique experiences...',
    role: 'user',
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // Add more mock applications...
];

export function UserApplications() {
  const handleApprove = async (userId: string) => {
    // Implement approval logic
    console.log('Approving user:', userId);
  };

  const handleReject = async (userId: string) => {
    // Implement rejection logic
    console.log('Rejecting user:', userId);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        {mockApplications.map((application) => (
          <div
            key={application.id}
            className="bg-dark-200 rounded-lg p-6 space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-dark-300 flex items-center justify-center">
                  <User className="h-6 w-6 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{application.name}</h3>
                  <p className="text-gray-400">{application.email}</p>
                </div>
              </div>
              <ApplicationStatus status={application.status} />
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Bio</h4>
              <p className="text-gray-400">{application.bio}</p>
            </div>

            <div className="flex items-center justify-end gap-4">
              <Button
                variant="outline"
                size="sm"
                className="text-red-500 hover:text-red-400"
                onClick={() => handleReject(application.id)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                size="sm"
                onClick={() => handleApprove(application.id)}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ApplicationStatus({ status }: { status: UserType['status'] }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
      status === 'approved' ? 'bg-green-500/20 text-green-400' :
      status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
      'bg-red-500/20 text-red-400'
    }`}>
      {status === 'approved' ? <CheckCircle className="h-4 w-4" /> :
       status === 'pending' ? <Clock className="h-4 w-4" /> :
       <XCircle className="h-4 w-4" />}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </div>
  );
}