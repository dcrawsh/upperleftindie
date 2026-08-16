import Image from "next/image";
import { FaBandcamp, FaSpotify } from "react-icons/fa";
import { getArtistInitials } from "../../lib/artists";
import type { RecentTrackCard } from "../../lib/recent-adds";

/**
 * Track Row — Figma component set 14:100.
 *
 * The component the redesign exists for: a track shown on this site always
 * carries who made it, where they are, when it was added, and a one-click route
 * to the artist's own channel. Previously the only listening surface was an
 * opaque embed, so "support the artists you hear here" could not be acted on.
 */
export default function TrackCard({ track }: { track: RecentTrackCard }) {
  const meta = [track.addedLabel ? `Added ${track.addedLabel}` : "", track.place]
    .filter(Boolean)
    .join("  ·  ");

  return (
    <article className="flex h-full w-full flex-col overflow-hidden rounded-card border-[1.5px] border-subtle bg-surface">
      <div className="relative h-[200px] w-full bg-inverse">
        {track.imageSrc ? (
          <Image
            src={track.imageSrc}
            alt=""
            fill
            sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <span
            className="flex h-full w-full items-center justify-center type-display-l text-on-inverse"
            aria-hidden="true"
          >
            {getArtistInitials(track.artistName)}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 px-5 pb-5 pt-4">
        {meta ? (
          <p className="break-words type-label-s text-accent">{meta}</p>
        ) : null}
        <h3 className="break-words type-heading-m text-primary">
          {track.trackTitle ?? track.artistName}
        </h3>
        {track.trackTitle ? (
          <p className="break-words type-body-m-medium text-secondary">
            {track.artistName}
          </p>
        ) : null}

        <div className="mt-auto flex flex-wrap gap-2 pt-3">
          <a
            href={track.spotifyUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-inverse px-3.5 type-label-s text-on-inverse transition hover:bg-accent-hover"
          >
            <FaSpotify size={14} aria-hidden="true" />
            Play
            <span className="sr-only">
              {track.trackTitle
                ? ` ${track.trackTitle} by ${track.artistName}`
                : ` ${track.artistName}`}{" "}
              on Spotify
            </span>
          </a>
          {track.bandcampUrl ? (
            <a
              href={track.bandcampUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border-[1.5px] border-strong px-3.5 type-label-s text-primary transition hover:border-accent-solid hover:text-accent"
            >
              <FaBandcamp size={14} aria-hidden="true" />
              Bandcamp
              <span className="sr-only">{` — buy from ${track.artistName}`}</span>
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
