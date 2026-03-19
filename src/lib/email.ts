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
