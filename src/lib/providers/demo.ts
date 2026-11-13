/**
 * Demo provider implementations — simulated sends, no real API calls.
 * These are used by default when no real provider is configured.
 * Sends are logged to the Reminder table so they appear in the UI.
 */

import { EmailProvider, SmsProvider, SendResult } from "./types";
import { newId } from "../ids";

export class DemoEmailProvider implements EmailProvider {
  async send(to: string, subject: string, body: string): Promise<SendResult> {
    // In demo mode, log to console only — the Reminder table handles persistence
    const messageId = `demo-email-${newId()}`;
    console.log(
      `[DEMO EMAIL] To: ${to} | Subject: ${subject} | Body: ${body.slice(0, 80)}...`
    );
    return { ok: true, messageId };
  }
}

export class DemoSmsProvider implements SmsProvider {
  async send(to: string, body: string): Promise<SendResult> {
    const messageId = `demo-sms-${newId()}`;
    console.log(`[DEMO SMS] To: ${to} | Body: ${body}`);
    return { ok: true, messageId };
  }
}

/** Singleton demo providers — used throughout the app unless overridden. */
export const demoEmail = new DemoEmailProvider();
export const demoSms = new DemoSmsProvider();
