import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { UserApprovals } from '@/components/admin/UserApprovals';
import { ExperienceApprovals } from '@/components/admin/ExperienceApprovals';
import { useAuth } from '@/lib/auth';
import { Shield } from 'lucide-react';

export function AdminDashboard() {
  const { user } = useAuth();

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <p className="text-sand-400">You must be an administrator to view this page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 bg-earth-900">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-12 w-12 rounded-full bg-sand-400/10 flex items-center justify-center">
            <Shield className="h-6 w-6 text-sand-400" />
          </div>
          <h1 className="text-3xl font-display">Admin Dashboard</h1>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="w-full">
            <TabsTrigger value="users">User Approvals</TabsTrigger>
            <TabsTrigger value="experiences">Experience Approvals</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UserApprovals />
          </TabsContent>

          <TabsContent value="experiences">
            <ExperienceApprovals />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}