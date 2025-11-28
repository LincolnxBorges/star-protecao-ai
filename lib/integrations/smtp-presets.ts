/**
 * Common SMTP server presets for popular providers
 * This file is safe to import in client components
 */
export const smtpPresets = {
  gmail: {
    server: "smtp.gmail.com",
    port: 587,
    useTls: true,
  },
  outlook: {
    server: "smtp-mail.outlook.com",
    port: 587,
    useTls: true,
  },
  office365: {
    server: "smtp.office365.com",
    port: 587,
    useTls: true,
  },
  yahoo: {
    server: "smtp.mail.yahoo.com",
    port: 587,
    useTls: true,
  },
  sendgrid: {
    server: "smtp.sendgrid.net",
    port: 587,
    useTls: true,
  },
  mailgun: {
    server: "smtp.mailgun.org",
    port: 587,
    useTls: true,
  },
  ses: {
    server: "email-smtp.us-east-1.amazonaws.com",
    port: 587,
    useTls: true,
  },
} as const;

export type SmtpPresetName = keyof typeof smtpPresets;
