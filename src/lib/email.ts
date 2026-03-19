import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true, // true for port 465
  auth: {
    user: 'info@diwalya.com',
    pass: process.env.SMTP_PASSWORD, // Add this to your .env
  },
});

export const EMAIL_TEMPLATES = {
  BOOKING_CONFIRMED: {
    subject: 'Booking Confirmed',
    body: `Hello {{name}},\n\nYour booking has been successfully confirmed.\n\nThank you for using Diwalya.`,
  },
  ACCOUNT_WARNING: {
    subject: 'Account Warning',
    body: `Hello {{name}},\n\nWe noticed unusual activity on your account. Please follow platform rules to avoid suspension.\n\nTeam Diwalya.`,
  },
  ACCOUNT_SUSPENDED: {
    subject: 'Account Suspended',
    body: `Hello {{name}},\n\nYour account has been suspended due to violation of platform policies.\n\nIf you believe this is a mistake, please contact support.`,
  },
  PAYMENT_UPDATE: {
    subject: 'Payment Update',
    body: `Hello {{name}},\n\nYour payment of {{amount}} for booking {{booking_id}} has been processed successfully.\n\nThank you.`,
  },
  CUSTOM: {
    subject: '',
    body: `Hello {{name}},\n\n{{message}}\n\nTeam Diwalya.`,
  }
};

export function parseTemplate(templateBody: string, vars: Record<string, string>) {
  let parsed = templateBody;
  Object.keys(vars).forEach((key) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    parsed = parsed.replace(regex, vars[key]);
  });
  return parsed;
}

export async function sendEmail({
  to,
  subject,
  body,
  html,
}: {
  to: string;
  subject: string;
  body: string;
  html?: string;
}) {
  try {
    if (!process.env.SMTP_PASSWORD) {
        console.warn('[EMAIL] SMTP_PASSWORD not set. Logging email instead.');
        console.log(`[EMAIL MOCK] To: ${to} | Subject: ${subject} | Body: ${body}`);
        return { success: true, mock: true };
    }

    const info = await transporter.sendMail({
      from: '"Diwalya" <info@diwalya.com>',
      to,
      subject,
      text: body,
      html: html || body.replace(/\n/g, '<br>'),
    });

    console.log('[EMAIL SUCCESS] Message sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('[EMAIL ERROR] Sending failed:', error.message);
    return { success: false, error: error.message };
  }
}
