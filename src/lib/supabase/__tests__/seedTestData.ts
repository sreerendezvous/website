import { supabase } from '../client';

export async function seedTestData() {
  try {
    // Create test users with different roles and statuses
    const users = [
      {
        email: 'test.user1@example.com',
        full_name: 'Test User 1',
        role: 'user',
        status: 'pending',
        bio: 'I love discovering new experiences!'
      },
      {
        email: 'test.user2@example.com',
        full_name: 'Test User 2',
        role: 'user',
        status: 'approved',
        bio: 'Adventure seeker and culture enthusiast'
      },
      {
        email: 'test.creator1@example.com',
        full_name: 'Test Creator 1',
        role: 'creator',
        status: 'pending',
        bio: 'Professional chef with 10 years of experience'
      },
      {
        email: 'test.creator2@example.com',
        full_name: 'Test Creator 2',
        role: 'creator',
        status: 'approved',
        bio: 'Certified yoga instructor and wellness coach'
      }
    ];

    // Insert test users
    const { data: createdUsers, error: usersError } = await supabase
      .from('users')
      .insert(users)
      .select();

    if (usersError) throw usersError;

    // Create test creator profiles
    const creatorProfiles = createdUsers
      ?.filter(user => user.role === 'creator')
      .map(user => ({
        user_id: user.id,
        business_name: `${user.full_name}'s Business`,
        approval_status: user.status,
        rating: 4.5,
        reviews_count: 10
      }));

    const { data: creators, error: creatorsError } = await supabase
      .from('creator_profiles')
      .insert(creatorProfiles)
      .select();

    if (creatorsError) throw creatorsError;

    // Create test experiences
    const experiences = creators?.map(creator => ({
      creator_id: creator.user_id,
      title: `Test Experience by ${creator.business_name}`,
      description: 'A wonderful test experience that you\'ll never forget!',
      price: 99.99,
      location: 'Test Location',
      duration: 120,
      max_participants: 10,
      status: 'pending',
      image_url: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205'
    }));

    const { error: experiencesError } = await supabase
      .from('experiences')
      .insert(experiences);

    if (experiencesError) throw experiencesError;

    // Create test verifications
    const verifications = creators?.map(creator => ({
      creator_id: creator.id,
      type: 'identity',
      status: 'pending',
      verification_data: {
        document_type: 'passport',
        document_number: '123456789',
        issuing_country: 'US'
      }
    }));

    const { error: verificationsError } = await supabase
      .from('creator_verifications')
      .insert(verifications);

    if (verificationsError) throw verificationsError;

    console.log('Test data seeded successfully!');
    return { users: createdUsers, creators, experiences };

  } catch (error) {
    console.error('Error seeding test data:', error);
    throw error;
  }
}