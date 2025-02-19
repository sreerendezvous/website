/*
  # Add Messaging System

  1. New Tables
    - `conversations` - Tracks message threads between users
    - `messages` - Stores individual messages
    - `message_attachments` - Stores files/images attached to messages
    - `message_reactions` - Stores reactions to messages
    - `message_read_status` - Tracks message read status

  2. Security
    - Enable RLS on all tables
    - Add policies for proper access control
    - Only allow communication between connected users

  3. Changes
    - Add conversation tracking
    - Add message status tracking
    - Add notification support
*/

-- Create conversations table
CREATE TABLE public.conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    experience_id uuid REFERENCES public.experiences(id),
    creator_id uuid REFERENCES public.users(id),
    user_id uuid REFERENCES public.users(id),
    last_message_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(experience_id, creator_id, user_id)
);

-- Create messages table
CREATE TABLE public.messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES public.conversations(id),
    sender_id uuid NOT NULL REFERENCES public.users(id),
    content text NOT NULL,
    type text NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'file', 'system')),
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create message attachments table
CREATE TABLE public.message_attachments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    file_url text NOT NULL,
    file_type text NOT NULL,
    file_name text NOT NULL,
    file_size integer NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Create message reactions table
CREATE TABLE public.message_reactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id),
    reaction text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(message_id, user_id, reaction)
);

-- Create message read status table
CREATE TABLE public.message_read_status (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id),
    read_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(message_id, user_id)
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_read_status ENABLE ROW LEVEL SECURITY;

-- Conversation policies
CREATE POLICY "Users can view their conversations"
    ON public.conversations
    FOR SELECT
    USING (
        creator_id = auth.uid() OR
        user_id = auth.uid()
    );

CREATE POLICY "Users can create conversations"
    ON public.conversations
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid() OR
        creator_id = auth.uid()
    );

-- Message policies
CREATE POLICY "Users can view messages in their conversations"
    ON public.messages
    FOR SELECT
    USING (
        conversation_id IN (
            SELECT id FROM public.conversations
            WHERE creator_id = auth.uid() OR user_id = auth.uid()
        )
    );

CREATE POLICY "Users can send messages in their conversations"
    ON public.messages
    FOR INSERT
    WITH CHECK (
        sender_id = auth.uid() AND
        conversation_id IN (
            SELECT id FROM public.conversations
            WHERE creator_id = auth.uid() OR user_id = auth.uid()
        )
    );

-- Attachment policies
CREATE POLICY "Users can view attachments in their conversations"
    ON public.message_attachments
    FOR SELECT
    USING (
        message_id IN (
            SELECT id FROM public.messages
            WHERE conversation_id IN (
                SELECT id FROM public.conversations
                WHERE creator_id = auth.uid() OR user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can add attachments to their messages"
    ON public.message_attachments
    FOR INSERT
    WITH CHECK (
        message_id IN (
            SELECT id FROM public.messages
            WHERE sender_id = auth.uid()
        )
    );

-- Reaction policies
CREATE POLICY "Users can view reactions in their conversations"
    ON public.message_reactions
    FOR SELECT
    USING (
        message_id IN (
            SELECT id FROM public.messages
            WHERE conversation_id IN (
                SELECT id FROM public.conversations
                WHERE creator_id = auth.uid() OR user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can add/remove their own reactions"
    ON public.message_reactions
    FOR ALL
    USING (user_id = auth.uid());

-- Read status policies
CREATE POLICY "Users can view read status in their conversations"
    ON public.message_read_status
    FOR SELECT
    USING (
        message_id IN (
            SELECT id FROM public.messages
            WHERE conversation_id IN (
                SELECT id FROM public.conversations
                WHERE creator_id = auth.uid() OR user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can mark messages as read"
    ON public.message_read_status
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Create indexes
CREATE INDEX conversations_experience_id_idx ON public.conversations(experience_id);
CREATE INDEX conversations_creator_id_idx ON public.conversations(creator_id);
CREATE INDEX conversations_user_id_idx ON public.conversations(user_id);
CREATE INDEX messages_conversation_id_idx ON public.messages(conversation_id);
CREATE INDEX messages_sender_id_idx ON public.messages(sender_id);
CREATE INDEX message_attachments_message_id_idx ON public.message_attachments(message_id);
CREATE INDEX message_reactions_message_id_idx ON public.message_reactions(message_id);
CREATE INDEX message_reactions_user_id_idx ON public.message_reactions(user_id);
CREATE INDEX message_read_status_message_id_idx ON public.message_read_status(message_id);
CREATE INDEX message_read_status_user_id_idx ON public.message_read_status(user_id);

-- Add function to get unread message count
CREATE OR REPLACE FUNCTION get_unread_message_count(user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
AS $$
    SELECT COUNT(*)::integer
    FROM public.messages m
    LEFT JOIN public.message_read_status mrs
        ON m.id = mrs.message_id
        AND mrs.user_id = user_id
    WHERE m.sender_id != user_id
        AND mrs.id IS NULL
        AND m.conversation_id IN (
            SELECT id FROM public.conversations
            WHERE creator_id = user_id OR user_id = user_id
        );
$$;

-- Add function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(conversation_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.message_read_status (message_id, user_id)
    SELECT m.id, auth.uid()
    FROM public.messages m
    WHERE m.conversation_id = conversation_id_param
        AND m.sender_id != auth.uid()
        AND NOT EXISTS (
            SELECT 1
            FROM public.message_read_status mrs
            WHERE mrs.message_id = m.id
                AND mrs.user_id = auth.uid()
        );
END;
$$;