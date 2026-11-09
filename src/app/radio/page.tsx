import SiteContainer from "@/app/components/SiteContainer";
import { ButtonLink } from "@/app/components/ui/Button";

export const metadata = {
  title: "Upper Left Radio",
  description:
    "Listen continuously to approved MP3 submissions from independent Pacific Northwest artists.",
  alternates: { canonical: "/radio" },
};

export default function RadioPage() {
  return (
    <section className="py-12 md:py-16">
      <SiteContainer className="grid gap-8 lg:grid-cols-[1fr_360px] lg:gap-16">
        <div className="flex max-w-measure flex-col gap-5">
          <p className="type-label-m text-accent">
            Always shuffling · Artist supplied
          </p>
          <h1 className="type-display-xl text-primary">Upper Left Radio</h1>
          <p className="type-body-l text-secondary">
            A continuous mix of music submitted directly by independent artists
            around the Pacific Northwest. Every MP3 is reviewed before it joins
            the rotation.
          </p>
          <p className="type-body-m text-secondary">
            Press play in the radio bar above. Tracks continue automatically,
            with no published schedule or ranking. When an artist has supplied a
            direct link, use it to follow or support them.
          </p>
        </div>

        <aside className="flex flex-col gap-4 rounded-card border-[1.5px] border-subtle bg-surface p-6">
          <h2 className="type-heading-m text-primary">Send a track</h2>
          <p className="type-body-m text-secondary">
            Artists can submit a Spotify link, an MP3 for radio, or both. Radio
            files remain private unless the submission is accepted.
          </p>
          <ButtonLink href="/submit" emphasis="primary" size="md" fullWidth>
            Submit music
          </ButtonLink>
        </aside>
      </SiteContainer>
    </section>
  );
}
