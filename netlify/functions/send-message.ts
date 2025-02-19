import { Handler } from '@netlify/functions';
import { Twilio } from 'twilio';
import { createClient } from '@supabase/supabase-js';

const twilio = new Twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { 
      userId, 
      recipientId, 
      content, 
      channel = 'sms',
      messageId 
    } = JSON.parse(event.body!);

    // Get recipient's contact info
    const { data: recipient, error: userError } = await supabase
      .from('users')
      .select('phone_number, email')
      .eq('id', recipientId)
      .single();

    if (userError || !recipient) {
      throw new Error('Recipient not found');
    }

    let externalMessageId;

    // Send message via appropriate channel
    if (channel === 'sms' && recipient.phone_number) {
      const message = await twilio.messages.create({
        body: content,
        to: recipient.phone_number,
        from: process.env.TWILIO_PHONE_NUMBER
      });
      externalMessageId = message.sid;
    } else if (channel === 'whatsapp' && recipient.phone_number) {
      const message = await twilio.messages.create({
        body: content,
        to: `whatsapp:${recipient.phone_number}`,
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`
      });
      externalMessageId = message.sid;
    }

    // Update message with external ID
    if (messageId && externalMessageId) {
      await supabase
        .from('messages')
        .update({
          external_id: externalMessageId,
          status: 'sent',
          metadata: {
            channel,
            delivery_status: 'sent'
          }
        })
        .eq('id', messageId);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    console.error('Message sending error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to send message' })
    };
  }
};