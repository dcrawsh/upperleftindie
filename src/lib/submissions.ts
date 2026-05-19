const submissionsTable = "submissions";

export type SubmissionStatus = "pending" | "added" | "rejected" | "archived";

export type Submission = {
  id: string;
  created_at: string;
  updated_at?: string | null;
  status: SubmissionStatus;
  artist_name: string;
  contact_name: string;
  email: string;
  city: string;
  region: string;
  genre: string;
  song_link: string;
  bandcamp_link?: string | null;
  social_link?: string | null;
  notes?: string | null;
  artist_page_consent: boolean;
  subscribe_to_newsletter: boolean;
  spotify_track_id?: string | null;
  spotify_track_uri?: string | null;
  active_playlist_added_at?: string | null;
  archived_at?: string | null;
  admin_notes?: string | null;
};

export type SubmissionPayload = {
  artistName?: unknown;
  contactName?: unknown;
  email?: unknown;
  city?: unknown;
  region?: unknown;
  genre?: unknown;
  songLink?: unknown;
  bandCampLink?: unknown;
  socialLink?: unknown;
  notes?: unknown;
  artistPageConsent?: unknown;
  subscribeToNewsletter?: unknown;
};

export class SupabaseRequestError extends Error {
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
    throw new SupabaseRequestError("Supabase is not configured.", 500);
  }

  return {
    url: url.replace(/\/$/, ""),
    key,
  };
}

async function supabaseRequest<T>(
  path: string,
  init: RequestInit & { prefer?: string } = {}
): Promise<T> {
  const { url, key } = getSupabaseConfig();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init.prefer ? { Prefer: init.prefer } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    const details = await response.text();
    throw new SupabaseRequestError(
      details || `Supabase request failed with ${response.status}`,
      response.status
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeSubmissionPayload(payload: SubmissionPayload) {
  const artistName = asString(payload.artistName);
  const contactName = asString(payload.contactName);
  const email = asString(payload.email);
  const songLink = asString(payload.songLink);

  if (!artistName || !contactName || !email || !songLink) {
    throw new SupabaseRequestError(
      "Artist name, contact name, email, and song link are required.",
      400
    );
  }

  return {
    artist_name: artistName,
    contact_name: contactName,
    email,
    city: asString(payload.city),
    region: asString(payload.region),
    genre: asString(payload.genre),
    song_link: songLink,
    bandcamp_link: asString(payload.bandCampLink) || null,
    social_link: asString(payload.socialLink) || null,
    notes: asString(payload.notes) || null,
    artist_page_consent: payload.artistPageConsent === true,
    subscribe_to_newsletter: payload.subscribeToNewsletter !== false,
  };
}

export async function createSubmission(payload: SubmissionPayload) {
  const submission = normalizeSubmissionPayload(payload);
  const rows = await supabaseRequest<Submission[]>(submissionsTable, {
    method: "POST",
    body: JSON.stringify(submission),
    prefer: "return=representation",
  });

  return rows[0];
}

export async function listSubmissions(status?: string) {
  const statusFilter =
    status && status !== "all" ? `&status=eq.${encodeURIComponent(status)}` : "";

  return supabaseRequest<Submission[]>(
    `${submissionsTable}?select=*&order=created_at.desc${statusFilter}`
  );
}

export async function getSubmission(id: string) {
  const rows = await supabaseRequest<Submission[]>(
    `${submissionsTable}?select=*&id=eq.${encodeURIComponent(id)}&limit=1`
  );

  return rows[0] ?? null;
}

export async function updateSubmission(
  id: string,
  values: Partial<Submission>
) {
  const rows = await supabaseRequest<Submission[]>(
    `${submissionsTable}?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify(values),
      prefer: "return=representation",
    }
  );

  return rows[0] ?? null;
}

export async function updateSubmissionsByTrackUri(
  trackUri: string,
  values: Partial<Submission>
) {
  return supabaseRequest<Submission[]>(
    `${submissionsTable}?spotify_track_uri=eq.${encodeURIComponent(trackUri)}`,
    {
      method: "PATCH",
      body: JSON.stringify(values),
      prefer: "return=representation",
    }
  );
}
