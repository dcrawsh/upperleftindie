import nodemailer from "nodemailer";

type EmailConfig = {
  user: string;
  pass: string;
  host: string;
  port: number;
  secure: boolean;
  recipientEmail: string;
};

type SiteEmail = {
  to: string;
  subject: string;
  text: string;
  fromName?: string;
  replyTo?: string;
};

export class EmailServiceError extends Error {
  constructor(
    message: string,
    readonly status = 500
  ) {
    super(message);
  }
}

export function getEmailConfig() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const recipientEmail = process.env.RECIPIENT_EMAIL ?? "";
  const host = process.env.EMAIL_HOST ?? "mail.privateemail.com";
  const port = Number(process.env.EMAIL_PORT ?? "465");
  const secure =
    process.env.EMAIL_SECURE !== undefined
      ? process.env.EMAIL_SECURE.toLowerCase() !== "false"
      : port === 465;

  if (!user || !pass) {
    throw new EmailServiceError("Email service is not configured");
  }

  if (!Number.isInteger(port)) {
    throw new EmailServiceError("Email service port is invalid");
  }

  return {
    user,
    pass,
    host,
    port,
    secure,
    recipientEmail,
  };
}

export function createEmailTransporter(config: EmailConfig = getEmailConfig()) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
}

export async function sendSiteEmail({
  to,
  subject,
  text,
  fromName = "Upper Left Indie",
  replyTo,
}: SiteEmail) {
  const config = getEmailConfig();
  const transporter = createEmailTransporter(config);
  const info = await transporter.sendMail({
    from: `"${fromName}" <${config.user}>`,
    replyTo: replyTo || config.recipientEmail || config.user,
    to,
    subject,
    text,
  });

  if (!info.accepted.includes(to)) {
    console.error("email not accepted", info);
    throw new EmailServiceError("Email was not accepted", 502);
  }

  return info;
}
