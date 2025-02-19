import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Users, FileCheck, History } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function AdminNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/admin', label: 'Overview', icon: Shield },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/experiences', label: 'Experiences', icon: FileCheck },
    { path: '/admin/activity', label: 'Activity Log', icon: History }
  ];

  return (
    <nav className="bg-earth-800/50 p-4 rounded-lg">
      <div className="space-y-2">
        {navItems.map(({ path, label, icon: Icon }) => (
          <Button
            key={path}
            variant={location.pathname === path ? 'primary' : 'outline'}
            className="w-full justify-start"
            onClick={() => navigate(path)}
          >
            <Icon className="h-4 w-4 mr-2" />
            {label}
          </Button>
        ))}
      </div>
    </nav>
  );
}