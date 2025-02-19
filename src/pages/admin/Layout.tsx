import React from 'react';
import { Outlet } from 'react-router-dom';
import { AdminNav } from '@/components/admin/AdminNav';
import { useAuth } from '@/lib/auth';

export function AdminLayout() {
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <AdminNav />
          </div>
          <div className="md:col-span-3">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}