import { BaseService } from './base';
import type { Experience } from '@/types';

export class ExperienceService extends BaseService {
  constructor() {
    super('experiences');
  }

  async getAll(filters?: {
    category?: string;
    creatorId?: string;
    status?: string;
    isPrivate?: boolean;
  }): Promise<Experience[]> {
    let query = this.query()
      .select(`
        *,
        creator:creators!creator_id (
          id,
          business_name,
          rating,
          reviews_count,
          user:users!user_id (
            full_name,
            profile_image
          )
        ),
        category:categories (
          name,
          icon
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
      `);

    if (filters?.category) {
      query = query.eq('category_id', filters.category);
    }
    if (filters?.creatorId) {
      query = query.eq('creator_id', filters.creatorId);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (typeof filters?.isPrivate === 'boolean') {
      query = query.eq('is_private', filters.isPrivate);
    }

    return this.execQuery<Experience>(query);
  }

  async getById(id: string): Promise<Experience> {
    return this.execSingleQuery<Experience>(
      this.query()
        .select(`
          *,
          creator:creators!creator_id (
            id,
            business_name,
            rating,
            reviews_count,
            user:users!user_id (
              full_name,
              profile_image
            )
          ),
          category:categories (
            name,
            icon
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
        `)
        .eq('id', id)
    );
  }

  async create(data: Partial<Experience>): Promise<Experience> {
    return this.execSingleQuery<Experience>(
      this.query()
        .insert({
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
    );
  }

  async update(id: string, data: Partial<Experience>): Promise<Experience> {
    return this.execSingleQuery<Experience>(
      this.query()
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
    );
  }

  async delete(id: string): Promise<void> {
    await this.query().delete().eq('id', id);
  }
}

export const experienceService = new ExperienceService();