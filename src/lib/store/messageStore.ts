import { create } from 'zustand';
import { supabase } from '../supabase/client';
import type { User } from '@/types';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'error';
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  sender?: User;
  attachments?: Array<{
    id: string;
    file_url: string;
    file_type: string;
    file_name: string;
    file_size: number;
  }>;
  reactions?: Array<{
    id: string;
    user_id: string;
    reaction: string;
  }>;
}

interface Conversation {
  id: string;
  experience_id?: string;
  creator_id: string;
  user_id: string;
  last_message_at: string;
  created_at: string;
  updated_at: string;
  creator?: User;
  user?: User;
  experience?: {
    id: string;
    title: string;
    image_url?: string;
  };
}

interface MessageStore {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  error: string | null;
  unreadCount: number;
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string, type?: Message['type']) => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;
  startConversation: (userId: string, experienceId?: string) => Promise<string>;
  subscribeToMessages: (conversationId: string) => () => void;
  updateMessageStatus: (messageId: string, status: Message['status']) => void;
}

export const useMessageStore = create<MessageStore>((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  loading: false,
  error: null,
  unreadCount: 0,

  fetchConversations: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      set({ loading: true, error: null });

      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          *,
          creator:creator_id(id, full_name, profile_image),
          user:user_id(id, full_name, profile_image),
          experience:experience_id(id, title)
        `)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      // Get unread count
      const { data: count } = await supabase
        .rpc('get_unread_message_count', {
          user_id: user.id
        });

      set({ 
        conversations: conversations || [], 
        unreadCount: count || 0,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch conversations',
        loading: false 
      });
    }
  },

  startConversation: async (userId: string, experienceId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if conversation already exists
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .match({
          user_id: userId,
          creator_id: user.id,
          ...(experienceId ? { experience_id: experienceId } : {})
        })
        .maybeSingle(); // Use maybeSingle instead of single to avoid error

      if (existing?.id) {
        return existing.id;
      }

      // Create new conversation
      const { data: conversation, error } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          creator_id: user.id,
          experience_id: experienceId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Add conversation to local state
      set(state => ({
        conversations: [conversation, ...state.conversations]
      }));

      return conversation.id;
    } catch (error) {
      console.error('Failed to start conversation:', error);
      throw error;
    }
  },

  fetchMessages: async (conversationId: string) => {
    try {
      set({ loading: true, error: null });

      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id(id, full_name, profile_image),
          attachments:message_attachments(*),
          reactions:message_reactions(*),
          read_status:message_read_status(*)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      set({ messages: messages || [], loading: false, error: null });
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch messages',
        loading: false 
      });
    }
  },

  sendMessage: async (conversationId: string, content: string, type: Message['type'] = 'text') => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const tempId = crypto.randomUUID();
    
    // Add optimistic message
    set(state => ({
      messages: [...state.messages, {
        id: tempId,
        conversation_id: conversationId,
        sender_id: user.id,
        content,
        type,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]
    }));

    try {
      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content,
          type,
          status: 'sent',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Update conversation's last_message_at
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      // Update message in local state
      set(state => ({
        messages: state.messages.map(msg => 
          msg.id === tempId ? { ...message, status: 'sent' } : msg
        )
      }));
    } catch (error) {
      console.error('Failed to send message:', error);
      // Update message status to error
      set(state => ({
        messages: state.messages.map(msg =>
          msg.id === tempId ? { ...msg, status: 'error' } : msg
        )
      }));
      throw error;
    }
  },

  markAsRead: async (conversationId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .rpc('mark_messages_as_read', { conversation_id_param: conversationId });

      if (error) throw error;

      // Update local state
      set(state => ({
        messages: state.messages.map(msg => ({
          ...msg,
          status: msg.sender_id === user.id ? 'read' : msg.status
        }))
      }));
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
      throw error;
    }
  },

  subscribeToMessages: (conversationId: string) => {
    // Subscribe to new messages
    const subscription = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data: message } = await supabase
              .from('messages')
              .select(`
                *,
                sender:sender_id(id, full_name, profile_image),
                attachments:message_attachments(*),
                reactions:message_reactions(*),
                read_status:message_read_status(*)
              `)
              .eq('id', payload.new.id)
              .single();

            if (message) {
              set(state => ({
                messages: [...state.messages, message]
              }));
            }
          } else if (payload.eventType === 'UPDATE') {
            // Update message status in local state
            set(state => ({
              messages: state.messages.map(msg =>
                msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
              )
            }));
          }
        }
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      subscription.unsubscribe();
    };
  },

  updateMessageStatus: (messageId: string, status: Message['status']) => {
    set(state => ({
      messages: state.messages.map(msg =>
        msg.id === messageId ? { ...msg, status } : msg
      )
    }));
  }
}));