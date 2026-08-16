import type { Metadata } from "next";
import Link from "next/link";
import SiteContainer from "../components/SiteContainer";
import SectionHeading from "../components/ui/SectionHeading";
import { ButtonLink } from "../components/ui/Button";
import { playlistEmbedUrl } from "../../lib/site";

const archivePlaylistId =
  process.env.SPOTIFY_ARCHIVE_PLAYLIST_ID ?? "4eNvO2pXMvaDPDhs271NZr";
const archivePlaylistUrl = `https://open.spotify.com/playlist/${archivePlaylistId}`;

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

/**
 * Archive — built from the Figma system rather than a dedicated high-fidelity
 * frame, which the handoff does not include. Structure, tokens and components
 * match the homepage and Artists page; the page's job is to make the
 * active-versus-archived distinction obvious, which is why the relationship is
 * stated above the embed and links back to the active playlist.
 */
export default function ArchivePage() {
  return (
    <section className="py-12 md:py-14">
      <SiteContainer className="flex flex-col gap-10">
        <SectionHeading
          as="h1"
          size="page"
          eyebrow="Playlist archive · Past selections"
          title="A longer shelf for Northwest songs."
          description="The active playlist is kept short and current so newer releases have room. After songs have had their run there, they move here — nothing gets deleted, it just moves."
        />

        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href={archivePlaylistUrl} external emphasis="primary" size="lg">
            Listen to the archive
          </ButtonLink>
          <ButtonLink href="/" emphasis="secondary" size="lg">
            Back to what’s playing now
          </ButtonLink>
        </div>

        <div className="overflow-hidden rounded-card border-[1.5px] border-subtle bg-surface">
          <iframe
            src={playlistEmbedUrl(archivePlaylistId)}
            width="100%"
            height="352"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="block w-full md:h-[480px]"
            title="Upper Left Indie archive playlist on Spotify"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <article className="flex flex-col gap-2.5 rounded-card border-[1.5px] border-subtle bg-surface p-7">
            <p className="type-label-m text-accent">Why songs move</p>
            <h2 className="type-heading-m text-primary">
              The front door stays open.
            </h2>
            <p className="type-body-m text-secondary">
              The active playlist works best when it keeps room for new
              submissions, recent releases, and artists who could use a timely
              lift. Moving older adds is what keeps that room available.
            </p>
          </article>

          <article className="flex flex-col gap-2.5 rounded-card border-[1.5px] border-subtle bg-surface p-7">
            <p className="type-label-m text-accent">What stays here</p>
            <h2 className="type-heading-m text-primary">The trail stays intact.</h2>
            <p className="type-body-m text-secondary">
              The archive is a growing record of Upper Left Indie picks from
              Oregon, Washington, Idaho, Alaska, British Columbia, and the wider
              Northwest orbit. You can still find every artist in the{" "}
              <Link
                href="/artists"
                className="font-medium text-primary underline decoration-subtle underline-offset-4 transition hover:text-accent hover:decoration-accent-solid"
              >
                artist directory
              </Link>
              .
            </p>
          </article>
        </div>
      </SiteContainer>
    </section>
  );
}
