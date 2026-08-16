import Link from "next/link";
import SiteContainer from "./components/SiteContainer";
import TrackCard from "./components/TrackCard";
import { ButtonLink } from "./components/ui/Button";
import { getArtists } from "../lib/artists";
import { getRecentTrackCards } from "../lib/recent-adds";
import {
  ACTIVE_PLAYLIST_ID,
  ACTIVE_PLAYLIST_URL,
  REGION_SCOPE,
  playlistEmbedUrl,
} from "../lib/site";

// The recent-adds rail reads the submissions table, so the page revalidates
// rather than being fully static.
export const revalidate = 900;

export default async function Home() {
  const artistCount = getArtists().length;
  const recentTracks = await getRecentTrackCards(3);

  return (
    <>
      <section className="py-12 md:py-16 lg:py-20">
        <SiteContainer>
          <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[1fr_460px] lg:items-center lg:gap-16">
            <div className="contents lg:flex lg:flex-col lg:gap-5">
              <div className="flex flex-col gap-5">
                <p className="type-label-m text-accent">
                  Pacific Northwest · Independent · Hand-picked
                </p>
                <h1 className="type-display-xl text-primary">
                  Northwest bands worth your next twenty minutes.
                </h1>
                <p className="max-w-measure type-body-l text-secondary">
                  Upper Left Indie is a one-person curation project supporting
                  underserved and under-heard independent artists. I listen through
                  submissions from {REGION_SCOPE}, and put the best of them in
                  front of people who will actually listen.
                </p>

                <div className="flex items-center gap-3 rounded-field bg-accent-soft px-4 py-3.5">
                  <span
                    className="h-10 w-10 shrink-0 rounded-full bg-accent-solid"
                    aria-hidden="true"
                  />
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <p className="type-body-s text-primary">
                      One person listens to every submission, and only adds tracks
                      that fit the playlist.
                    </p>
                    <Link
                      href="/about"
                      className="type-label-s text-accent underline decoration-transparent underline-offset-4 transition hover:decoration-accent"
                    >
                      Read how picks get made →
                    </Link>
                  </div>
                </div>
              </div>

              {/* Mobile drops the duplicate play CTA (the panel already carries
                  one) and puts the panel first; tablet and desktop show both
                  buttons above the panel. */}
              <div className="order-3 flex flex-col gap-3 sm:flex-row md:order-1 lg:order-none lg:pt-2">
                <ButtonLink
                  href={ACTIVE_PLAYLIST_URL}
                  external
                  emphasis="primary"
                  size="lg"
                  className="hidden md:inline-flex"
                >
                  Play the playlist
                </ButtonLink>
                <ButtonLink href="/artists" emphasis="secondary" size="lg">
                  Browse the artists
                </ButtonLink>
              </div>
            </div>

            <div className="order-2 overflow-hidden rounded-panel bg-inverse md:order-2 lg:order-none">
              <iframe
                src={playlistEmbedUrl(ACTIVE_PLAYLIST_ID)}
                width="100%"
                height="352"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="block w-full md:h-[380px]"
                title="Upper Left Indie active playlist on Spotify"
              />
              <div className="flex flex-col gap-2 px-6 pb-6 pt-5">
                <p className="type-label-s text-on-inverse">
                  Now playing · The active playlist
                </p>
                <p className="type-heading-m text-on-inverse">Upper Left Indie</p>
                <p className="type-body-s text-on-inverse/85">
                  Kept short and current, so new submissions always have room.
                </p>
                <ButtonLink
                  href={ACTIVE_PLAYLIST_URL}
                  external
                  emphasis="primary"
                  size="md"
                  fullWidth
                  className="mt-2 bg-page text-primary hover:bg-accent-soft hover:text-accent"
                >
                  Open in Spotify
                </ButtonLink>
              </div>
            </div>
          </div>
        </SiteContainer>
      </section>

      {recentTracks.length > 0 ? (
        <section className="pb-12 pt-6 md:pb-16 md:pt-8" aria-labelledby="recently-added">
          <SiteContainer>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex min-w-0 flex-col gap-2">
                <h2 id="recently-added" className="type-display-l text-primary">
                  Recently added
                </h2>
                <p className="max-w-measure type-body-m text-secondary">
                  The newest picks. Every track links straight to the artist.
                </p>
              </div>
              <Link
                href="/archive"
                className="inline-flex min-h-11 shrink-0 items-center type-label-m text-accent underline decoration-transparent underline-offset-4 transition hover:decoration-accent"
              >
                See the archive →
              </Link>
            </div>

            <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {recentTracks.map((track) => (
                <li key={track.key} className="flex min-w-0">
                  <TrackCard track={track} />
                </li>
              ))}
            </ul>
          </SiteContainer>
        </section>
      ) : null}

      <section className="bg-accent-soft py-12 md:py-14" aria-labelledby="support-artists">
        <SiteContainer className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
          <div className="flex min-w-0 flex-col gap-2.5">
            <p className="type-label-m text-accent">
              The most useful thing you can do
            </p>
            <h2 id="support-artists" className="type-display-l text-primary">
              Buy something from a band you just heard.
            </h2>
            <p className="max-w-measure type-body-l text-secondary">
              Listening helps. Buying a download, record, tape, shirt, or weird
              little run of stickers helps even more. Upper Left Indie takes
              nothing — every link here goes straight to the artist.
            </p>
          </div>
          <ButtonLink
            href="/artists"
            emphasis="primary"
            size="lg"
            className="shrink-0"
          >
            {`Browse all ${artistCount} artists`}
          </ButtonLink>
        </SiteContainer>
      </section>

      <section className="pb-10 pt-12 md:pt-16">
        <SiteContainer className="grid gap-6 md:grid-cols-2">
          <article className="flex flex-col gap-2.5 rounded-card border-[1.5px] border-subtle bg-surface p-7">
            <p className="type-label-m text-accent">The archive</p>
            <h2 className="type-heading-m text-primary">
              Nothing gets deleted, it just moves.
            </h2>
            <p className="type-body-m text-secondary">
              The active playlist stays short so new submissions have room. Once a
              song has had its run it moves to the archive, where it stays
              findable.
            </p>
            <div className="mt-2">
              <ButtonLink href="/archive" emphasis="secondary" size="md">
                Browse the archive
              </ButtonLink>
            </div>
          </article>

          <article className="flex flex-col gap-2.5 rounded-card border-[1.5px] border-subtle bg-surface p-7">
            <p className="type-label-m text-accent">Portland shows</p>
            <h2 className="type-heading-m text-primary">See them play this week.</h2>
            <p className="type-body-m text-secondary">
              A small calendar pulled from a handful of Portland venue listings.
              Confirm details with the venue before you go.
            </p>
            <div className="mt-2">
              <ButtonLink href="/shows" emphasis="secondary" size="md">
                See upcoming shows
              </ButtonLink>
            </div>
          </article>
        </SiteContainer>
      </section>

      <section className="pb-16 pt-6 md:pb-20">
        <SiteContainer className="grid gap-6 md:grid-cols-2 md:items-start">
          <article className="flex flex-col gap-3 rounded-card bg-inverse p-7 md:p-9">
            <p className="type-label-m text-on-inverse">For artists · Always free</p>
            <h2 className="type-display-l text-on-inverse">Send us a track.</h2>
            <p className="type-body-m text-on-inverse/90">
              Open to {REGION_SCOPE}. One person listens to everything. No fee,
              ever.
            </p>
            <div className="mt-2">
              <ButtonLink
                href="/submit"
                emphasis="primary"
                size="lg"
                className="bg-page text-primary hover:bg-accent-soft hover:text-accent"
              >
                Submit your music
              </ButtonLink>
            </div>
          </article>

          <article className="flex flex-col gap-2.5 rounded-card border-[1.5px] border-subtle p-7">
            <p className="type-label-m text-tertiary">For everyone else</p>
            <h2 className="type-heading-m text-primary">Chip in, if you want to.</h2>
            <p className="type-body-s text-secondary">
              Hosting, the domain and the hours cost something, and tips keep
              submissions free. This is deliberately the smallest ask on the page
              — buying an artist’s record matters more.
            </p>
            <div className="mt-2">
              <ButtonLink href="/support-the-project" emphasis="secondary" size="md">
                Support the project
              </ButtonLink>
            </div>
          </article>
        </SiteContainer>
      </section>
    </>
  );
}
