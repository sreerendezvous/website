import type { Message, User, Booking } from '@/types';

interface SendMessageParams {
  experienceId: string;
  creatorId: string;
  subject: string;
  content: string;
  type: Message['type'];
  recipients: User[];
}

export async function sendMessage({ 
  experienceId, 
  creatorId, 
  subject, 
  content, 
  type, 
  recipients 
}: SendMessageParams): Promise<Message> {
  try {
    const message: Message = {
      id: crypto.randomUUID(),
      experienceId,
      creatorId,
      subject,
      content,
      type,
      sentVia: [],
      sentAt: new Date(),
      status: 'sending',
      recipients: [],
    };

    // Process each recipient based on their communication preferences
    for (const recipient of recipients) {
      const { communicationPreferences } = recipient;
      
      if (!communicationPreferences) continue;

      const { preferredChannel, email, whatsapp, sms } = communicationPreferences;

      // Send via preferred channel first
      if (preferredChannel === 'email' && email) {
        await sendEmail(recipient.email, subject, content);
        message.sentVia.push('email');
        message.recipients.push({
          userId: recipient.id,
          channel: 'email',
          status: 'sent',
        });
      }
      
      if (preferredChannel === 'whatsapp' && whatsapp && communicationPreferences.whatsappNumber) {
        await sendWhatsApp(communicationPreferences.whatsappNumber, content);
        message.sentVia.push('whatsapp');
        message.recipients.push({
          userId: recipient.id,
          channel: 'whatsapp',
          status: 'sent',
        });
      }
      
      if (preferredChannel === 'sms' && sms && communicationPreferences.phoneNumber) {
        await sendSMS(communicationPreferences.phoneNumber, content);
        message.sentVia.push('sms');
        message.recipients.push({
          userId: recipient.id,
          channel: 'sms',
          status: 'sent',
        });
      }
    }

    message.status = 'sent';
    return message;
  } catch (error) {
    console.error('Failed to send message:', error);
    throw error;
  }
}

async function sendEmail(to: string, subject: string, content: string): Promise<void> {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, content }),
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
}

async function sendWhatsApp(to: string, content: string): Promise<void> {
  try {
    const response = await fetch('/api/send-whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, content }),
    });

    if (!response.ok) {
      throw new Error('Failed to send WhatsApp message');
    }
  } catch (error) {
    console.error('WhatsApp sending failed:', error);
    throw error;
  }
}

async function sendSMS(to: string, content: string): Promise<void> {
  try {
    const response = await fetch('/api/send-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, content }),
    });

    if (!response.ok) {
      throw new Error('Failed to send SMS');
    }
  } catch (error) {
    console.error('SMS sending failed:', error);
    throw error;
  }
}