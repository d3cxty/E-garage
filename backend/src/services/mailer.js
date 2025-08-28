// services/mailer.js
import nodemailer from 'nodemailer';
import env from '../config/env.js';

let transporter = null;

/**
 * Create (once) a Gmail transporter using App Password.
 * Falls back to null if misconfigured (controller still succeeds after logging the email).
 */
function getTransporter() {
  if (transporter !== null) return transporter;

  const { GMAIL_USER, GMAIL_APP_PASS } = env;
  if (!GMAIL_USER || !GMAIL_APP_PASS) {
    console.warn('✴️  Mailer disabled: GMAIL_USER/GMAIL_APP_PASS missing in .env');
    transporter = null;
    return transporter;
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASS, // 16-char App Password
    },
  });

  return transporter;
}

/**
 * Send mail if Gmail is configured; otherwise return a stub so API stays stable.
 * @param {{to:string, subject:string, text?:string, html?:string}} param0
 */
export async function sendMailIfConfigured({ to, subject, text, html }) {
  const t = getTransporter();

  // Always return a consistent shape
  if (!t) {
    // Log intent for observability
    console.log('✉️ (DRY-RUN) Would send email:', { from: env.FROM_EMAIL, to, subject });
    return { ok: false, skipped: true, reason: 'mailer_not_configured' };
  }

  const info = await t.sendMail({
    from: env.FROM_EMAIL,
    to,
    subject,
    text,
    html,
  });

  return { ok: true, messageId: info.messageId, response: info.response };
}
