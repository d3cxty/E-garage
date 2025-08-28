// controllers/emailController.js
import { body } from 'express-validator';
import EmailMsg from '../models/EmailMsg.js';
import { validate } from '../utils/validate.js';
import { sendMailIfConfigured } from '../services/mailer.js';
import env from '../config/env.js';

export async function getEmails(_req, res) {
  const msgs = await EmailMsg.find().sort({ createdAt: -1 }).limit(50);
  res.json(msgs);
}

export const validateSendEmail = [
  body('to').isEmail(),
  body('subject').notEmpty(),
  body('body').notEmpty(),
  validate,
];

export async function sendEmail(req, res) {
  try {
    const { to, subject, body: text } = req.body;

    // persist to DB first so you always have an audit trail, even if SMTP fails
    const saved = await EmailMsg.create({
      from: env.FROM_EMAIL,
      to,
      subject,
      body: text,
    });

    // attempt to send via Gmail
    let mailResult = null;
    try {
      mailResult = await sendMailIfConfigured({ to, subject, text });
    } catch (err) {
      console.error('Mailer error:', err);
      mailResult = { ok: false, skipped: false, error: 'smtp_error' };
    }

    return res.json({
      ok: true,
      emailId: saved._id,
      mail: mailResult, // { ok, messageId?, response? } or { ok:false, skipped:true }
    });
  } catch (err) {
    console.error('sendEmail controller error:', err);
    return res.status(500).json({ ok: false, message: 'Failed to send email' });
  }
}
