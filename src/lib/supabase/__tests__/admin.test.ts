import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { adminService } from '../services/admin';
import { createTestUser, cleanupTestData } from './helpers';

describe('Admin Service', () => {
  let testAdmin;
  let testUser;
  let testCreator;

  beforeEach(async () => {
    testAdmin = await createTestUser({ role: 'admin' });
    testUser = await createTestUser({ role: 'user', status: 'pending' });
    testCreator = await createTestUser({ role: 'creator' });
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  describe('User Management', () => {
    it('should fetch pending users', async () => {
      const users = await adminService.getPendingUsers();
      expect(Array.isArray(users)).toBe(true);
      expect(users.some(u => u.id === testUser.id)).toBe(true);
    });

    it('should approve user', async () => {
      const result = await adminService.approveUser(testUser.id);
      expect(result.status).toBe('approved');
    });

    it('should reject user', async () => {
      const result = await adminService.rejectUser(testUser.id);
      expect(result.status).toBe('rejected');
    });
  });

  describe('Creator Management', () => {
    it('should fetch pending creators', async () => {
      const creators = await adminService.getPendingCreators();
      expect(Array.isArray(creators)).toBe(true);
    });

    it('should approve creator application', async () => {
      const result = await adminService.approveCreator(testCreator.id);
      expect(result).toBeDefined();
    });

    it('should reject creator application', async () => {
      const result = await adminService.rejectCreator(testCreator.id);
      expect(result.status).toBe('rejected');
    });
  });

  describe('Verification Management', () => {
    it('should fetch pending verifications', async () => {
      const verifications = await adminService.getPendingVerifications();
      expect(Array.isArray(verifications)).toBe(true);
    });

    it('should approve verification', async () => {
      // Create a test verification first
      const verification = await adminService.approveVerification('test-verification-id');
      expect(verification.status).toBe('verified');
    });

    it('should reject verification', async () => {
      const verification = await adminService.rejectVerification('test-verification-id');
      expect(verification.status).toBe('rejected');
    });
  });

  describe('Admin Actions Log', () => {
    it('should fetch admin actions', async () => {
      const actions = await adminService.getAdminActions();
      expect(Array.isArray(actions)).toBe(true);
    });

    it('should log admin action', async () => {
      const action = await adminService.logAction({
        adminId: testAdmin.id,
        actionType: 'test',
        targetType: 'user',
        targetId: testUser.id,
        details: { reason: 'Testing admin action log' }
      });

      expect(action.admin_id).toBe(testAdmin.id);
      expect(action.action_type).toBe('test');
    });
  });
});