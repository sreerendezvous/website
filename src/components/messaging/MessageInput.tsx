import React, { useState, useRef } from 'react';
import { Send, Image, Paperclip, Smile } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useMessageStore } from '@/lib/store/messageStore';
import { uploadMedia } from '@/lib/utils/media';
import { useAuth } from '@/lib/auth';

interface MessageInputProps {
  conversationId: string;
}

export function MessageInput({ conversationId }: MessageInputProps) {
  const { user } = useAuth();
  const { sendMessage } = useMessageStore();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) return;

    try {
      setIsSubmitting(true);
      await sendMessage(conversationId, content);
      setContent('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setIsSubmitting(true);
      const url = await uploadMedia(file, user.id);
      await sendMessage(conversationId, url, file.type.startsWith('image/') ? 'image' : 'file');
    } catch (error) {
      console.error('Failed to upload file:', error);
    } finally {
      setIsSubmitting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-earth-700">
      <div className="flex items-end gap-2">
        <div className="flex-1 bg-earth-800/50 rounded-lg">
          <div className="flex items-center px-3 py-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mr-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <Image className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mr-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,.pdf,.doc,.docx"
              onChange={handleFileUpload}
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-transparent border-0 focus:ring-0 resize-none max-h-32"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="ml-2"
            >
              <Smile className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <Button 
          type="submit" 
          disabled={!content.trim() || isSubmitting}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </form>
  );
}