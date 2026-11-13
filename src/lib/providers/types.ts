/**
 * Provider interfaces for email and SMS.
 * Demo implementations simulate sends without calling any real service.
 * Real implementations (Resend, Twilio) are drop-in replacements.
 */

export interface SendResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailProvider {
  send(to: string, subject: string, body: string): Promise<SendResult>;
}

export interface SmsProvider {
  send(to: string, body: string): Promise<SendResult>;
}
