import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { creatorService } from '../services/creator';
import { createTestUser, cleanupTestData } from './helpers';

describe('Creator Service', () => {
  let testUser;

  beforeEach(async () => {
    testUser = await createTestUser();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  describe('Application Process', () => {
    it('should submit creator application', async () => {
      const applicationData = {
        userId: testUser.id,
        businessName: 'Test Creator Business',
        bio: 'Test creator bio',
        specialties: ['cooking', 'teaching'],
        experience: '5 years of professional experience',
        certifications: [
          { name: 'Test Cert', issuer: 'Test Issuer', year: 2023 }
        ]
      };

      const application = await creatorService.submitApplication(applicationData);
      expect(application.status).toBe('pending');
      expect(application.user_id).toBe(testUser.id);
    });

    it('should get application status', async () => {
      const status = await creatorService.getApplicationStatus(testUser.id);
      expect(status).toBeDefined();
    });
  });

  describe('Profile Management', () => {
    it('should update creator profile', async () => {
      const profileData = {
        businessName: 'Updated Business Name',
        bio: 'Updated bio',
        specialties: ['updated specialty']
      };

      const profile = await creatorService.updateProfile(testUser.id, profileData);
      expect(profile.business_name).toBe(profileData.businessName);
    });
  });

  describe('Verification Process', () => {
    it('should submit verification request', async () => {
      const verificationData = {
        documentType: 'id',
        documentNumber: '123456',
        issuingCountry: 'US'
      };

      const verification = await creatorService.submitVerification(
        testUser.id,
        'identity',
        verificationData
      );
      
      expect(verification.status).toBe('pending');
      expect(verification.type).toBe('identity');
    });

    it('should get verification status', async () => {
      const verifications = await creatorService.getVerificationStatus(testUser.id);
      expect(Array.isArray(verifications)).toBe(true);
    });
  });
});