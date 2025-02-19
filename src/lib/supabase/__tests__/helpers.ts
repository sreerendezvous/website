import { supabase } from '../client';
import type { User } from '@/types';

export async function createTestUser(data: Partial<User> = {}): Promise<User> {
  const { data: user, error } = await supabase
    .from('users')
    .insert({
      email: `test-${Date.now()}@example.com`,
      full_name: `Test User ${Date.now()}`,
      role: data.role || 'user',
      ...data
    })
    .select()
    .single();

  if (error) throw error;
  return user;
}

export async function cleanupTestData() {
  // Clean up test users
  await supabase
    .from('users')
    .delete()
    .like('email', 'test-%@example.com');

  // Clean up test creator profiles
  await supabase
    .from('creator_profiles')
    .delete()
    .like('business_name', 'Test Creator%');

  // Clean up test admin actions
  await supabase
    .from('admin_actions')
    .delete()
    .eq('action_type', 'test');
}