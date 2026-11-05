import { ImapFlow, type FetchMessageObject } from "imapflow";
import { simpleParser, type ParsedMail } from "mailparser";
import { EmailServiceError, sendSiteEmail } from "@/lib/email";

const DEFAULT_MESSAGE_LIMIT = 50;
const MAX_MESSAGE_LIMIT = 100;
const MAX_SOURCE_BYTES = 3_000_000;
const MAX_BODY_CHARS = 100_000;
const DEFAULT_TIMEOUT_MS = 15_000;

export type MailboxAddress = {
  name: string;
  address: string;
};

export type MailboxMessageSummary = {
  uid: number;
  subject: string;
  from: MailboxAddress | null;
  date: string;
  unread: boolean;
  answered: boolean;
  hasAttachments: boolean;
};

export type MailboxAttachment = {
  filename: string;
  contentType: string;
  size: number;
};

export type MailboxMessage = MailboxMessageSummary & {
  replyTo: MailboxAddress | null;
  to: MailboxAddress[];
  text: string;
  attachments: MailboxAttachment[];
  isTruncated: boolean;
};

type MailboxConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  mailbox: string;
  timeoutMs: number;
};

export class MailboxServiceError extends Error {
  constructor(
    message: string,
    readonly status = 502
  ) {
    super(message);
  }
}

function asPositiveInteger(value: string | undefined, fallback: number) {
  if (value === undefined || value.trim() === "") return fallback;

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function asBoolean(value: string | undefined, fallback: boolean) {
  return value === undefined ? fallback : value.toLowerCase() !== "false";
}

export function getMailboxConfig(): MailboxConfig {
  const user = process.env.EMAIL_IMAP_USER || process.env.EMAIL_USER;
  const pass = process.env.EMAIL_IMAP_PASS || process.env.EMAIL_PASS;
  const host =
    process.env.EMAIL_IMAP_HOST?.trim() ||
    process.env.EMAIL_HOST?.trim() ||
    "mail.privateemail.com";
  const port = asPositiveInteger(process.env.EMAIL_IMAP_PORT, 993);
  const timeoutMs = asPositiveInteger(
    process.env.EMAIL_IMAP_TIMEOUT_MS,
    DEFAULT_TIMEOUT_MS
  );

  if (!user || !pass) {
    throw new MailboxServiceError("Email inbox is not configured.", 500);
  }

  if (!port) {
    throw new MailboxServiceError("IMAP port is invalid.", 500);
  }

  if (!timeoutMs) {
    throw new MailboxServiceError("IMAP timeout is invalid.", 500);
  }

  return {
    user,
    pass,
    host,
    port,
    secure: asBoolean(process.env.EMAIL_IMAP_SECURE, true),
    mailbox: process.env.EMAIL_IMAP_MAILBOX?.trim() || "INBOX",
    timeoutMs,
  };
}

function createMailboxClient(config: MailboxConfig) {
  const client = new ImapFlow({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    logger: false,
    disableAutoIdle: true,
    connectionTimeout: config.timeoutMs,
    greetingTimeout: config.timeoutMs,
    socketTimeout: config.timeoutMs,
    maxLineLength: MAX_SOURCE_BYTES,
    maxLiteralSize: MAX_SOURCE_BYTES,
    maxResponseSize: MAX_SOURCE_BYTES + 1_000_000,
  });

  client.on("error", (error) => {
    console.error("email inbox connection error", error.message);
  });

  return client;
}

function mapMailboxError(error: unknown) {
  if (error instanceof MailboxServiceError) return error;
  if (error instanceof EmailServiceError) {
    return new MailboxServiceError(error.message, error.status);
  }

  const code =
    error && typeof error === "object" && "code" in error
      ? String(error.code)
      : "";

  if (code.includes("TIMEOUT") || code === "ETIMEDOUT") {
    return new MailboxServiceError(
      "The email inbox timed out. Try refreshing it.",
      504
    );
  }

  return new MailboxServiceError(
    "The email inbox could not be reached. Check the IMAP settings."
  );
}

async function withMailbox<T>(
  callback: (client: ImapFlow, config: MailboxConfig) => Promise<T>
) {
  const config = getMailboxConfig();
  const client = createMailboxClient(config);

  try {
    await client.connect();
    return await callback(client, config);
  } catch (error) {
    throw mapMailboxError(error);
  } finally {
    if (client.authenticated) {
      await client.logout().catch(() => client.close());
    } else {
      client.close();
    }
  }
}

function firstAddress(
  addresses: Array<{ name?: string; address?: string }> | undefined | null
): MailboxAddress | null {
  const address = addresses?.find((item) => item.address?.trim());

  if (!address?.address) return null;

  return {
    name: address.name?.trim() || address.address,
    address: address.address.trim(),
  };
}

function allAddresses(
  addresses: Array<{ name?: string; address?: string }> | undefined | null
) {
  return (addresses ?? [])
    .map((address) => firstAddress([address]))
    .filter((address): address is MailboxAddress => Boolean(address));
}

function asIsoDate(value: Date | string | undefined) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime())
    ? new Date().toISOString()
    : date.toISOString();
}

function asSummary(message: FetchMessageObject): MailboxMessageSummary {
  const envelope = message.envelope;

  return {
    uid: message.uid,
    subject: envelope?.subject?.trim() || "(No subject)",
    from: firstAddress(envelope?.from),
    date: asIsoDate(envelope?.date ?? message.internalDate),
    unread: !message.flags?.has("\\Seen"),
    answered: Boolean(message.flags?.has("\\Answered")),
    hasAttachments: hasAttachment(message.bodyStructure),
  };
}

