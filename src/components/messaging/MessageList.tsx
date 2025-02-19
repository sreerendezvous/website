import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, File, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useMessageStore } from '@/lib/store/messageStore';
import { useAuth } from '@/lib/auth';

interface MessageListProps {
  conversationId: string;
}

export function MessageList({ conversationId }: MessageListProps) {
  const { user } = useAuth();
  const { messages, fetchMessages, markAsRead } = useMessageStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages(conversationId);
    markAsRead(conversationId);

    // Subscribe to new messages and status updates
    const unsubscribe = useMessageStore.getState().subscribeToMessages(conversationId);
    return () => unsubscribe();
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getStatusIcon = (message: any) => {
    if (message.sender_id === user?.id) {
      switch (message.status) {
        case 'error':
          return <AlertCircle className="h-3 w-3 text-red-400" />;
        case 'sent':
          return <CheckCircle className="h-3 w-3 text-green-400" />;
        case 'delivered':
          return <CheckCircle className="h-3 w-3 text-green-400" />;
        case 'read':
          return <CheckCircle className="h-3 w-3 text-green-400" />;
        default:
          return <Clock className="h-3 w-3 text-sand-400" />;
      }
    }
    return null;
  };

  const renderMessageContent = (message: any) => {
    switch (message.type) {
      case 'image':
        return (
          <div className="relative">
            <img
              src={message.content}
              alt="Message attachment"
              className="max-w-sm rounded-lg"
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/300x200?text=Failed+to+load+image';
              }}
            />
            <Image className="absolute top-2 right-2 h-5 w-5 text-sand-400" />
          </div>
        );
      case 'file':
        return (
          <div className="flex items-center gap-2 bg-earth-800/50 p-3 rounded-lg">
            <File className="h-5 w-5 text-sand-400" />
            <span className="text-sand-300">{message.metadata?.fileName || 'File attachment'}</span>
          </div>
        );
      case 'system':
        return (
          <div className="text-center text-sm text-sand-400 italic">
            {message.content}
          </div>
        );
      default:
        return <p className="text-sand-300 whitespace-pre-wrap break-words">{message.content}</p>;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <AnimatePresence initial={false}>
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
          >
            {message.type === 'system' ? (
              <div className="w-full py-2">
                {renderMessageContent(message)}
              </div>
            ) : (
              <div 
                className={`max-w-[70%] ${
                  message.sender_id === user?.id ? 'bg-sand-400/10' : 'bg-earth-800/50'
                } rounded-lg p-3`}
              >
                {renderMessageContent(message)}
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className="text-xs text-sand-400">
                    {new Date(message.created_at).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                  {getStatusIcon(message)}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
      <div ref={messagesEndRef} />
    </div>
  );
}