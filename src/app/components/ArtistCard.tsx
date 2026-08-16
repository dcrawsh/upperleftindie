import { FaBandcamp } from "react-icons/fa";
import { FiExternalLink } from "react-icons/fi";
import ArtistImage from "./ui/ArtistImage";
import {
  cleanBio,
  formatLocation,
  getPrimaryGenre,
  type Artist,
} from "../../lib/artists";

/**
 * Artist Card — Figma component set 15:59.
 *
 * A compact grid item whose whole job is to get a listener to the artist's own
 * channel in one click. The media slot is the shared ArtistImage, so the two
 * artists with no scraped artwork fall back to initials in exactly the same
 * square as everyone else.
 *
 * The artist's other links are kept below the Bandcamp action — 46 of 82
 * artists have one, and dropping them would cost real routes to the artist.
 */
export default function ArtistCard({
  artist,
  headingLevel: Heading = "h2",
}: {
  artist: Artist;
  headingLevel?: "h2" | "h3";
}) {
  const location = formatLocation(artist.location);
  const genre = getPrimaryGenre(artist);
  const bio = cleanBio(artist.bio);
  const meta = [location, genre].filter(Boolean).join("  ·  ");
  const otherLinks = artist.links.filter(
    (link) => link.url !== artist.bandcampUrl
  );

  return (
    <article className="flex w-full gap-4 rounded-card border-[1.5px] border-subtle bg-surface p-5 transition hover:border-accent-solid hover:shadow-raised">
      <ArtistImage name={artist.name} src={artist.image} />

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Heading className="break-words type-heading-m text-primary">
          {artist.name}
        </Heading>
        {meta ? (
          <p className="break-words type-label-s text-accent">{meta}</p>
        ) : null}
        {bio ? (
          <p className="line-clamp-3 break-words type-body-s text-tertiary">
            {bio}
          </p>
        ) : null}
        {artist.releases.length > 0 ? (
          <p className="type-body-s text-tertiary">
            {artist.releases.length}{" "}
            {artist.releases.length === 1 ? "release" : "releases"} on Bandcamp
          </p>
        ) : null}

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
          <a
            href={artist.bandcampUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-inverse px-3.5 type-label-s text-on-inverse transition hover:bg-accent-hover"
          >
            <FaBandcamp size={14} aria-hidden="true" />
            Buy on Bandcamp
            <span className="sr-only">{` — ${artist.name}`}</span>
          </a>
          {otherLinks.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-1.5 type-body-s font-medium text-secondary underline decoration-subtle underline-offset-4 transition hover:text-accent hover:decoration-accent-solid"
            >
              <span className="min-w-0 break-words">{link.label}</span>
              <FiExternalLink size={14} className="shrink-0" aria-hidden="true" />
              <span className="sr-only">{` — ${artist.name}`}</span>
            </a>
          ))}
        </div>
      </div>
    </article>
  );
}
