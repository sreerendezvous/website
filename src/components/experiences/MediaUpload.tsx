import React, { useRef, useState } from 'react';
import { Upload, X, Play, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { validateFile } from '@/lib/utils/media';

interface MediaUploadProps {
  value: Array<{ url: string; type: 'image' | 'video'; order: number }>;
  onChange: (value: Array<{ url: string; type: 'image' | 'video'; order: number }>) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
}

export function MediaUpload({ 
  value = [], 
  onChange, 
  maxFiles = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4']
}: MediaUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    try {
      setError(null);
      const newMedia = await Promise.all(
        Array.from(files).map(async (file, index) => {
          // Validate file
          validateFile(file);

          // Create object URL for preview
          const url = URL.createObjectURL(file);

          // For videos, create a thumbnail
          let thumbnailUrl = url;
          if (file.type.startsWith('video/')) {
            const video = document.createElement('video');
            video.src = url;
            await new Promise((resolve) => {
              video.onloadeddata = resolve;
            });
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(video, 0, 0);
            thumbnailUrl = canvas.toDataURL('image/jpeg');
          }

          return {
            url,
            thumbnailUrl,
            type: file.type.startsWith('video/') ? 'video' as const : 'image' as const,
            order: value.length + index
          };
        })
      );

      onChange([...value, ...newMedia].slice(0, maxFiles));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process files');
    }
  };

  const removeMedia = (index: number) => {
    const newValue = [...value];
    URL.revokeObjectURL(newValue[index].url);
    newValue.splice(index, 1);
    onChange(newValue.map((item, i) => ({ ...item, order: i })));
  };

  const reorderMedia = (fromIndex: number, toIndex: number) => {
    const newValue = [...value];
    const [movedItem] = newValue.splice(fromIndex, 1);
    newValue.splice(toIndex, 0, movedItem);
    onChange(newValue.map((item, index) => ({ ...item, order: index })));
  };

  return (
    <div className="space-y-4">
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const files = Array.from(e.dataTransfer.files);
          const validFiles = files.filter(file => acceptedTypes.includes(file.type));
          if (validFiles.length === 0) return;
          const dataTransfer = new DataTransfer();
          validFiles.forEach(file => dataTransfer.items.add(file));
          if (fileInputRef.current) {
            fileInputRef.current.files = dataTransfer.files;
            handleFileChange({ target: fileInputRef.current } as any);
          }
        }}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${dragging ? 'border-sand-400 bg-earth-800/80' : 'border-earth-700 bg-earth-800/50'}
          ${value.length >= maxFiles ? 'opacity-50 cursor-not-allowed' : 'hover:border-sand-400 cursor-pointer'}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={acceptedTypes.join(',')}
          multiple
          onChange={handleFileChange}
          disabled={value.length >= maxFiles}
        />
        <Upload className="mx-auto h-12 w-12 text-sand-400 mb-4" />
        <p className="text-sm text-sand-300">
          {value.length >= maxFiles
            ? 'Maximum number of files reached'
            : "Drag 'n' drop media here, or click to select"}
        </p>
        <p className="text-xs text-sand-400 mt-2">
          {`${value.length}/${maxFiles} files uploaded`}
        </p>
        <p className="text-xs text-sand-400 mt-1">
          Supported formats: JPG, PNG, WebP, MP4
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-500/10 rounded-lg text-red-400">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {value.map((media, index) => (
            <div
              key={media.url}
              className="relative group"
              draggable
              onDragStart={(e) => e.dataTransfer.setData('text/plain', index.toString())}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                reorderMedia(fromIndex, index);
              }}
            >
              <div className="relative w-full h-32 rounded-lg overflow-hidden">
                {media.type === 'video' ? (
                  <>
                    <video
                      src={media.url}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-earth-900/50">
                      <Play className="h-8 w-8 text-sand-300" />
                    </div>
                  </>
                ) : (
                  <img
                    src={media.url}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => removeMedia(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="absolute bottom-2 left-2">
                <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-earth-900/80 text-sand-400 text-xs">
                  {media.type === 'video' ? (
                    <Play className="h-3 w-3" />
                  ) : (
                    <ImageIcon className="h-3 w-3" />
                  )}
                  {media.type}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}