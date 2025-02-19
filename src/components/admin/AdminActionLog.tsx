import React, { useEffect } from 'react';
import { History, User, Star, FileCheck, Shield } from 'lucide-react';
import { useAdminStore } from '@/lib/store/adminStore';

export function AdminActionLog() {
  const { 
    adminActions, 
    loading,
    error,
    fetchAdminActions 
  } = useAdminStore();

  useEffect(() => {
    fetchAdminActions();
  }, [fetchAdminActions]);

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <User className="h-5 w-5" />;
      case 'creator':
        return <Star className="h-5 w-5" />;
      case 'experience':
        return <FileCheck className="h-5 w-5" />;
      case 'verification':
        return <Shield className="h-5 w-5" />;
      default:
        return <History className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-sand-400">Loading activity log...</p>
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

  if (!adminActions?.length) {
    return (
      <div className="text-center py-12">
        <p className="text-sand-400">No admin actions recorded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-earth-800/50 rounded-lg overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-display mb-6">Admin Activity Log</h2>
          
          <div className="space-y-4">
            {adminActions.map((action) => (
              <div
                key={action.id}
                className="flex items-start gap-4 p-4 bg-earth-800 rounded-lg"
              >
                <div className="h-10 w-10 rounded-full bg-earth-700/50 flex items-center justify-center text-sand-400">
                  {getActionIcon(action.target_type)}
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-sand-100">
                        {action.action_type.charAt(0).toUpperCase() + action.action_type.slice(1)}
                      </h3>
                      <p className="text-sm text-sand-400">
                        {action.admin.name} • {action.target_type}
                      </p>
                    </div>
                    <span className="text-sm text-sand-400">
                      {new Date(action.created_at).toLocaleString()}
                    </span>
                  </div>
                  
                  {action.details && (
                    <div className="mt-2 text-sm text-sand-300">
                      <pre className="whitespace-pre-wrap font-mono bg-earth-900/50 p-2 rounded">
                        {JSON.stringify(action.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}