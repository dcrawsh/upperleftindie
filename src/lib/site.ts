/**
 * Single source of truth for the strings that were previously copy-pasted
 * across `layout.tsx`, `page.tsx`, `manifest.ts` and `archive/page.tsx` and had
 * already started to drift.
 *
 * Safe to import from client components: constants only, no environment reads.
 */
export const SITE_URL = "https://www.upperleftindie.com";
export const SITE_NAME = "Upper Left Indie";

export const SITE_DESCRIPTION =
  "Upper Left Indie is a Northwest music curation project supporting local underserved and under-heard independent artists.";

export const REGION_SCOPE =
  "Oregon, Washington, Idaho, Alaska, British Columbia, and the wider Northwest orbit";

export const INSTAGRAM_URL = "https://www.instagram.com/upperleftindie/";

export const ACTIVE_PLAYLIST_ID = "3LTI227By7Wt7hGs3mz5hF";

export const ACTIVE_PLAYLIST_URL = `https://open.spotify.com/playlist/${ACTIVE_PLAYLIST_ID}?si=b0900f7372be4492`;

export function playlistEmbedUrl(playlistId: string) {
  return `https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator`;
}
