import { NextRequest } from "next/server";

export const runtime = "nodejs";

type SubscribePayload = {
  email?: unknown;
  groups?: unknown;
  fields?: unknown;
};

type SubscribeResult = {
  alreadySubscribed: boolean;
};

class NewsletterProviderError extends Error {
  constructor(
    message: string,
    readonly status = 502,
    readonly providerError?: string
  ) {
    super(message);
  }
}

const mailerLiteUrl = "https://connect.mailerlite.com/api";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function getSubscribePayload(req: NextRequest): Promise<SubscribePayload> {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    return {
      email: form.get("email"),
      groups: form.getAll("groups"),
      fields: Object.fromEntries(
        Array.from(form.entries()).filter(
          ([key]) => !["email", "groups"].includes(key)
        )
      ),
    };
  }

  return (await req.json()) as SubscribePayload;
}

function normalizeGroups(groups: unknown) {
  if (!Array.isArray(groups)) {
    return [];
  }

  return Array.from(
    new Set(
      groups
        .filter((group): group is string => typeof group === "string")
        .map((group) => group.trim())
        .filter(Boolean)
    )
  );
}

function normalizeFields(fields: unknown) {
  if (!fields || typeof fields !== "object" || Array.isArray(fields)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(fields)
      .filter((entry): entry is [string, string] => typeof entry[1] === "string")
      .map(([key, value]) => [key, value.trim()])
      .filter(([, value]) => value)
  );
}

function resolveGroupIds(groups: string[]) {
  return groups.map((group) => {
    if (/^\d+$/.test(group)) {
      return group;
    }

    const groupId = process.env[group];

    if (!groupId) {
      throw new NewsletterProviderError(`Missing group env var: ${group}`, 500);
    }

    return groupId;
  });
}

async function subscribeWithMailerLite({
  email,
  groups,
  fields,
}: {
  email: string;
  groups: string[];
  fields: Record<string, string>;
}): Promise<SubscribeResult> {
  const apiKey = process.env.MAILER_API_KEY ?? process.env.MAILERLITE_API_KEY;
  const groupIds = resolveGroupIds(groups);

  if (!apiKey) {
    throw new NewsletterProviderError("Missing MAILER_API_KEY", 500);
  }

  const subscriberUrl = `${mailerLiteUrl}/subscribers`;
  const lookupResponse = await fetch(
    `${subscriberUrl}/${encodeURIComponent(email)}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
    }
  );
  const alreadySubscribed = lookupResponse.ok;

  if (!alreadySubscribed && lookupResponse.status !== 404) {
    const errorBody = await lookupResponse.text();
    throw new NewsletterProviderError(
      `MailerLite lookup failed with ${lookupResponse.status}`,
      lookupResponse.status,
      errorBody
    );
  }

  const response = await fetch(subscriberUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      email,
      fields,
      ...(groupIds.length > 0 ? { groups: groupIds } : {}),
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("newsletter provider error", response.status, errorBody);
    throw new NewsletterProviderError(
      `MailerLite subscribe failed with ${response.status}`,
      response.status,
      errorBody
    );
  }

  return { alreadySubscribed };
}

async function subscribe(payload: {
  email: string;
  groups: string[];
  fields: Record<string, string>;
}) {
  const provider = (process.env.MAILER_PROVIDER ?? "mailerlite").toLowerCase();

  switch (provider) {
    case "mailerlite":
      return subscribeWithMailerLite(payload);
    default:
      throw new NewsletterProviderError(
        `Unsupported mailer provider: ${provider}`,
        500
      );
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await getSubscribePayload(req);
    const email =
      typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
    const groups = normalizeGroups(payload.groups);
    const fields = normalizeFields(payload.fields);

    if (!email) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return Response.json({ error: "Email is invalid" }, { status: 400 });
    }

    const result = await subscribe({ email, groups, fields });

    return Response.json({ success: true, ...result });
  } catch (error) {
    console.error("newsletter subscribe error", error);

    if (error instanceof NewsletterProviderError) {
      return Response.json(
        {
          error: error.message,
          providerError: error.providerError,
        },
        { status: error.status }
      );
    }

    return Response.json(
      { error: "Newsletter subscription failed" },
      { status: 502 }
    );
  }
}
