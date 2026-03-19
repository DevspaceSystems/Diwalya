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
