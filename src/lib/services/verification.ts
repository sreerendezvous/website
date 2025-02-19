import { BaseService } from './base';

interface VerificationRequest {
  id: string;
  user_id: string;
  type: 'social' | 'document' | 'background';
  status: 'pending' | 'verified' | 'rejected';
  metadata: {
    platform?: string;
    document_type?: string;
    verification_id?: string;
  };
  created_at: string;
  updated_at: string;
}

export class VerificationService extends BaseService {
  constructor() {
    super('verifications');
  }

  async requestVerification(
    userId: string,
    type: VerificationRequest['type'],
    metadata: VerificationRequest['metadata']
  ): Promise<VerificationRequest> {
    return this.execSingleQuery<VerificationRequest>(
      this.query()
        .insert({
          user_id: userId,
          type,
          status: 'pending',
          metadata,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
    );
  }

  async updateVerificationStatus(
    id: string,
    status: VerificationRequest['status']
  ): Promise<void> {
    await this.query()
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
  }

  async getVerificationStatus(userId: string): Promise<VerificationRequest[]> {
    return this.execQuery<VerificationRequest>(
      this.query()
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
    );
  }
}

export const verificationService = new VerificationService();