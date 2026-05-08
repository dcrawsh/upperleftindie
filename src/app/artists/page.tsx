import bandcampUrls from "../../data/bandcamp-urls.json";
import { artists as generatedArtists } from "../../data/artists.generated";
import ArtistsBrowser, { type ArtistCard } from "./ArtistsBrowser";

function normalizeUrl(url: string) {
  return url.replace(/\/+$/, "").toLowerCase();
}

function getBandcampHost(url: string) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    return hostname.endsWith(".bandcamp.com") ? hostname : "";
  } catch {
    return "";
  }
}

function isSameBandcampArtist(firstUrl: string, secondUrl: string) {
  const firstHost = getBandcampHost(firstUrl);
  return firstHost !== "" && firstHost === getBandcampHost(secondUrl);
}

function getNameFromBandcampUrl(url: string) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return hostname.replace(/\.bandcamp\.com$/, "");
  } catch {
    return "Bandcamp Artist";
  }
}

const artists: ArtistCard[] = (bandcampUrls as string[]).map((bandcampUrl) => {
  const generatedArtist = generatedArtists.find(
    (artist) =>
      normalizeUrl(artist.bandcampUrl) === normalizeUrl(bandcampUrl) ||
      isSameBandcampArtist(artist.bandcampUrl, bandcampUrl)
  );

  if (generatedArtist) {
    return generatedArtist;
  }

  return {
    name: getNameFromBandcampUrl(bandcampUrl),
    bandcampUrl,
    tags: [],
    links: [],
    releases: [],
  };
});

export const metadata = {
  title: "Support Artists",
  description:
    "Support independent artists featured on the Upper Left Indie playlist.",
  alternates: {
    canonical: "/artists",
  },
  openGraph: {
    title: "Support Artists | Upper Left Indie",
    description:
      "Support independent artists featured on the Upper Left Indie playlist.",
    url: "/artists",
  },
};

export default function ArtistsPage() {
  return (
    <section className="px-4 py-10 sm:px-6 md:px-10 md:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-clay sm:mb-4 sm:text-sm sm:tracking-[0.26em]">
            Featured Artists
          </p>
          <h1 className="text-3xl font-black leading-tight text-ink sm:text-4xl md:text-6xl">
            Artists from the playlist.
          </h1>
          <p className="mt-4 text-base leading-7 text-ink/70 sm:mt-6 sm:text-lg sm:leading-8">
            Here are some of the artists who have been featured on Upper Left
            Indie. Please support them, check out their music, and follow where
            the sound takes you.
          </p>
        </div>

        <ArtistsBrowser artists={artists} />
      </div>
    </section>
  );
}
