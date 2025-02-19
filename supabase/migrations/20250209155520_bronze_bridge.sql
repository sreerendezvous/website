-- Add status column to messages table
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'sent'
CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'error'));

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS messages_status_idx ON public.messages(status);

-- Update existing messages to have a status
UPDATE public.messages
SET status = 'sent'
WHERE status IS NULL;

-- Add function to update message status
CREATE OR REPLACE FUNCTION update_message_status(message_id_param uuid, new_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verify the user owns the message or is the recipient
    IF NOT EXISTS (
        SELECT 1 FROM public.messages m
        JOIN public.conversations c ON m.conversation_id = c.id
        WHERE m.id = message_id_param
        AND (
            m.sender_id = auth.uid() OR
            c.creator_id = auth.uid() OR
            c.user_id = auth.uid()
        )
    ) THEN
        RAISE EXCEPTION 'Not authorized to update this message';
    END IF;

    -- Update the message status
    UPDATE public.messages
    SET 
        status = new_status,
        updated_at = now()
    WHERE id = message_id_param;
END;
$$;

-- Add trigger to automatically mark messages as delivered when read
CREATE OR REPLACE FUNCTION auto_update_message_status()
RETURNS trigger AS $$
BEGIN
    -- If a message is being marked as read, ensure it's also marked as delivered
    IF NEW.status = 'read' AND OLD.status = 'sent' THEN
        NEW.status = 'delivered';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_message_status_order
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION auto_update_message_status();

-- Update RLS policies to allow status updates
CREATE POLICY "Users can update message status"
    ON public.messages
    FOR UPDATE
    USING (
        id IN (
            SELECT m.id FROM public.messages m
            JOIN public.conversations c ON m.conversation_id = c.id
            WHERE 
                m.sender_id = auth.uid() OR
                c.creator_id = auth.uid() OR
                c.user_id = auth.uid()
        )
    );