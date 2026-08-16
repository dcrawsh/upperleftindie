import SiteContainer from "../components/SiteContainer";
import SectionHeading from "../components/ui/SectionHeading";
import { ButtonLink } from "../components/ui/Button";

export const metadata = {
  title: "Northwest Music Notes",
  description:
    "Notes, interviews, and discoveries from Upper Left Indie, a local Northwest independent music curator.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "Northwest Music Notes | Upper Left Indie",
    description:
      "Local Northwest music notes, interviews, and discoveries from Upper Left Indie.",
    url: "/blog",
  },
};

/**
 * The route stays so existing links keep working, but it no longer holds a
 * top-level navigation slot — it promised content it does not have.
 */
export default function BlogPage() {
  return (
    <section className="py-16 md:py-20">
      <SiteContainer>
        <SectionHeading
          as="h1"
          size="page"
          eyebrow="Notes"
          title="Nothing written up yet."
          description="Notes, interviews, and Northwest music discoveries are still to come. Until then, the playlist and the artist directory are where the work is."
        />

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/" emphasis="primary" size="lg">
            Listen to the playlist
          </ButtonLink>
          <ButtonLink href="/artists" emphasis="secondary" size="lg">
            Browse the artists
          </ButtonLink>
        </div>
      </SiteContainer>
    </section>
  );
}
