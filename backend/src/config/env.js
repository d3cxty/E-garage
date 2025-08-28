import 'dotenv/config'; // make sure this runs BEFORE anything reads env

const nospace = (s) => (s || '').replace(/\s+/g, '');

const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 5000),
  MONGO_URI: process.env.MONGO_URI ?? 'mongodb://127.0.0.1:27017/autocare',
  JWT_SECRET: process.env.JWT_SECRET ?? 'dev_secret',

  // Mail (support SMTP or Gmail)
  MAILER_DRIVER:
    process.env.MAILER_DRIVER ||
    (process.env.SMTP_HOST ? 'smtp' : (process.env.GMAIL_USER ? 'gmail' : 'disabled')),

  // SMTP (e.g. Mailtrap)
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: Number(process.env.SMTP_PORT || 587),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',

  // Gmail
  GMAIL_USER: process.env.GMAIL_USER || '',
  GMAIL_APP_PASS: nospace(process.env.GMAIL_APP_PASS), // strip spaces

  FROM_EMAIL: process.env.FROM_EMAIL || 'service@company.com',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
};

export default env;
