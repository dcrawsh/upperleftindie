/**
 * Single entry point for Supabase access.
 *
 * Supabase is reached over the PostgREST HTTP API with plain `fetch` — there is
 * no `supabase-js` dependency. This module exists so that URL building, auth
 * headers, error shaping, and `204` handling are defined once instead of being
 * re-implemented per resource module.
 *
 * Server-only: it reads the service role key, which bypasses RLS and must never
 * reach the browser.
 */

export class SupabaseRequestError extends Error {
  constructor(
    message: string,
    readonly status = 500
  ) {
    super(message);
  }
}

export type SupabaseRequestInit = RequestInit & {
  /** PostgREST `Prefer` header, e.g. "return=representation". */
  prefer?: string;
  /**
   * Map a failed response onto a resource-specific error class, so routes can
   * keep narrowing with `instanceof` against their own error type.
   */
  mapError?: (status: number, details: string) => Error;
};

export type SupabaseStorageRequestInit = RequestInit & {
  mapError?: (status: number, details: string) => Error;
};

function readConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  return url && key ? { url: url.replace(/\/$/, ""), key } : null;
}

/**
 * True when both SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are present. Use
 * this for callers that must degrade gracefully rather than throw.
 */
export function isSupabaseConfigured() {
  return readConfig() !== null;
}

export function getSupabaseConfig() {
  const config = readConfig();

  if (!config) {
    throw new SupabaseRequestError(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return config;
}

/**
 * Build a PostgREST path with correctly encoded filter values.
 *
 * Prefer this over hand-written template strings: an un-encoded value
 * containing `,`, `&`, or `.` silently changes the meaning of the query.
 *
 *   supabasePath("submissions", { select: "id,status", status: "eq.added" })
 *   // => "submissions?select=id%2Cstatus&status=eq.added"
 */
export function supabasePath(
  table: string,
  params: Record<string, string | number | undefined> = {}
) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      search.append(key, String(value));
    }
  }

  const query = search.toString();
  return query ? `${table}?${query}` : table;
}

/** Escape a value used inside a PostgREST filter such as `id=eq.<value>`. */
export function supabaseFilterValue(value: string) {
  return encodeURIComponent(value);
}

export async function supabaseRequest<T>(
  path: string,
  init: SupabaseRequestInit = {}
): Promise<T> {
  const { url, key } = getSupabaseConfig();
  const { prefer, mapError, headers, ...rest } = init;

  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...rest,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(prefer ? { Prefer: prefer } : {}),
      ...headers,
    },
    // This data is operator-facing and changes constantly; never serve a
    // cached copy.
    cache: "no-store",
  });

  if (!response.ok) {
    const details = await response.text();

    throw mapError
      ? mapError(response.status, details)
      : new SupabaseRequestError(
          details || `Supabase request failed with ${response.status}`,
          response.status
        );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  // PostgREST may return 200 or 201 with an empty body for successful writes
  // using Prefer: return=minimal. A status-only check is not sufficient: an
  // empty success passed to response.json() throws "Unexpected end of JSON".
  const body = await response.text();

  if (!body.trim()) {
    return undefined as T;
  }

  try {
    return JSON.parse(body) as T;
  } catch {
    const details = "Supabase returned an invalid JSON response.";
    throw mapError
      ? mapError(502, details)
      : new SupabaseRequestError(details, 502);
  }
}

/**
 * Shared server-only entry point for Supabase Storage's HTTP API. Database
 * access stays in supabaseRequest(); this sibling keeps the same configuration,
 * auth, error shaping, and no-cache behavior for private objects.
 */
export async function supabaseStorageRequest<T>(
  path: string,
  init: SupabaseStorageRequestInit = {}
): Promise<T> {
  const { url, key } = getSupabaseConfig();
  const { mapError, headers, ...rest } = init;
  const response = await fetch(`${url}/storage/v1/${path}`, {
    ...rest,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const details = await response.text();

    throw mapError
      ? mapError(response.status, details)
      : new SupabaseRequestError(
          details || `Supabase Storage request failed with ${response.status}`,
          response.status
        );
  }

  if (response.status === 204 || rest.method === "HEAD") {
    return undefined as T;
  }

  const body = await response.text();

  if (!body.trim()) {
    return undefined as T;
  }

  try {
    return JSON.parse(body) as T;
  } catch {
    const details = "Supabase Storage returned an invalid JSON response.";
    throw mapError
      ? mapError(502, details)
      : new SupabaseRequestError(details, 502);
  }
}

export async function supabaseStorageBytes(
  path: string,
  values: {
    range?: string;
    mapError?: (status: number, details: string) => Error;
  } = {}
) {
  const { url, key } = getSupabaseConfig();
  const response = await fetch(`${url}/storage/v1/${path}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      ...(values.range ? { Range: values.range } : {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const details = await response.text();
    throw values.mapError
      ? values.mapError(response.status, details)
      : new SupabaseRequestError(
          details || `Supabase Storage request failed with ${response.status}`,
          response.status
        );
  }

  return new Uint8Array(await response.arrayBuffer());
}
