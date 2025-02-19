import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, CheckCircle, XCircle, Clock, Shield, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAdminStore } from '@/lib/store/adminStore';

export function UserApprovals() {
  const { 
    users,
    loading,
    error,
    fetchUsers,
    updateUserRole,
    deleteUser
  } = useAdminStore();

  const [filter, setFilter] = React.useState<'all' | 'creator' | 'user'>('all');
  const [actionInProgress, setActionInProgress] = React.useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId: string, newRole: 'user' | 'creator' | 'admin') => {
    try {
      setActionInProgress(userId);
      await updateUserRole(userId, newRole);
    } catch (error) {
      console.error('Failed to update user role:', error);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        setActionInProgress(userId);
        await deleteUser(userId);
      } catch (error) {
        console.error('Failed to delete user:', error);
      } finally {
        setActionInProgress(null);
      }
    }
  };

  const filteredUsers = users.filter(user => {
    if (filter === 'all') return true;
    return user.role === filter;
  });

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-sand-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      <div className="flex gap-4 mb-6">
        <Button
          variant={filter === 'all' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All Users
        </Button>
        <Button
          variant={filter === 'creator' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('creator')}
        >
          Creators
        </Button>
        <Button
          variant={filter === 'user' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('user')}
        >
          Users
        </Button>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sand-400">No users found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-earth-800/50 p-6 rounded-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src={user.profile_image || `https://api.dicebear.com/7.x/initials/svg?seed=${user.full_name}&backgroundColor=1d1918&textColor=e8e4dc`}
                    alt={user.full_name}
                    className="w-12 h-12 rounded-lg object-cover bg-earth-800"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-sand-100">{user.full_name}</h3>
                    <p className="text-sand-400">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as 'user' | 'creator' | 'admin')}
                    className="px-3 py-1 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
                    disabled={actionInProgress === user.id}
                  >
                    <option value="user">User</option>
                    <option value="creator">Creator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              {user.bio && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-sand-300 mb-2">Bio</h4>
                  <p className="text-sand-400">{user.bio}</p>
                </div>
              )}

              <div className="flex justify-end gap-4 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-500 hover:text-red-400"
                  onClick={() => handleDelete(user.id)}
                  disabled={actionInProgress === user.id}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}