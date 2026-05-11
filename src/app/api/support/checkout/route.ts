import { NextRequest } from "next/server";
import type { SupportOptionKey } from "../../../support-the-project/supportData";

export const runtime = "nodejs";

type CheckoutPayload = {
  optionKey?: unknown;
};

const priceIdEnvByOption: Record<SupportOptionKey, string> = {
  "buy-a-coffee": "BUY_A_COFFEE_PRICE_ID",
  "support-playlist": "SUPPORT_PLAYLIST_PRICE_ID",
  "keep-submissions-free": "KEEP_SUBMISSIONS_FREE_PRICE_ID",
  "support-upper-left-indie": "SUPPORT_UPPER_LEFT_INDIE_PRICE_ID",
};

function isSupportOptionKey(value: unknown): value is SupportOptionKey {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(priceIdEnvByOption, value)
  );
}

function getSiteUrl(req: NextRequest) {
  const forwardedProto = req.headers.get("x-forwarded-proto");
  const forwardedHost = req.headers.get("x-forwarded-host");

  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`.replace(/\/$/, "");
  }

  if (req.nextUrl.origin) {
    return req.nextUrl.origin.replace(/\/$/, "");
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!siteUrl) {
    throw new Error("Missing NEXT_PUBLIC_SITE_URL");
  }

  return siteUrl.replace(/\/$/, "");
}

async function createStripeCheckoutSession(req: NextRequest, priceId: string) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  const siteUrl = getSiteUrl(req);
  const body = new URLSearchParams({
    mode: "payment",
    success_url: `${siteUrl}/support-the-project/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/support-the-project?checkout=cancelled`,
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
  });

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const result = (await response.json()) as { url?: string; error?: { message?: string } };

  if (!response.ok || !result.url) {
    throw new Error(result.error?.message || "Stripe checkout failed");
  }

  return result.url;
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as CheckoutPayload;

    if (!isSupportOptionKey(payload.optionKey)) {
      return Response.json({ error: "Invalid support option" }, { status: 400 });
    }

    const envName = priceIdEnvByOption[payload.optionKey];
    const priceId = process.env[envName];

    if (!priceId) {
      return Response.json(
        { error: `Missing ${envName}. Add a Stripe Price ID before checkout.` },
        { status: 500 }
      );
    }

    const url = await createStripeCheckoutSession(req, priceId);

    return Response.json({ url });
  } catch (error) {
    console.error("support checkout error", error);

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create checkout session",
      },
      { status: 500 }
    );
  }
}
