import { BaseService } from './base';

interface WaitlistEntry {
  id: string;
  user_id: string;
  position: number;
  status: 'active' | 'invited' | 'expired';
  invitation_sent_at?: string;
  created_at: string;
  updated_at: string;
}

export class WaitlistService extends BaseService {
  constructor() {
    super('waitlist');
  }

  async addToWaitlist(userId: string): Promise<WaitlistEntry> {
    // Get current last position
    const { data: lastEntry } = await this.query()
      .select('position')
      .order('position', { ascending: false })
      .limit(1)
      .single();

    const nextPosition = (lastEntry?.position || 0) + 1;

    return this.execSingleQuery<WaitlistEntry>(
      this.query()
        .insert({
          user_id: userId,
          position: nextPosition,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
    );
  }

  async sendInvitation(userId: string): Promise<void> {
    await this.query()
      .update({
        status: 'invited',
        invitation_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
  }

  async getPosition(userId: string): Promise<number | null> {
    const { data } = await this.query()
      .select('position')
      .eq('user_id', userId)
      .single();
    
    return data?.position || null;
  }

  async processWaitlist(limit: number): Promise<WaitlistEntry[]> {
    return this.execQuery<WaitlistEntry>(
      this.query()
        .select('*')
        .eq('status', 'active')
        .order('position', { ascending: true })
        .limit(limit)
    );
  }
}

export const waitlistService = new WaitlistService();