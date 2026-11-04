import type { StoredAdminSession } from "./types";

export const playlistUrl =
  "https://open.spotify.com/playlist/3LTI227By7Wt7hGs3mz5hF?si=f9293e66628f4b54";

export const storageKey = "upperleftindie-admin-token";
export const sessionDurationMs = 60 * 60 * 1000;

export function getStoredAdminSession(): StoredAdminSession | null {
  const storedValue = window.localStorage.getItem(storageKey);
  if (!storedValue) return null;

  try {
    const parsed = JSON.parse(storedValue) as Partial<StoredAdminSession>;

    if (
      typeof parsed.token === "string" &&
      typeof parsed.expiresAt === "number"
    ) {
      return {
        token: parsed.token,
        expiresAt: parsed.expiresAt,
      };
    }
  } catch {
    // Pre-JSON sessions stored the bare token.
    return {
      token: storedValue,
      expiresAt: Date.now() + sessionDurationMs,
    };
  }

  return null;
}

export function storeAdminSession(token: string) {
  window.localStorage.setItem(
    storageKey,
    JSON.stringify({
      token,
      expiresAt: Date.now() + sessionDurationMs,
    })
  );
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDaysLive(value: string) {
  const addedAt = new Date(value).getTime();

  if (Number.isNaN(addedAt)) {
    return "Live date unknown";
  }

  const daysLive = Math.max(0, Math.floor((Date.now() - addedAt) / 86_400_000));

  if (daysLive === 0) return "Live today";
  if (daysLive === 1) return "Live for 1 day";
  return `Live for ${daysLive} days`;
}

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export function getSpotifyAppTrackUrl(value: string) {
  if (value.startsWith("spotify:track:")) return value;

  try {
    const url = new URL(value);
    const [, type, id] = url.pathname.split("/");

    if (url.hostname.includes("spotify.com") && type === "track" && id) {
      return `spotify:track:${id}`;
    }
  } catch {
    // Keep the original link if it is not a parseable URL.
  }

  return value;
}

export function getDefaultReplySubject(artistName: string) {
  return `Re: Upper Left Indie submission from ${artistName}`;
}

export function getDefaultReplyMessage(contactName: string) {
  return `Hello ${contactName || "there"},



Please save and share the playlist to help more NW artists get heard:
${playlistUrl}

Cheers,
Upper Left Indie team`;
}

/** Pure list reorder used by the active playlist drag-and-drop. */
export function moveTrackInList<T>(
  items: T[],
  fromIndex: number,
  toIndex: number
) {
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);

  if (!item) return items;

  next.splice(toIndex, 0, item);
  return next;
}
