import type { Metadata } from "next";
import Link from "next/link";
import SiteContainer from "../components/SiteContainer";
import SectionHeading from "../components/ui/SectionHeading";
import { ButtonLink } from "../components/ui/Button";
import { getArtists } from "../../lib/artists";
import { REGION_SCOPE } from "../../lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "How Upper Left Indie works: who curates it, how a track gets picked, what the Northwest scope means, and where your money should go.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About | Upper Left Indie",
    description:
      "How a track gets picked, what the Northwest scope means, and where your money should go.",
    url: "/about",
  },
};

/**
 * About — the "About" destination the redesigned header points at. There is no
 * dedicated high-fidelity frame for it, so it is built from the same system as
 * the rest of the site.
 *
 * Every claim here is one the repository can back: the submission pipeline, the
 * rotation policy, the opt-in consent model, and the Bandcamp-first support
 * stance. Nothing about the curator's identity or history is asserted, because
 * nothing in the product establishes it.
 */
const steps = [
  {
    title: "It arrives",
    body: "Almost everything starts as a submission. Anyone can send one, it is free, and there is no account to make.",
  },
  {
    title: "I listen",
    body: "There is no panel, paid placement, or algorithm deciding what gets added. I work through the submissions myself and choose the tracks that fit the playlist. I can’t always reply to everyone, but submitting is free and every pick is my own.",
  },
  {
    title: "It goes on the active playlist",
    body: "The active playlist is deliberately kept short and current, so recent releases and new submissions always have room.",
  },
  {
    title: "It moves to the archive",
    body: "After a song has had its run, it moves to the archive playlist rather than disappearing. That is what keeps the front door open for the next artist.",
  },
];

export default function AboutPage() {
  const artistCount = getArtists().length;

  return (
    <section className="py-12 md:py-14">
      <SiteContainer className="flex flex-col gap-12">
        <SectionHeading
          as="h1"
          size="page"
          eyebrow="About · How picks get made"
          title="One person, one region, one playlist."
          description="Upper Left Indie is a one-person music project helping more people discover independent artists from across the Northwest. The playlist stays short, the archive keeps growing, and every artist page points listeners directly to the artist."
        />

        <section aria-labelledby="how-picks" className="flex flex-col gap-5">
          <h2 id="how-picks" className="type-display-l text-primary">
            How a track gets picked
          </h2>
          <ol className="grid gap-5 md:grid-cols-2">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="flex flex-col gap-2 rounded-card border-[1.5px] border-subtle bg-surface p-6"
              >
                <p className="type-label-s text-accent">{`Step ${index + 1}`}</p>
                <h3 className="type-heading-m text-primary">{step.title}</h3>
                <p className="type-body-s text-secondary">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="scope" className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-2.5 rounded-card bg-sunken p-7">
            <p className="type-label-m text-accent">The region</p>
            <h2 id="scope" className="type-heading-m text-primary">
              What “upper left” means here
            </h2>
            <p className="type-body-m text-secondary">
              {`Submissions are open to artists across ${REGION_SCOPE}. The directory is a record of who has actually been played, so a handful of artists in it sit outside those lines — usually because the music arrived from someone with roots in the region.`}
            </p>
          </div>

          <div className="flex flex-col gap-2.5 rounded-card bg-sunken p-7">
            <p className="type-label-m text-accent">Consent</p>
            <h2 className="type-heading-m text-primary">
              Artists opt in to being featured
            </h2>
            <p className="type-body-m text-secondary">
              {`An artist page is only created when the artist ticks the box asking for one and provides their own Bandcamp address. The ${artistCount} artists in the directory are there because they asked to be, not because they were scraped into it.`}
            </p>
          </div>
        </section>

        <section
          aria-labelledby="money"
          className="flex flex-col gap-4 rounded-card border-2 border-accent-solid bg-accent-soft p-7 md:p-10"
        >
          <p className="type-label-m text-accent">Where the money goes</p>
          <h2 id="money" className="type-display-l text-primary">
            Not through this site.
          </h2>
          <p className="max-w-measure type-body-l text-secondary">
            There is no store here, no player of our own, and no cut taken from
            anything an artist sells. Every artist links to their own Bandcamp,
            and that is deliberately the only place to buy their music. Tips to
            the project are a separate, smaller ask that keeps submissions free.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/artists" emphasis="primary" size="lg">
              Browse the artists
            </ButtonLink>
            <ButtonLink href="/support-the-project" emphasis="secondary" size="lg">
              Support the project
            </ButtonLink>
          </div>
        </section>

        <p className="type-body-m text-secondary">
          Have a question, a correction, or an artist to pitch?{" "}
          <Link
            href="/contact"
            className="font-medium text-primary underline decoration-subtle underline-offset-4 transition hover:text-accent hover:decoration-accent-solid"
          >
            Get in touch
          </Link>
          , or{" "}
          <Link
            href="/submit"
            className="font-medium text-primary underline decoration-subtle underline-offset-4 transition hover:text-accent hover:decoration-accent-solid"
          >
            send a track
          </Link>
          .
        </p>
      </SiteContainer>
    </section>
  );
}
