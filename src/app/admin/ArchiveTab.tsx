"use client";

import { FaSpotify } from "react-icons/fa";
import { FiCornerUpLeft, FiExternalLink, FiRefreshCw } from "react-icons/fi";
import { formatDate } from "./helpers";
import type { PlaylistTrack } from "./types";

export function ArchiveTab({
  archiveTracks,
  isLoading,
  workingId,
  onRefresh,
  onUnarchive,
}: {
  archiveTracks: PlaylistTrack[];
  isLoading: boolean;
  workingId: string;
  onRefresh: () => void;
  onUnarchive: (trackUri: string) => void;
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-bold text-ink/60">
            {archiveTracks.length} archived tracks
          </p>
          <a
            href="/archive"
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-ink/45 transition hover:text-clay"
          >
            View public archive page
            <FiExternalLink size={13} />
          </a>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/archive"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-sm font-bold text-ink transition hover:border-clay hover:text-clay"
          >
            <FiExternalLink size={16} />
            Public Page
          </a>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-sm font-bold text-ink transition hover:border-clay hover:text-clay disabled:opacity-60"
          >
            <FiRefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-3">
        {archiveTracks.map((track) => (
          <article
            key={track.uri}
            className="flex flex-col gap-4 rounded-md border border-ink/10 bg-paper p-4 shadow-soft sm:flex-row sm:items-center"
          >
            {track.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={track.imageUrl}
                alt=""
                className="h-20 w-20 rounded-md object-cover"
              />
            ) : (
              <div className="grid h-20 w-20 place-items-center rounded-md bg-ink/10 text-ink/40">
                <FaSpotify size={24} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink/45">
                Archived {formatDate(track.addedAt)}
              </p>
              <h2 className="truncate text-lg font-black text-ink">
                {track.name}
              </h2>
              <p className="truncate text-sm text-ink/65">
                {track.artistNames} / {track.albumName}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              {track.externalUrl ? (
                <a
                  href={track.uri || track.externalUrl}
                  className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-3 text-sm font-bold text-ink transition hover:border-green-700 hover:text-green-700"
                >
                  <FaSpotify size={16} />
                  Open
                </a>
              ) : null}
              <button
                type="button"
                onClick={() => onUnarchive(track.uri)}
                disabled={workingId === track.uri}
                className="inline-flex items-center gap-2 rounded-full bg-moss px-4 py-3 text-sm font-bold uppercase tracking-[0.1em] text-paper transition hover:bg-ink disabled:opacity-60"
              >
                <FiCornerUpLeft size={16} />
                Unarchive
              </button>
            </div>
          </article>
        ))}
      </div>

      {!isLoading && archiveTracks.length === 0 ? (
        <p className="rounded-md border border-ink/10 bg-paper/75 p-5 text-sm font-bold text-ink/60">
          No archived playlist tracks loaded.
        </p>
      ) : null}
    </section>
  );
}