function hasAttachment(
  structure: FetchMessageObject["bodyStructure"]
): boolean {
  if (!structure) return false;
  if (structure.disposition?.toLowerCase() === "attachment") return true;
  return Boolean(structure.childNodes?.some((child) => hasAttachment(child)));
}

function parsedAddresses(
  address: ParsedMail["to"] | ParsedMail["from"] | ParsedMail["replyTo"]
) {
  const objects = Array.isArray(address) ? address : address ? [address] : [];
  return objects.flatMap((item) =>
    item.value.map((value) => ({ name: value.name, address: value.address }))
  );
}

async function fetchMessage(client: ImapFlow, uid: number, markSeen: boolean) {
  const message = await client.fetchOne(
    String(uid),
    {
      uid: true,
      flags: true,
      envelope: true,
      internalDate: true,
      size: true,
      bodyStructure: true,
      source: { start: 0, maxLength: MAX_SOURCE_BYTES },
    },
    { uid: true }
  );

  if (!message || !message.source) {
    throw new MailboxServiceError("Email message not found.", 404);
  }

  const parsed = await simpleParser(message.source, {
    skipImageLinks: true,
    skipTextToHtml: true,
    maxHtmlLengthToParse: MAX_SOURCE_BYTES,
  });
  const summary = asSummary(message);

  if (markSeen && summary.unread) {
    await client.messageFlagsAdd(uid, ["\\Seen"], { uid: true });
  }

  return {
    message,
    parsed,
    detail: {
      ...summary,
      unread: markSeen ? false : summary.unread,
      from: firstAddress(parsedAddresses(parsed.from)) ?? summary.from,
      replyTo:
        firstAddress(parsedAddresses(parsed.replyTo)) ??
        firstAddress(parsedAddresses(parsed.from)) ??
        summary.from,
      to: allAddresses(parsedAddresses(parsed.to)),
      text:
        parsed.text?.trim().slice(0, MAX_BODY_CHARS) ||
        "This email does not contain a readable plain-text message.",
      attachments: parsed.attachments.map((attachment) => ({
        filename: attachment.filename || "Attachment",
        contentType: attachment.contentType,
        size: attachment.size,
      })),
      isTruncated:
        Boolean(message.size && message.size > message.source.length) ||
        Boolean(parsed.text && parsed.text.length > MAX_BODY_CHARS),
    } satisfies MailboxMessage,
  };
}

export function normalizeReplySubject(subject: string) {
  const trimmed = subject.trim() || "(No subject)";
  return /^re:/i.test(trimmed) ? trimmed : `Re: ${trimmed}`;
}

export async function listMailboxMessages(limit = DEFAULT_MESSAGE_LIMIT) {
  const safeLimit = Math.min(
    Math.max(1, Math.floor(limit) || DEFAULT_MESSAGE_LIMIT),
    MAX_MESSAGE_LIMIT
  );

  return withMailbox(async (client, config) => {
    const lock = await client.getMailboxLock(config.mailbox, {
      readOnly: true,
    });

    try {
      const total = client.mailbox ? client.mailbox.exists : 0;
      if (!total) return [];

      const messages = await client.fetchAll(
        `${Math.max(1, total - safeLimit + 1)}:*`,
        {
          uid: true,
          flags: true,
          envelope: true,
          internalDate: true,
          bodyStructure: true,
        }
      );

      return messages.map(asSummary).reverse();
    } finally {
      lock.release();
    }
  });
}

export async function getMailboxMessage(uid: number) {
  return withMailbox(async (client, config) => {
    const lock = await client.getMailboxLock(config.mailbox);

    try {
      const { detail } = await fetchMessage(client, uid, true);
      return detail;
    } finally {
      lock.release();
    }
  });
}

export async function replyToMailboxMessage(uid: number, text: string) {
  const messageText = text.trim();

  if (!messageText) {
    throw new MailboxServiceError("Reply message is required.", 400);
  }

  if (messageText.length > MAX_BODY_CHARS) {
    throw new MailboxServiceError(
      "Reply message must be 100,000 characters or fewer.",
      400
    );
  }

  return withMailbox(async (client, config) => {
    const lock = await client.getMailboxLock(config.mailbox);

    try {
      const { detail, parsed } = await fetchMessage(client, uid, false);

      if (!detail.replyTo?.address) {
        throw new MailboxServiceError(
          "This email does not have a reply address.",
          400
        );
      }

      const messageId = parsed.messageId?.trim();
      const existingReferences = Array.isArray(parsed.references)
        ? parsed.references
        : parsed.references
          ? [parsed.references]
          : [];

      await sendSiteEmail({
        to: detail.replyTo.address,
        subject: normalizeReplySubject(detail.subject),
        text: messageText,
        fromName: "Upper Left Indie",
        inReplyTo: messageId,
        references: messageId
          ? [...existingReferences, messageId]
          : existingReferences,
      });

      try {
        await client.messageFlagsAdd(uid, ["\\Answered", "\\Seen"], {
          uid: true,
        });
      } catch (error) {
        // The reply has already left over SMTP. Do not report the send as a
        // failure and invite a duplicate merely because IMAP bookkeeping failed.
        console.error(
          "sent inbox reply could not be marked answered",
          error instanceof Error ? error.message : error
        );
      }

      return {
        recipient: detail.replyTo.address,
        subject: normalizeReplySubject(detail.subject),
      };
    } finally {
      lock.release();
    }
  });
}
