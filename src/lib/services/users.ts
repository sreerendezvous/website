import { BaseService } from './base';
import type { User } from '@/types';

export class UserService extends BaseService {
  constructor() {
    super('users');
  }

  async getById(id: string): Promise<User> {
    return this.execSingleQuery<User>(
      this.query()
        .select(`
          *,
          creators (
            id,
            business_name,
            approval_status,
            rating,
            reviews_count
          )
        `)
        .eq('id', id)
    );
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    return this.execSingleQuery<User>(
      this.query()
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
    );
  }

  async updateStatus(id: string, status: User['status']): Promise<void> {
    await this.query()
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
  }

  async updateVerificationStatus(
    id: string, 
    status: User['verification_status']
  ): Promise<void> {
    await this.query()
      .update({ 
        verification_status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
  }
}

export const userService = new UserService();