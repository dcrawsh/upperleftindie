import { NextRequest } from "next/server";

export const runtime = "nodejs";

type QueuePayload = {
  bandcampUrl?: unknown;
  artistName?: unknown;
  genre?: unknown;
};

type BandcampSourceRow = {
  id: string;
  bandcamp_url: string;
  artist_name: string;
  genre: string;
  status: "active" | "hidden" | "failed";
  source: string;
};

class BandcampQueueError extends Error {
  constructor(
    message: string,
    readonly status = 500
  ) {
    super(message);
  }
}

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new BandcampQueueError(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
      500
    );
  }

  return {
    url: url.replace(/\/$/, ""),
    key,
  };
}

async function supabaseRequest<T>(path: string, init: RequestInit = {}) {
  const { url, key } = getSupabaseConfig();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new BandcampQueueError(
      detail || `Supabase request failed with ${response.status}`,
      response.status
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function normalizeBandcampArtistUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    const hostname = url.hostname.replace(/^www\./, "").toLowerCase();

    if (!hostname.endsWith(".bandcamp.com") || hostname === "bandcamp.com") {
      return "";
    }

    return `https://${hostname}/`;
  } catch {
    return "";
  }
}

function normalizeGenre(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function upsertBandcampSource({
  url,
  artistName,
  genre,
}: {
  url: string;
  artistName: string;
  genre: string;
}) {
  const encodedUrl = encodeURIComponent(url);
  const existingRows = await supabaseRequest<BandcampSourceRow[]>(
    `bandcamp_sources?select=*&bandcamp_url=eq.${encodedUrl}&limit=1`
  );
  const existing = existingRows[0];
  const payload = {
    bandcamp_url: url,
    artist_name: artistName,
    genre,
    source: existing?.source || "submission-form",
    status: "active",
  };

  if (existing) {
    const rows = await supabaseRequest<BandcampSourceRow[]>(
      `bandcamp_sources?id=eq.${encodeURIComponent(existing.id)}`,
      {
        method: "PATCH",
        headers: {
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          ...payload,
          artist_name: artistName || existing.artist_name,
          genre: genre || existing.genre,
        }),
      }
    );

    return { added: false, updated: true, source: rows[0] ?? existing };
  }

  const rows = await supabaseRequest<BandcampSourceRow[]>("bandcamp_sources", {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  });

  return { added: true, updated: false, source: rows[0] };
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as QueuePayload;
    const bandcampUrl =
      typeof payload.bandcampUrl === "string" ? payload.bandcampUrl : "";
    const artistName =
      typeof payload.artistName === "string" ? payload.artistName.trim() : "";
    const genre = normalizeGenre(payload.genre);
    const normalizedUrl = normalizeBandcampArtistUrl(bandcampUrl);

    if (!normalizedUrl) {
      return Response.json(
        { error: "A valid Bandcamp artist URL is required" },
        { status: 400 }
      );
    }

    const result = await upsertBandcampSource({
      url: normalizedUrl,
      artistName,
      genre,
    });

    return Response.json({
      success: true,
      bandcampUrl: normalizedUrl,
      storage: "supabase",
      ...result,
    });
  } catch (error) {
    console.error("bandcamp queue error", error);

    if (error instanceof BandcampQueueError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    return Response.json(
      { error: "Bandcamp artist could not be queued" },
      { status: 500 }
    );
  }
}
