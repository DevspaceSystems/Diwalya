export const EMAIL_TEMPLATES = [
  {
    id: 'WELCOME',
    label: 'Welcome Message',
    subject: 'Welcome to Diwalya! 🎉',
    body: (name: string) => `
Hi ${name},

Welcome to Diwalya – Ghana's #1 platform for trusted skilled workers!

Whether you're here to find expert professionals or to earn money with your skills, we're thrilled to have you on board.

Here's what you can do right now:
• Browse qualified workers in your area
• Request a professional inspection
• Track your jobs in real-time
• Receive secure escrow-protected payments

If you need any help, reply to this email or contact our support team.

Team Diwalya
info@diwalya.com
    `.trim()
  },
  {
    id: 'MAINTENANCE',
    label: 'Platform Maintenance Notice',
    subject: 'Scheduled Maintenance – Diwalya Platform',
    body: () => `
Dear Diwalya User,

We wanted to inform you that we will be performing scheduled maintenance on the Diwalya platform.

During this window, some features may be temporarily unavailable. We apologize for any inconvenience.

We'll notify you once everything is back to normal.

Thank you for your patience.

Team Diwalya
    `.trim()
  },
  {
    id: 'NEW_FEATURE',
    label: 'New Feature Announcement',
    subject: 'Exciting New Features on Diwalya! 🚀',
    body: () => `
Hi there,

We've been working hard to improve your experience on Diwalya, and we're excited to share some new features with you!

• Real-time job progress tracking
• Secure escrow-protected payments
• Instant push notifications
• Dispute resolution system

Log in to your account today to explore everything new.

Team Diwalya
    `.trim()
  },
  {
    id: 'PAYMENT_REMINDER',
    label: 'Payment Release Reminder',
    subject: 'Action Required: Confirm Job Completion',
    body: () => `
Dear Client,

A job you recently commissioned may be nearing completion. Please log in to review the progress logs and confirm completion to release payment to your worker.

Remember: Funds are held securely in escrow until you confirm.

Log in at diwalya.com

Team Diwalya
    `.trim()
  },
  {
    id: 'CUSTOM',
    label: 'Custom Message',
    subject: '',
    body: () => ''
  }
];

export const PUSH_TEMPLATES = [
  {
    id: 'ANNOUNCEMENT',
    label: 'Platform Announcement',
    title: '📢 Diwalya Update',
    body: 'We have an important update for you. Check the app for details.'
  },
  {
    id: 'SPECIAL_OFFER',
    label: 'Special Offer',
    title: '🎁 Special Offer Just For You!',
    body: 'New workers are available in your area. Book an inspection today!'
  },
  {
    id: 'SECURITY_ALERT',
    label: 'Security Alert',
    title: '🔒 Security Notice',
    body: 'Please ensure your account details are up to date for your security.'
  },
  {
    id: 'MAINTENANCE',
    label: 'Maintenance Notice',
    title: '🔧 Scheduled Maintenance',
    body: 'The platform will undergo maintenance shortly. Thank you for your patience.'
  },
  {
    id: 'CUSTOM',
    label: 'Custom Notification',
    title: '',
    body: ''
  }
];
