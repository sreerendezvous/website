-- Drop the problematic function that uses net.http_post
DROP FUNCTION IF EXISTS send_message_via_channel(uuid, text, uuid);

-- Create a simpler version that just creates the delivery record
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

    -- Update message status
    UPDATE public.messages
    SET status = 'pending'
    WHERE id = message_id;
END;
$$;

-- Update the handle_new_message trigger function
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
        COALESCE(recipient_prefs->>'preferredChannel', 'email'),
        recipient_id
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;