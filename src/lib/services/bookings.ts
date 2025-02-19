import { BaseService } from './base';
import type { Booking } from '@/types';

export class BookingService extends BaseService {
  constructor() {
    super('bookings');
  }

  async getByUserId(userId: string): Promise<Booking[]> {
    return this.execQuery<Booking>(
      this.query()
        .select(`
          *,
          experience:experiences!experience_id (
            *,
            creator:creators!creator_id (
              business_name,
              user:users!user_id (
                full_name,
                profile_image
              )
            ),
            location:locations (
              name,
              city,
              country
            ),
            media:experience_media (
              url,
              type,
              order_index
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
    );
  }

  async create(data: Partial<Booking>): Promise<Booking> {
    return this.execSingleQuery<Booking>(
      this.query()
        .insert({
          ...data,
          status: 'pending',
          payment_status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
    );
  }

  async updateStatus(
    id: string, 
    status: Booking['status'], 
    paymentStatus?: Booking['payment_status']
  ): Promise<void> {
    const updates: Partial<Booking> = {
      status,
      updated_at: new Date().toISOString()
    };

    if (paymentStatus) {
      updates.payment_status = paymentStatus;
    }

    await this.query()
      .update(updates)
      .eq('id', id);
  }
}

export const bookingService = new BookingService();