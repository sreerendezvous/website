import { supabase } from '../client';

export async function cleanTestData() {
  try {
    // Delete test experiences
    await supabase
      .from('experiences')
      .delete()
      .like('title', 'Test Experience%');

    // Delete test verifications
    await supabase
      .from('creator_verifications')
      .delete()
      .eq('status', 'pending');

    // Delete test creator profiles
    await supabase
      .from('creator_profiles')
      .delete()
      .like('business_name', 'Test%');

    // Delete test users
    await supabase
      .from('users')
      .delete()
      .like('email', 'test.%@example.com');

    console.log('Test data cleaned successfully!');
  } catch (error) {
    console.error('Error cleaning test data:', error);
    throw error;
  }
}