"use client";

import { FaSpotify } from "react-icons/fa";
import {
  FiArchive,
  FiMove,
  FiPause,
  FiPlay,
  FiRefreshCw,
  FiStar,
} from "react-icons/fi";
import { formatDate, formatDaysLive } from "./helpers";
import type {
  ActivePlaylistTrack,
  PlaylistTrack,
  PreviewState,
  TrackRating,
} from "./types";

const ratings: TrackRating[] = [1, 2, 3];

function StarRating({
  track,
  disabled,
  onRate,
}: {
  track: ActivePlaylistTrack;
  disabled: boolean;
  onRate: (track: ActivePlaylistTrack, rating: TrackRating) => void;
}) {
  return (
    <div
      role="group"
      aria-label={`Rating for ${track.name}`}
      className="mt-2 flex items-center gap-0.5"
    >
      {ratings.map((rating) => {
        const isFilled = rating <= track.rating;

        return (
          <button
            key={rating}
            type="button"
            onClick={() => onRate(track, rating)}
            disabled={disabled}
            aria-pressed={rating === track.rating}
            aria-label={`${rating} ${rating === 1 ? "star" : "stars"}`}
            title={`${rating} ${rating === 1 ? "star" : "stars"}`}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition hover:text-gold disabled:cursor-not-allowed disabled:opacity-50 ${
              isFilled ? "text-gold" : "text-ink/25"
            }`}
          >
            <FiStar size={18} className={isFilled ? "fill-current" : ""} />
          </button>
        );
      })}
    </div>
  );
}

export function PlaylistTab({
  tracks,
  isLoading,
  workingId,
  draggedTrackUri,
  dragOverTrackUri,
  setDraggedTrackUri,
  setDragOverTrackUri,
  onRefresh,
  onSort,
  onTrackDrop,
  onArchive,
  onRate,
  onTogglePreview,
  currentPreviewTrackUri,
  isPreviewPlaying,
  previewsByKey,
  loadingPreviewKey,
}: {
  tracks: ActivePlaylistTrack[];
  isLoading: boolean;
  workingId: string;
  draggedTrackUri: string;
  dragOverTrackUri: string;
  setDraggedTrackUri: (uri: string) => void;
  setDragOverTrackUri: (uri: string) => void;
  onRefresh: () => void;
  onSort: () => void;
  onTrackDrop: (toIndex: number) => void;
  onArchive: (trackUri: string) => void;
  onRate: (track: ActivePlaylistTrack, rating: TrackRating) => void;
  onTogglePreview: (track: PlaylistTrack) => void;
  currentPreviewTrackUri: string;
  isPreviewPlaying: boolean;
  previewsByKey: Record<string, PreviewState>;
  loadingPreviewKey: string;
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-bold text-ink/60">
            {tracks.length} active tracks
          </p>
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-ink/45">
            Ordered 3, 2, 1 stars, newest first within each
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onSort}
            disabled={isLoading || Boolean(workingId) || tracks.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-sm font-bold text-ink transition hover:border-clay hover:text-clay disabled:opacity-60"
            title="Re-apply the rating order, undoing manual moves"
          >
            <FiStar size={16} />
            {workingId === "sort" ? "Sorting..." : "Sort by Rating"}
          </button>
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
        {tracks.map((track, index) => {
          const previewKey = `track:${track.uri}`;
          const preview = previewsByKey[previewKey];
          const isLoadingPreview = loadingPreviewKey === previewKey;
          const isThisPlaying =
            currentPreviewTrackUri === previewKey && isPreviewPlaying;

          return (
            <article
              key={track.uri}
              onDragOver={(event) => {
                if (!draggedTrackUri) return;
                event.preventDefault();
                setDragOverTrackUri(track.uri);
              }}
              onDrop={(event) => {
                event.preventDefault();
                onTrackDrop(index);
              }}
              onDragEnd={() => {
                setDraggedTrackUri("");
                setDragOverTrackUri("");
              }}
              className={`flex flex-col gap-4 rounded-md border bg-paper p-4 shadow-soft transition sm:flex-row sm:items-center ${
                dragOverTrackUri === track.uri && draggedTrackUri !== track.uri
                  ? "border-clay bg-clay/5"
                  : "border-ink/10"
              }`}
            >
              <button
                type="button"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", track.uri);
                  setDraggedTrackUri(track.uri);
                  setDragOverTrackUri(track.uri);
                }}
                disabled={
                  workingId.startsWith("reorder:") ||
                  workingId.startsWith("rating:") ||
                  workingId === "sort"
                }
                className="inline-flex h-10 w-10 shrink-0 cursor-grab items-center justify-center rounded-md border border-ink/10 text-ink/45 transition hover:border-clay hover:text-clay active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={`Drag ${track.name} to reorder`}
                title="Drag to reorder"
              >
                <FiMove size={18} />
              </button>
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
                  {formatDaysLive(track.addedAt)} / Added{" "}
                  {formatDate(track.addedAt)}
                </p>
                <h2 className="truncate text-lg font-black text-ink">
                  {track.name}
                </h2>
                <p className="truncate text-sm text-ink/65">
                  {track.artistNames} / {track.albumName}
                </p>
                <StarRating
                  track={track}
                  disabled={
                    workingId.startsWith("rating:") ||
                    workingId.startsWith("reorder:") ||
                    workingId === "sort"
                  }
                  onRate={onRate}
                />
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onTogglePreview(track)}
                  disabled={isLoadingPreview || preview?.isMissing}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-3 text-sm font-bold transition ${
                    preview?.isMissing
                      ? "border-ink/10 text-ink/35"
                      : "border-ink/15 text-ink hover:border-moss hover:text-moss"
                  }`}
                >
                  {isThisPlaying ? <FiPause size={16} /> : <FiPlay size={16} />}
                  {isLoadingPreview
                    ? "Finding..."
                    : preview?.isMissing
                      ? "No Preview"
                      : isThisPlaying
                        ? "Pause"
                        : track.previewUrl || preview?.previewUrl
                          ? "Preview"
                          : "Find Preview"}
                </button>
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
                  onClick={() => onArchive(track.uri)}
                  disabled={workingId === track.uri}
                  className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-3 text-sm font-bold uppercase tracking-[0.1em] text-paper transition hover:bg-clay disabled:opacity-60"
                >
                  <FiArchive size={16} />
                  Archive
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {!isLoading && tracks.length === 0 ? (
        <p className="rounded-md border border-ink/10 bg-paper/75 p-5 text-sm font-bold text-ink/60">
          No active playlist tracks loaded.
        </p>
      ) : null}
    </section>
  );
}
