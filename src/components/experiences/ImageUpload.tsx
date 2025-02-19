import React, { useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { uploadMedia } from '@/lib/utils/media';
import { useAuth } from '@/lib/auth';

interface ImageUploadProps {
  value: string[];
  onChange: (value: string[]) => void;
  maxFiles?: number;
  onError?: (error: string) => void;
}

export function ImageUpload({ value, onChange, maxFiles = 5, onError }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const { user } = useAuth();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !user) return;

    try {
      setIsUploading(true);

      // Upload each file and get URLs
      const uploadPromises = Array.from(files).map(async (file) => {
        try {
          return await uploadMedia(file, user.id);
        } catch (error) {
          console.error('Failed to upload file:', error);
          throw error;
        }
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      onChange([...value, ...uploadedUrls].slice(0, maxFiles));
    } catch (error) {
      console.error('Upload error:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
      // Clear the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    const newValue = [...value];
    newValue.splice(index, 1);
    onChange(newValue);
  };

  return (
    <div className="space-y-4">
      <div
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${value.length >= maxFiles ? 'opacity-50 cursor-not-allowed' : 'hover:border-sand-400 cursor-pointer'}
          ${isUploading ? 'opacity-50 cursor-wait' : ''}
          border-earth-700 bg-earth-800/50
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFileChange}
          disabled={value.length >= maxFiles || isUploading}
        />
        <Upload className="mx-auto h-12 w-12 text-sand-400 mb-4" />
        <p className="text-sm text-sand-300">
          {value.length >= maxFiles
            ? 'Maximum number of images reached'
            : isUploading
            ? 'Uploading...'
            : "Drag 'n' drop images here, or click to select"}
        </p>
        <p className="text-xs text-sand-400 mt-2">
          {`${value.length}/${maxFiles} images uploaded`}
        </p>
        <p className="text-xs text-sand-400 mt-1">
          Supported formats: JPG, PNG, WebP (max 5MB)
        </p>
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {value.map((url, index) => (
            <div key={url} className="relative group">
              <img
                src={url}
                alt={`Upload ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}