import { Suspense } from "react";
import SiteContainer from "../components/SiteContainer";
import SectionHeading from "../components/ui/SectionHeading";
import { getArtists } from "../../lib/artists";
import ArtistsBrowser from "./ArtistsBrowser";

const artists = getArtists();

export const metadata = {
  title: "Artists",
  description:
    "Browse the Northwest artists Upper Left Indie has played, by region and genre. Every artist links straight to their own Bandcamp.",
  alternates: {
    canonical: "/artists",
  },
  openGraph: {
    title: "Artists | Upper Left Indie",
    description:
      "Browse the Northwest artists Upper Left Indie has played, by region and genre.",
    url: "/artists",
  },
};

export default function ArtistsPage() {
  return (
    <section className="py-12 md:py-14">
      <SiteContainer>
        <SectionHeading
          as="h1"
          size="page"
          eyebrow={`${artists.length} artists · Updated as submissions come in`}
          title="Everyone we’ve played."
          description="Every artist here was submitted, listened to, and chosen. Each one links straight to their own Bandcamp — buying from them is the point."
        />

        <Suspense fallback={null}>
          <ArtistsBrowser artists={artists} />
        </Suspense>
      </SiteContainer>
    </section>
  );
}
