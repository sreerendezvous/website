import { supabase } from '../client';
import type { User, Experience } from '@/types';

interface AdminAction {
  adminId: string;
  actionType: string;
  targetType: string;
  targetId: string;
  details?: Record<string, any>;
}

class AdminService {
  private async getAdminUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (!user) throw new Error('Not authenticated');

      const { data: adminUser, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;
      if (!adminUser || adminUser.role !== 'admin') {
        throw new Error('Unauthorized: Only admins can perform this action');
      }

      return user;
    } catch (error) {
      console.error('Admin authorization error:', error);
      throw error;
    }
  }

  async approveUser(userId: string): Promise<User> {
    try {
      const admin = await this.getAdminUser();

      const { data, error } = await supabase
        .rpc('approve_user', { 
          user_id_param: userId,
          admin_id_param: admin.id
        });

      if (error) throw error;
      if (!data) throw new Error('Failed to approve user');

      return data;
    } catch (error) {
      console.error('Failed to approve user:', error);
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      await this.getAdminUser();

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch users:', error);
      throw error;
    }
  }

  async getPendingUsers(): Promise<User[]> {
    try {
      await this.getAdminUser();

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch pending users:', error);
      throw error;
    }
  }

  async getPendingCreators(): Promise<any[]> {
    try {
      await this.getAdminUser();

      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          creator_profiles!inner(*)
        `)
        .eq('role', 'creator')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch pending creators:', error);
      throw error;
    }
  }

  async getPendingVerifications(): Promise<any[]> {
    try {
      await this.getAdminUser();

      const { data, error } = await supabase
        .from('creator_verifications')
        .select(`
          *,
          creator:creator_profiles!creator_id (
            id,
            business_name,
            user:users!user_id (
              full_name,
              email
            )
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch pending verifications:', error);
      throw error;
    }
  }

  async getPendingExperiences(): Promise<Experience[]> {
    try {
      await this.getAdminUser();

      const { data, error } = await supabase
        .from('experiences')
        .select(`
          *,
          creator:users!creator_id (
            id,
            full_name,
            email,
            bio
          ),
          category:categories (
            name,
            icon
          ),
          media:experience_media (
            url,
            type,
            order_index
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch pending experiences:', error);
      throw error;
    }
  }

  async getAdminActions(): Promise<any[]> {
    try {
      await this.getAdminUser();

      const { data, error } = await supabase
        .from('admin_actions')
        .select(`
          *,
          admin:users!admin_id (
            full_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch admin actions:', error);
      throw error;
    }
  }

  async rejectUser(userId: string): Promise<User> {
    try {
      const admin = await this.getAdminUser();

      const { data: user, error } = await supabase
        .from('users')
        .update({ 
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      if (!user) throw new Error('User not found');

      await this.logAction({
        adminId: admin.id,
        actionType: 'reject',
        targetType: 'user',
        targetId: userId
      });

      return user;
    } catch (error) {
      console.error('Failed to reject user:', error);
      throw error;
    }
  }

  async updateUserRole(userId: string, newRole: 'user' | 'creator' | 'admin'): Promise<void> {
    try {
      const admin = await this.getAdminUser();

      const { error } = await supabase.rpc('update_user_role', {
        user_id_param: userId,
        new_role: newRole,
        admin_id: admin.id
      });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to update user role:', error);
      throw error;
    }
  }

  async approveCreator(userId: string): Promise<any> {
    try {
      const admin = await this.getAdminUser();

      const { data: result, error } = await supabase
        .rpc('approve_creator_application', {
          user_id_param: userId,
          admin_id_param: admin.id
        });

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Failed to approve creator:', error);
      throw error;
    }
  }

  async rejectCreator(userId: string): Promise<any> {
    try {
      const admin = await this.getAdminUser();

      const { data: result, error } = await supabase
        .from('users')
        .update({ 
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      if (!result) throw new Error('Creator not found');

      await this.logAction({
        adminId: admin.id,
        actionType: 'reject',
        targetType: 'creator',
        targetId: userId
      });

      return result;
    } catch (error) {
      console.error('Failed to reject creator:', error);
      throw error;
    }
  }

  async approveVerification(verificationId: string): Promise<any> {
    try {
      const admin = await this.getAdminUser();

      const { data: verification, error } = await supabase
        .from('creator_verifications')
        .update({
          status: 'verified',
          verified_by: admin.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', verificationId)
        .select()
        .single();

      if (error) throw error;
      if (!verification) throw new Error('Verification not found');

      await this.logAction({
        adminId: admin.id,
        actionType: 'verify',
        targetType: 'verification',
        targetId: verificationId
      });

      return verification;
    } catch (error) {
      console.error('Failed to approve verification:', error);
      throw error;
    }
  }

  async rejectVerification(verificationId: string): Promise<any> {
    try {
      const admin = await this.getAdminUser();

      const { data: verification, error } = await supabase
        .from('creator_verifications')
        .update({
          status: 'rejected',
          verified_by: admin.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', verificationId)
        .select()
        .single();

      if (error) throw error;
      if (!verification) throw new Error('Verification not found');

      await this.logAction({
        adminId: admin.id,
        actionType: 'reject',
        targetType: 'verification',
        targetId: verificationId
      });

      return verification;
    } catch (error) {
      console.error('Failed to reject verification:', error);
      throw error;
    }
  }

  async approveExperience(experienceId: string): Promise<Experience> {
    try {
      const admin = await this.getAdminUser();

      const { data: experience, error } = await supabase
        .from('experiences')
        .update({ 
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', experienceId)
        .select()
        .single();

      if (error) throw error;
      if (!experience) throw new Error('Experience not found');

      await this.logAction({
        adminId: admin.id,
        actionType: 'approve',
        targetType: 'experience',
        targetId: experienceId
      });

      return experience;
    } catch (error) {
      console.error('Failed to approve experience:', error);
      throw error;
    }
  }

  async rejectExperience(experienceId: string): Promise<Experience> {
    try {
      const admin = await this.getAdminUser();

      const { data: experience, error } = await supabase
        .from('experiences')
        .update({ 
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', experienceId)
        .select()
        .single();

      if (error) throw error;
      if (!experience) throw new Error('Experience not found');

      await this.logAction({
        adminId: admin.id,
        actionType: 'reject',
        targetType: 'experience',
        targetId: experienceId
      });

      return experience;
    } catch (error) {
      console.error('Failed to reject experience:', error);
      throw error;
    }
  }

  async deleteExperience(experienceId: string): Promise<void> {
    try {
      const admin = await this.getAdminUser();

      // Delete experience media first
      const { error: mediaError } = await supabase
        .from('experience_media')
        .delete()
        .eq('experience_id', experienceId);

      if (mediaError) throw mediaError;

      // Delete the experience
      const { error: expError } = await supabase
        .from('experiences')
        .delete()
        .eq('id', experienceId);

      if (expError) throw expError;

      await this.logAction({
        adminId: admin.id,
        actionType: 'delete',
        targetType: 'experience',
        targetId: experienceId
      });
    } catch (error) {
      console.error('Failed to delete experience:', error);
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      const admin = await this.getAdminUser();

      const { error: deleteError } = await supabase.rpc('delete_user_data', {
        user_id_param: userId
      });

      if (deleteError) throw deleteError;

      await this.logAction({
        adminId: admin.id,
        actionType: 'delete',
        targetType: 'user',
        targetId: userId,
        details: {
          action: 'user_deletion',
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to delete user:', error);
      throw error;
    }
  }

  async deleteUserByEmail(email: string): Promise<void> {
    try {
      const admin = await this.getAdminUser();

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (userError) throw userError;
      if (!user) throw new Error('User not found');

      await this.deleteUser(user.id);
    } catch (error) {
      console.error('Failed to delete user:', error);
      throw error;
    }
  }

  private async logAction(action: AdminAction): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('admin_actions')
        .insert({
          admin_id: action.adminId,
          action_type: action.actionType,
          target_type: action.targetType,
          target_id: action.targetId,
          details: action.details
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Failed to log admin action');

      return data;
    } catch (error) {
      console.error('Failed to log admin action:', error);
      throw error;
    }
  }
}

export const adminService = new AdminService();