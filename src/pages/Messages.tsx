import React from 'react';
import { useParams } from 'react-router-dom';
import { MessageList } from '@/components/messaging/MessageList';
import { MessageInput } from '@/components/messaging/MessageInput';
import { ConversationList } from '@/components/messaging/ConversationList';
import { useAuth } from '@/lib/auth';

export function Messages() {
  const { conversationId } = useParams();
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <p className="text-sand-400">Please sign in to view messages</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 bg-earth-900">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Conversations List */}
            <div className="md:col-span-1">
              <h2 className="text-2xl font-display mb-6">Messages</h2>
              <ConversationList />
            </div>

            {/* Message Thread */}
            <div className="md:col-span-2">
              {conversationId ? (
                <div className="bg-earth-800/50 rounded-lg h-[calc(100vh-12rem)] flex flex-col">
                  <MessageList conversationId={conversationId} />
                  <MessageInput conversationId={conversationId} />
                </div>
              ) : (
                <div className="bg-earth-800/50 rounded-lg h-[calc(100vh-12rem)] flex items-center justify-center">
                  <p className="text-sand-400">Select a conversation to start messaging</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}