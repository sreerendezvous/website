import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, FileCheck, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { adminService } from '@/lib/services/admin';
import type { User, Experience } from '@/types';

export function AdminOverviewPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [adminActions, setAdminActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [usersData, experiencesData, actionsData] = await Promise.all([
        adminService.getUsers(),
        adminService.getExperiences(),
        adminService.getAdminActions()
      ]);
      setUsers(usersData);
      setExperiences(experiencesData);
      setAdminActions(actionsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate counts
  const pendingUsersCount = users?.filter(user => user.status === 'pending').length || 0;
  const pendingExperiencesCount = experiences?.filter(exp => exp.status === 'pending').length || 0;

  const stats = [
    {
      label: 'Pending Users',
      value: pendingUsersCount,
      change: '+5%',
      trend: 'up',
      icon: Users,
      color: 'bg-blue-500/20',
      textColor: 'text-blue-400',
      path: '/admin/users'
    },
    {
      label: 'Pending Experiences',
      value: pendingExperiencesCount,
      change: '-3%',
      trend: 'down',
      icon: FileCheck,
      color: 'bg-green-500/20',
      textColor: 'text-green-400',
      path: '/admin/experiences'
    }
  ];

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-sand-400">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="h-12 w-12 rounded-full bg-sand-400/10 flex items-center justify-center">
          <Shield className="h-6 w-6 text-sand-400" />
        </div>
        <div>
          <h1 className="text-3xl font-display">Admin Dashboard</h1>
          <p className="text-sand-400">Platform overview and quick actions</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats.map(({ label, value, change, trend, icon: Icon, color, textColor, path }) => (
          <div 
            key={label}
            className="bg-earth-800/50 p-6 rounded-lg cursor-pointer hover:bg-earth-800/70 transition-colors"
            onClick={() => navigate(path)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`h-12 w-12 rounded-full ${color} flex items-center justify-center ${textColor}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div className={`flex items-center ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                {trend === 'up' ? <ArrowUp className="h-4 w-4 mr-1" /> : <ArrowDown className="h-4 w-4 mr-1" />}
                <span>{change}</span>
              </div>
            </div>
            <h3 className="text-2xl font-display text-sand-100 mb-1">{value}</h3>
            <p className="text-sm text-sand-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-earth-800/50 p-6 rounded-lg">
          <h2 className="text-xl font-display mb-6">Recent Activity</h2>
          <div className="space-y-4">
            {(adminActions || []).slice(0, 5).map((action) => (
              <div key={action.id} className="flex items-start gap-4">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  action.action_type === 'approve' ? 'bg-green-500/20 text-green-400' :
                  action.action_type === 'reject' ? 'bg-red-500/20 text-red-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  {action.action_type === 'approve' ? <FileCheck className="h-4 w-4" /> :
                   action.action_type === 'reject' ? <Shield className="h-4 w-4" /> :
                   <Users className="h-4 w-4" />}
                </div>
                <div>
                  <p className="text-sand-100">
                    <span className="font-medium">{action.admin?.full_name}</span>
                    {' '}
                    {action.action_type}d a {action.target_type}
                  </p>
                  <p className="text-sm text-sand-400">
                    {new Date(action.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Button 
            variant="outline" 
            className="w-full mt-4"
            onClick={() => navigate('/admin/activity')}
          >
            View All Activity
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="bg-earth-800/50 p-6 rounded-lg">
          <h2 className="text-xl font-display mb-6">Quick Actions</h2>
          <div className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/admin/users')}
            >
              <Users className="h-4 w-4 mr-2" />
              Review User Applications
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/admin/experiences')}
            >
              <FileCheck className="h-4 w-4 mr-2" />
              Review Experience Submissions
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}