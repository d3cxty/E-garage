import "dotenv/config";
import nodemailer from "nodemailer";

const mode = process.env.SMTP_HOST ? "smtp" : "gmail";

const transporter = mode === "smtp"
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    })
  : nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASS }
    });

const info = await transporter.sendMail({
  from: process.env.FROM_EMAIL,
  to: process.env.TEST_TO || process.env.GMAIL_USER,
  subject: "Nodemailer test",
  text: "It works 🎉"
});

console.log("Sent:", info.messageId);
