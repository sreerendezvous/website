import React from 'react';
import { Settings, Layout, Calendar, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';
import type { User } from '@/types';

interface QuickActionsProps {
  user: User;
}

export function QuickActions({ user }: QuickActionsProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-earth-800/50 p-6 rounded-lg">
      <h3 className="text-xl font-display mb-4">Quick Actions</h3>
      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => navigate('/bookings')}
        >
          <Calendar className="h-4 w-4 mr-2" />
          View Bookings
        </Button>

        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => navigate('/settings')}
        >
          <Settings className="h-4 w-4 mr-2" />
          Account Settings
        </Button>

        {user.role === 'creator' && (
          <>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate('/creator/dashboard')}
            >
              <Layout className="h-4 w-4 mr-2" />
              Creator Dashboard
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate('/messages')}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Messages
            </Button>
          </>
        )}
      </div>
    </div>
  );
}