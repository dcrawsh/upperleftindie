import Image from "next/image";
import { FaBandcamp } from "react-icons/fa";
import { FiExternalLink, FiMapPin } from "react-icons/fi";
import bandcampUrls from "../../data/bandcamp-urls.json";
import { artists as generatedArtists } from "../../data/artists.generated";

type ArtistCard = {
  name: string;
  location?: string;
  bandcampUrl: string;
  image?: string;
  bio?: string;
  tags: string[];
  links: {
    label: string;
    url: string;
  }[];
  releases: {
    title: string;
    type: "album" | "track";
    released?: string;
    url: string;
  }[];
};

function normalizeUrl(url: string) {
  return url.replace(/\/+$/, "").toLowerCase();
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
    (artist) => normalizeUrl(artist.bandcampUrl) === normalizeUrl(bandcampUrl)
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
  title: "Northwest Artists",
  description:
    "Support independent artists featured on the Upper Left Indie playlist.",
  alternates: {
    canonical: "/artists",
  },
  openGraph: {
    title: "Northwest Artists | Upper Left Indie",
    description:
      "Support independent artists featured on the Upper Left Indie playlist.",
    url: "/artists",
  },
};

export default function ArtistsPage() {
  return (
    <section className="px-6 py-14 md:px-10 md:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-black uppercase tracking-[0.26em] text-clay">
            Featured Artists
          </p>
          <h1 className="text-4xl font-black leading-tight text-ink md:text-6xl">
            Artists from the playlist.
          </h1>
          <p className="mt-6 text-lg leading-8 text-ink/70">
            Here are some of the artists who have been featured on Upper Left
            Indie. Please support them, check out their music, and follow where
            the sound takes you.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {artists.map((artist) => (
            <article
              key={artist.bandcampUrl}
              className="rounded-md border border-ink/10 bg-paper/80 p-6 shadow-soft"
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="grid h-20 w-20 shrink-0 place-items-center rounded-md bg-ink text-2xl font-black text-paper">
                  {artist.image ? (
                    <Image
                      src={artist.image}
                      alt={`${artist.name} artist image`}
                      width={160}
                      height={160}
                      className="h-20 w-20 rounded-md object-cover"
                    />
                  ) : (
                    artist.name
                      .split(" ")
                      .map((word) => word[0])
                      .join("")
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="text-2xl font-black text-ink">{artist.name}</h2>
                  {artist.location ? (
                    <p className="mt-2 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-ink/55">
                      <FiMapPin aria-hidden="true" />
                      {artist.location}
                    </p>
                  ) : null}
                  <p className="mt-4 leading-7 text-ink/70">
                    {artist.bio || "Bandcamp profile queued for metadata."}
                  </p>
                </div>
              </div>

              {artist.tags.length > 0 ? (
                <div className="mt-6 flex flex-wrap gap-2">
                  {artist.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-ink/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-ink/60"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href={artist.bandcampUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-paper transition hover:bg-clay"
                >
                  <FaBandcamp aria-hidden="true" />
                  Listen on Bandcamp
                </a>
                {artist.links
                  .filter((link) => link.url !== artist.bandcampUrl)
                  .map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-ink transition hover:border-clay hover:text-clay"
                    >
                      {link.label}
                      <FiExternalLink aria-hidden="true" />
                    </a>
                  ))}
              </div>

              {artist.releases.length > 0 ? (
                <div className="mt-8 border-t border-ink/10 pt-6">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-ink/55">
                    Bandcamp Releases
                  </h3>
                  <div className="mt-4 divide-y divide-ink/10">
                    {artist.releases.map((release) => (
                      <a
                        key={release.url}
                        href={release.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between gap-4 py-4 transition hover:text-clay"
                      >
                        <span>
                          <span className="block font-bold text-ink">
                          {release.title}
                        </span>
                        <span className="mt-1 block text-xs font-bold uppercase tracking-[0.14em] text-ink/50">
                          {release.type}
                          {release.released ? ` / ${release.released}` : ""}
                        </span>
                      </span>
                        <FiExternalLink className="shrink-0" aria-hidden="true" />
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
