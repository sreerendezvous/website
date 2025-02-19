import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useMessageStore } from '@/lib/store/messageStore';
import { useAuth } from '@/lib/auth';

export function ConversationList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { conversations, fetchConversations } = useMessageStore();

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const getFallbackImageUrl = (name: string) => {
    return `https://api.dicebear.com/7.x/initials/svg?seed=${name}&backgroundColor=1d1918&textColor=e8e4dc`;
  };

  return (
    <div className="space-y-4">
      {conversations.map((conversation) => {
        const otherUser = conversation.creator_id === user?.id ? conversation.user : conversation.creator;
        
        return (
          <motion.div
            key={conversation.id}
            className="bg-earth-800/50 p-4 rounded-lg cursor-pointer hover:bg-earth-800/80 transition-colors"
            whileHover={{ y: -2 }}
            onClick={() => navigate(`/messages/${conversation.id}`)}
          >
            <div className="flex items-center gap-4">
              <img
                src={otherUser?.profile_image || getFallbackImageUrl(otherUser?.full_name || '')}
                alt={otherUser?.full_name}
                className="w-12 h-12 rounded-lg object-cover bg-earth-800"
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-sand-100 font-medium truncate">
                  {otherUser?.full_name}
                </h3>
                {conversation.experience && (
                  <p className="text-sm text-sand-400 truncate">
                    {conversation.experience.title}
                  </p>
                )}
              </div>
              {conversation.last_message_at && (
                <span className="text-xs text-sand-400">
                  {new Date(conversation.last_message_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </motion.div>
        );
      })}

      {conversations.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sand-400">No conversations yet</p>
        </div>
      )}
    </div>
  );
}