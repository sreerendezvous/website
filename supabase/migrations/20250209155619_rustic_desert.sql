-- Add communication preferences to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS communication_preferences jsonb DEFAULT jsonb_build_object(
    'email', true,
    'sms', false,
    'whatsapp', false,
    'preferredChannel', 'email',
    'phoneNumber', null,
    'whatsappNumber', null
);

-- Create notification settings table
CREATE TABLE IF NOT EXISTS public.notification_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id),
    type text NOT NULL,
    channel text NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp')),
    enabled boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(user_id, type, channel)
);

-- Create message delivery table
CREATE TABLE IF NOT EXISTS public.message_delivery (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id uuid NOT NULL REFERENCES public.messages(id),
    channel text NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp')),
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
    external_id text,
    error_message text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add function to send message via preferred channel
CREATE OR REPLACE FUNCTION send_message_via_channel(
    message_id uuid,
    channel text,
    recipient_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    message_record record;
    recipient_prefs jsonb;
BEGIN
    -- Get message details
    SELECT m.*, c.user_id, c.creator_id
    INTO message_record
    FROM public.messages m
    JOIN public.conversations c ON m.conversation_id = c.id
    WHERE m.id = message_id;

    -- Get recipient's communication preferences
    SELECT communication_preferences INTO recipient_prefs
    FROM public.users
    WHERE id = recipient_id;

    -- Create delivery record
    INSERT INTO public.message_delivery (
        message_id,
        channel,
        status,
        metadata
    ) VALUES (
        message_id,
        channel,
        'pending',
        jsonb_build_object(
            'recipient_id', recipient_id,
            'phone_number', 
            CASE 
                WHEN channel = 'whatsapp' THEN recipient_prefs->>'whatsappNumber'
                WHEN channel = 'sms' THEN recipient_prefs->>'phoneNumber'
                ELSE null
            END
        )
    );

    -- Trigger serverless function to handle actual delivery
    PERFORM net.http_post(
        url := 'https://your-site.netlify.app/.netlify/functions/send-message',
        body := jsonb_build_object(
            'messageId', message_id,
            'channel', channel,
            'recipientId', recipient_id
        )::text,
        headers := '{"Content-Type": "application/json"}'::jsonb
    );
END;
$$;

-- Add trigger to automatically send messages via preferred channel
CREATE OR REPLACE FUNCTION handle_new_message()
RETURNS trigger AS $$
DECLARE
    recipient_id uuid;
    recipient_prefs jsonb;
BEGIN
    -- Determine recipient
    SELECT 
        CASE 
            WHEN c.creator_id = NEW.sender_id THEN c.user_id
            ELSE c.creator_id
        END,
        u.communication_preferences
    INTO recipient_id, recipient_prefs
    FROM public.conversations c
    JOIN public.users u ON u.id = (
        CASE 
            WHEN c.creator_id = NEW.sender_id THEN c.user_id
            ELSE c.creator_id
        END
    )
    WHERE c.id = NEW.conversation_id;

    -- Send via preferred channel
    PERFORM send_message_via_channel(
        NEW.id,
        recipient_prefs->>'preferredChannel',
        recipient_id
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_message_created
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_message();

-- Add function to update delivery status
CREATE OR REPLACE FUNCTION update_delivery_status(
    message_id uuid,
    channel text,
    new_status text,
    external_id text DEFAULT NULL,
    error_message text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.message_delivery
    SET
        status = new_status,
        external_id = COALESCE(external_id, external_id),
        error_message = error_message,
        updated_at = now()
    WHERE message_id = message_id AND channel = channel;

    -- Update message status if all deliveries are complete
    IF NOT EXISTS (
        SELECT 1 FROM public.message_delivery
        WHERE message_id = message_id AND status = 'pending'
    ) THEN
        UPDATE public.messages
        SET status = 'delivered'
        WHERE id = message_id;
    END IF;
END;
$$;

-- Enable RLS
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_delivery ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can manage their notification settings"
    ON public.notification_settings
    FOR ALL
    USING (user_id = auth.uid());

CREATE POLICY "Message participants can view delivery status"
    ON public.message_delivery
    FOR SELECT
    USING (
        message_id IN (
            SELECT m.id FROM public.messages m
            JOIN public.conversations c ON m.conversation_id = c.id
            WHERE m.sender_id = auth.uid()
               OR c.creator_id = auth.uid()
               OR c.user_id = auth.uid()
        )
    );

-- Add indexes
CREATE INDEX notification_settings_user_id_idx ON public.notification_settings(user_id);
CREATE INDEX message_delivery_message_id_idx ON public.message_delivery(message_id);
CREATE INDEX message_delivery_status_idx ON public.message_delivery(status);