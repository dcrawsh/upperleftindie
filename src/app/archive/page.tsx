import type { Metadata } from "next";
import Link from "next/link";
import SiteContainer from "../components/SiteContainer";

const archivePlaylistId =
  process.env.SPOTIFY_ARCHIVE_PLAYLIST_ID ?? "4eNvO2pXMvaDPDhs271NZr";
const archivePlaylistUrl = `https://open.spotify.com/playlist/${archivePlaylistId}`;
const archiveEmbedUrl = `https://open.spotify.com/embed/playlist/${archivePlaylistId}?utm_source=generator`;

export const metadata: Metadata = {
  title: "Playlist Archive",
  description:
    "Explore the Upper Left Indie archive, a home for Northwest songs after their active playlist run.",
  alternates: {
    canonical: "/archive",
  },
  openGraph: {
    title: "Playlist Archive | Upper Left Indie",
    description:
      "A home for Northwest songs after their active run on the Upper Left Indie playlist.",
    url: "/archive",
  },
};

export default function ArchivePage() {
  return (
    <section className="py-14 md:py-20">
      <SiteContainer className="space-y-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-sm font-black uppercase tracking-[0.26em] text-clay">
            Playlist Archive
          </p>
          <h1 className="text-4xl font-black leading-tight text-ink md:text-6xl">
            A longer shelf for Northwest songs.
          </h1>
          <p className="mt-6 text-lg leading-8 text-ink/70">
            The active Upper Left Indie playlist is designed to stay fresh and
            focused on newer releases. After songs have had time there, they
            move into the archive so listeners can keep finding them.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a
              href={archivePlaylistUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-ink px-7 py-4 text-center text-sm font-bold uppercase tracking-[0.14em] text-paper transition hover:bg-clay"
            >
              Listen to Archive
            </a>
            <Link
              href="/submit"
              className="rounded-full border border-ink/20 px-7 py-4 text-center text-sm font-bold uppercase tracking-[0.14em] text-ink transition hover:border-ink hover:bg-paper"
            >
              Submit Music
            </Link>
          </div>
        </div>

        <div className="mx-auto w-full max-w-4xl">
          <iframe
            src={archiveEmbedUrl}
            width="100%"
            height="520"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="rounded-lg border border-ink/10 shadow-lg"
            title="Upper Left Indie Archive Spotify playlist"
          ></iframe>
        </div>

        <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
          <section className="rounded-md border border-ink/10 bg-paper/75 p-5 shadow-soft">
            <h2 className="text-xl font-black text-ink">Why songs move</h2>
            <p className="mt-3 text-sm leading-6 text-ink/65">
              The active playlist works best when it keeps room for new
              submissions, recent releases, and artists who could use a timely
              lift. Moving older adds keeps that front door open.
            </p>
          </section>

          <section className="rounded-md border border-ink/10 bg-paper/75 p-5 shadow-soft">
            <h2 className="text-xl font-black text-ink">What stays here</h2>
            <p className="mt-3 text-sm leading-6 text-ink/65">
              The archive keeps the trail intact. It is a growing record of
              Upper Left Indie picks from Oregon, Washington, Idaho, Alaska,
              British Columbia, and the wider Northwest orbit.
            </p>
          </section>
        </div>
      </SiteContainer>
    </section>
  );
}
