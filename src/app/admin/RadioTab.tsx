"use client";

import { useState } from "react";
import {
  FiExternalLink,
  FiPause,
  FiPlay,
  FiRadio,
  FiRefreshCw,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { RECOMMENDED_RADIO_TRACK_LIMIT } from "@/lib/submission-audio-constants";
import { formatDate, formatFileSize } from "./helpers";
import { StarRating } from "./StarRating";
import type { PreviewState, Submission, TrackRating } from "./types";

export function RadioTab({
  tracks,
  isLoading,
  workingId,
  onRefresh,
  onRemove,
  onRate,
  onTogglePreview,
  currentPreviewTrackUri,
  isPreviewPlaying,
  previewsByKey,
  loadingPreviewKey,
}: {
  tracks: Submission[];
  isLoading: boolean;
  workingId: string;
  onRefresh: () => void;
  onRemove: (track: Submission) => void;
  onRate: (track: Submission, rating: TrackRating) => void;
  onTogglePreview: (track: Submission) => void;
  currentPreviewTrackUri: string;
  isPreviewPlaying: boolean;
  previewsByKey: Record<string, PreviewState>;
  loadingPreviewKey: string;
}) {
  const [confirmingId, setConfirmingId] = useState("");
  const publishedAudioBytes = tracks.reduce(
    (total, track) => total + (track.audio_size_bytes ?? 0),
    0
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-bold text-ink/60">
            {tracks.length} / {RECOMMENDED_RADIO_TRACK_LIMIT} recommended tracks
            on Upper Left Radio
          </p>
          <p className="mt-1 text-xs text-ink/45">
            {formatFileSize(publishedAudioBytes)} published audio. Lowest-rated,
            oldest tracks appear first.
          </p>
          <a
            href="/radio"
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-ink/45 transition hover:text-clay"
          >
            View public radio
            <FiExternalLink size={13} />
          </a>
        </div>
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

      <div className="grid gap-3">
        {tracks.map((track) => {
          const previewKey = `submission:${track.id}`;
          const preview = previewsByKey[previewKey];
          const isLoadingPreview = loadingPreviewKey === previewKey;
          const isThisPlaying =
            currentPreviewTrackUri === previewKey && isPreviewPlaying;
          const isConfirming = confirmingId === track.id;
          const removeWorkingId = `radio-remove-${track.id}`;
          const ratingWorkingId = `radio-rating-${track.id}`;

          return (
            <article
              key={track.id}
              className="grid gap-4 rounded-md border border-ink/10 bg-paper p-4 shadow-soft sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"
            >
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-md bg-ink text-paper">
                <FiRadio size={28} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink/45">
                  Published {formatDate(track.radio_published_at!)} /{" "}
                  {formatFileSize(track.audio_size_bytes)}
                </p>
                <h2 className="truncate text-lg font-black text-ink">
                  {track.track_title || "Untitled"}
                </h2>
                <p className="truncate text-sm text-ink/65">
                  {track.artist_name}
                  {track.city ? ` / ${track.city}` : ""}
                  {track.region ? `, ${track.region}` : ""}
                </p>
                <p className="truncate text-xs text-ink/45">
                  {track.audio_original_filename || "Submitted MP3"}
                </p>
                {track.artist_bio ? (
                  <p className="mt-2 max-w-2xl text-sm leading-5 text-ink/60">
                    {track.artist_bio}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StarRating
                    value={track.rating ?? 3}
                    label={`Radio rating for ${track.track_title || track.artist_name}`}
                    disabled={workingId === ratingWorkingId}
                    onChange={(rating) => onRate(track, rating)}
                  />
                  <span className="text-xs text-ink/45">
                    {track.rating ?? 3} stars
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onTogglePreview(track)}
                  disabled={isLoadingPreview || preview?.isMissing}
                  className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-3 text-sm font-bold text-ink transition hover:border-moss hover:text-moss disabled:opacity-50"
                >
                  {isThisPlaying ? <FiPause size={16} /> : <FiPlay size={16} />}
                  {isLoadingPreview
                    ? "Loading..."
                    : isThisPlaying
                      ? "Pause"
                      : "Preview"}
                </button>

                {isConfirming ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setConfirmingId("")}
                      disabled={workingId === removeWorkingId}
                      className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-3 text-sm font-bold text-ink transition hover:border-clay hover:text-clay disabled:opacity-50"
                    >
                      <FiX size={16} />
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemove(track)}
                      disabled={workingId === removeWorkingId}
                      className="inline-flex items-center gap-2 rounded-full bg-clay px-4 py-3 text-sm font-bold uppercase tracking-[0.1em] text-paper transition hover:bg-ink disabled:opacity-50"
                    >
                      <FiTrash2 size={16} />
                      {workingId === removeWorkingId
                        ? "Removing..."
                        : "Confirm Remove"}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingId(track.id)}
                    className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-3 text-sm font-bold uppercase tracking-[0.1em] text-paper transition hover:bg-clay"
                    title="Permanently delete the MP3 from Upper Left Radio"
                  >
                    <FiTrash2 size={16} />
                    Remove
                  </button>
                )}
              </div>

              {isConfirming ? (
                <p className="text-xs font-bold text-clay sm:col-span-3 sm:text-right">
                  This permanently deletes the private MP3. Spotify publication
                  is unaffected.
                </p>
              ) : null}
            </article>
          );
        })}
      </div>

      {!isLoading && tracks.length === 0 ? (
        <p className="rounded-md border border-ink/10 bg-paper/75 p-5 text-sm font-bold text-ink/60">
          No tracks are currently published to Upper Left Radio.
        </p>
      ) : null}
    </section>
  );
}
