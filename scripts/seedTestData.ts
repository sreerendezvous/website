import { seedTestData } from '../src/lib/supabase/__tests__/seedTestData';
import { cleanTestData } from '../src/lib/supabase/__tests__/cleanTestData';

async function main() {
  try {
    // Clean existing test data first
    await cleanTestData();
    
    // Seed new test data
    await seedTestData();
    
    console.log('Test data setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up test data:', error);
    process.exit(1);
  }
}

main();