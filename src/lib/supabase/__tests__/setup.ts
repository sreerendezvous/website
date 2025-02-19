import { beforeAll } from 'vitest';
import { supabase } from '../client';

beforeAll(async () => {
  // Set up test environment
  const { data: { session }, error } = await supabase.auth.signInWithPassword({
    email: process.env.SUPABASE_TEST_USER_EMAIL!,
    password: process.env.SUPABASE_TEST_USER_PASSWORD!
  });

  if (error) {
    throw error;
  }

  // Set auth context for tests
  supabase.auth.setSession(session);
});