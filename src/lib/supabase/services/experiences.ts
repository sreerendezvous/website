import { supabase } from '../client';
import type { Experience } from '@/types';

interface CreateExperienceData {
  title: string;
  description: string;
  shortDescription?: string;
  price: number;
  duration: number;
  location: {
    name: string;
    address: string;
    city: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  category: string;
  maxParticipants: number;
  media: Array<{
    url: string;
    type: 'image' | 'video';
    order: number;
  }>;
  requirements?: string[];
  included?: string[];
  notIncluded?: string[];
  cancellationPolicy: 'flexible' | 'moderate' | 'strict';
  languages: string[];
  accessibility?: {
    wheelchairAccessible: boolean;
    mobilityAccess: boolean;
    hearingAccess: boolean;
    visualAccess: boolean;
  };
}

class ExperienceService {
  async createExperience(creatorId: string, data: CreateExperienceData): Promise<Experience> {
    try {
      // First get the category ID
      const { data: category, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('name', data.category)
        .single();

      if (categoryError) throw categoryError;

      // Create the experience
      const { data: experience, error: experienceError } = await supabase
        .from('experiences')
        .insert({
          creator_id: creatorId,
          title: data.title,
          description: data.description,
          short_description: data.shortDescription,
          price: data.price,
          duration: data.duration,
          max_participants: data.maxParticipants,
          category_id: category.id,
          location: data.location,
          requirements: data.requirements || [],
          included_items: data.included || [],
          not_included_items: data.notIncluded || [],
          cancellation_policy: data.cancellationPolicy,
          languages: data.languages,
          accessibility_options: data.accessibility || {
            wheelchairAccessible: false,
            mobilityAccess: false,
            hearingAccess: false,
            visualAccess: false
          },
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select(`
          *,
          category:categories(*)
        `)
        .single();

      if (experienceError) throw experienceError;

      // Add the media with proper structure
      if (data.media && data.media.length > 0) {
        const { error: mediaError } = await supabase
          .from('experience_media')
          .insert(
            data.media.map(media => ({
              experience_id: experience.id,
              url: media.url,
              type: media.type || 'image',
              order_index: media.order || 0
            }))
          );

        if (mediaError) throw mediaError;
      }

      return experience;
    } catch (error) {
      console.error('Error creating experience:', error);
      throw error;
    }
  }

  async update(id: string, data: Partial<CreateExperienceData>): Promise<Experience> {
    try {
      // Get category ID if category is being updated
      let categoryId;
      if (data.category) {
        const { data: category, error: categoryError } = await supabase
          .from('categories')
          .select('id')
          .eq('name', data.category)
          .single();

        if (categoryError) throw categoryError;
        categoryId = category.id;
      }

      // Prepare update data
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      // Only include fields that are present in the update data
      if (data.title) updateData.title = data.title;
      if (data.description) updateData.description = data.description;
      if (data.shortDescription) updateData.short_description = data.shortDescription;
      if (data.price) updateData.price = data.price;
      if (data.duration) updateData.duration = data.duration;
      if (data.maxParticipants) updateData.max_participants = data.maxParticipants;
      if (categoryId) updateData.category_id = categoryId;
      if (data.location) updateData.location = data.location;
      if (data.requirements) updateData.requirements = data.requirements;
      if (data.included) updateData.included_items = data.included;
      if (data.notIncluded) updateData.not_included_items = data.notIncluded;
      if (data.cancellationPolicy) updateData.cancellation_policy = data.cancellationPolicy;
      if (data.languages) updateData.languages = data.languages;
      if (data.accessibility) updateData.accessibility_options = data.accessibility;

      // Update the experience
      const { data: experience, error: experienceError } = await supabase
        .from('experiences')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          category:categories(*),
          media:experience_media(*)
        `)
        .single();

      if (experienceError) throw experienceError;

      // Update media if provided
      if (data.media && data.media.length > 0) {
        // First delete existing media
        await supabase
          .from('experience_media')
          .delete()
          .eq('experience_id', id);

        // Then insert new media
        const { error: mediaError } = await supabase
          .from('experience_media')
          .insert(
            data.media.map(media => ({
              experience_id: id,
              url: media.url,
              type: media.type || 'image',
              order_index: media.order || 0
            }))
          );

        if (mediaError) throw mediaError;
      }

      return experience;
    } catch (error) {
      console.error('Error updating experience:', error);
      throw error;
    }
  }

  async uploadMedia(file: Blob, creatorId: string): Promise<string> {
    try {
      // Generate a unique file name
      const fileName = `${creatorId}/${crypto.randomUUID()}`;
      const filePath = `experience-media/${fileName}`;

      // Upload the file
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading media:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const experienceService = new ExperienceService();