import { supabase } from '../supabase/client';

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const validateFile = (file: File) => {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File ${file.name} exceeds 5MB limit`);
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(`Invalid file type for ${file.name}. Allowed types: JPG, PNG, WebP`);
  }
  return true;
};

export const uploadMedia = async (file: File, userId: string, type: 'profile' | 'experience' = 'profile'): Promise<string> => {
  try {
    validateFile(file);

    // Generate a unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    
    // Use a simpler path structure
    const filePath = type === 'profile' 
      ? `profile-images/${fileName}`
      : `experience-media/${fileName}`;

    // Upload the file
    const { data, error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true // Allow overwriting existing files
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Failed to upload image. Please try again.');
    }

    if (!data?.path) {
      throw new Error('Failed to get uploaded file path');
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error('Failed to upload image:', error);
    throw error;
  }
};

export const deleteMedia = async (url: string): Promise<void> => {
  try {
    // Extract the file path from the URL
    const path = url.split('/media/')[1];
    if (!path) throw new Error('Invalid image URL');

    const { error } = await supabase.storage
      .from('media')
      .remove([path]);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Failed to delete image:', error);
    throw error;
  }
};