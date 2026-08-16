import type { Metadata } from "next";
import SiteContainer from "../components/SiteContainer";
import SectionHeading from "../components/ui/SectionHeading";
import { ButtonLink } from "../components/ui/Button";
import { getArtists } from "../../lib/artists";
import SupportOptions from "./SupportOptions";

export const metadata: Metadata = {
  title: "Support the Project",
  description:
    "Two ways to help Upper Left Indie: buy from the artists on Bandcamp, or tip the project to keep submissions free.",
  alternates: {
    canonical: "/support-the-project",
  },
  openGraph: {
    title: "Support the Project | Upper Left Indie",
    description:
      "Buying from an artist and tipping the project are two different things. This page keeps them apart.",
    url: "/support-the-project",
  },
};

/**
 * Support — Figma "Support the project · Desktop 1440" (27:188).
 *
 * The page's whole structure is principle P4: the artist ask is the filled,
 * accented block at the top, and the project ask is the quieter block below it.
 * Nothing here creates an in-house commerce layer — artist money keeps going
 * to the artist's own Bandcamp.
 */
export default function SupportPage() {
  const artistCount = getArtists().length;

  return (
    <section className="py-12 md:py-14">
      <SiteContainer className="flex flex-col gap-12">
        <SectionHeading
          as="h1"
          size="page"
          eyebrow="Two different things"
          title="There are two ways to help, and they are not the same."
          description="Most people land here wanting to support the music. That money should go to the musicians, not to this project. This page keeps the two apart so you can choose deliberately."
        />

        <section
          aria-labelledby="support-artist"
          className="flex flex-col gap-5 rounded-card border-2 border-accent-solid bg-accent-soft p-7 md:p-10"
        >
          <p className="type-label-m text-accent">Start here · Goes to the artist</p>
          <h2 id="support-artist" className="type-display-l text-primary">
            Buy the record.
          </h2>
          <p className="max-w-measure type-body-l text-secondary">
            Every artist here links to their own Bandcamp, where they set the
            price and keep the relationship with you. Upper Left Indie takes
            nothing from it and never has — there is no checkout on this site for
            an artist’s music, on purpose.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/artists" emphasis="primary" size="lg">
              {`Browse all ${artistCount} artists`}
            </ButtonLink>
            <ButtonLink href="/" emphasis="secondary" size="lg">
              See what’s playing now
            </ButtonLink>
          </div>
        </section>

        <section aria-labelledby="support-project" className="flex flex-col gap-5">
          <p className="type-label-m text-tertiary">
            Second · Goes to running costs
          </p>
          <h2 id="support-project" className="type-display-l text-primary">
            Or chip in here.
          </h2>
          <p className="max-w-measure type-body-m text-secondary">
            This keeps submissions free and the lights on. It is a tip, not a
            membership — there is no paywall, no perks tier, and nothing is
            withheld from anyone who doesn’t pay.
          </p>

          <SupportOptions />

          <p className="type-body-s text-tertiary">
            Payments are handled by Stripe, so this site never sees your card
            details. One-time only — nothing recurring, nothing stored here.
          </p>
        </section>

        <section
          aria-labelledby="where-it-goes"
          className="flex flex-col gap-3 rounded-card bg-sunken px-7 py-6 md:px-8"
        >
          <p className="type-label-m text-accent">Where it goes</p>
          <h2 id="where-it-goes" className="type-heading-m text-primary">
            What the money pays for
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <p className="type-body-m-medium text-primary">Hosting &amp; domain</p>
              <p className="type-body-s text-secondary">
                Keeping the site and the archive online.
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="type-body-m-medium text-primary">Playlist tools</p>
              <p className="type-body-s text-secondary">
                Spotify API access and the submission pipeline behind it.
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="type-body-m-medium text-primary">Everything else</p>
              <p className="type-body-s text-secondary">
                Time — which is the real cost of listening to everything.
              </p>
            </div>
          </div>
        </section>
      </SiteContainer>
    </section>
  );
}
