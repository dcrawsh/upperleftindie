import type { Metadata } from "next";
import Link from "next/link";
import SiteContainer from "../components/SiteContainer";

export const dynamic = "force-dynamic";

type Show = {
  title: string;
  venue_name: string;
  starts_at: string;
  url: string;
};

export const metadata: Metadata = {
  title: "Portland Shows",
  description:
    "A small local show calendar from Portland venues followed by Upper Left Indie.",
  alternates: {
    canonical: "/shows",
  },
  openGraph: {
    title: "Portland Shows | Upper Left Indie",
    description:
      "A small local show calendar from Portland venues followed by Upper Left Indie.",
    url: "/shows",
  },
};

async function getShows() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { shows: [] as Show[], isConfigured: false };
  }

  const params = new URLSearchParams({
    select: "title,venue_name,starts_at,url",
    order: "starts_at.asc",
    limit: "100",
  });
  params.set("starts_at", `gte.${new Date().toISOString()}`);

  const response = await fetch(
    `${supabaseUrl.replace(/\/$/, "")}/rest/v1/shows?${params.toString()}`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      next: {
        revalidate: 900,
      },
    }
  );

  if (!response.ok) {
    console.error("shows fetch failed", response.status, await response.text());
    return { shows: [] as Show[], isConfigured: true };
  }

  return { shows: (await response.json()) as Show[], isConfigured: true };
}

function formatShowDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
  }).format(new Date(value));
}

type ShowsPageProps = {
  searchParams?: Promise<{
    venue?: string | string[];
  }>;
};

export default async function ShowsPage({ searchParams }: ShowsPageProps) {
  const { shows, isConfigured } = await getShows();
  const params = await searchParams;
  const rawVenue = Array.isArray(params?.venue)
    ? params?.venue[0]
    : params?.venue;
  const venues = Array.from(
    new Set(shows.map((show) => show.venue_name).filter(Boolean))
  ).sort((first, second) => first.localeCompare(second));
  const selectedVenue = rawVenue && venues.includes(rawVenue) ? rawVenue : "";
  const visibleShows = selectedVenue
    ? shows.filter((show) => show.venue_name === selectedVenue)
    : shows;

  return (
    <section className="py-10 md:py-20">
      <SiteContainer>
        <div className="max-w-3xl">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-clay sm:mb-4 sm:text-sm sm:tracking-[0.26em]">
            Portland Shows
          </p>
          <h1 className="text-3xl font-black leading-tight text-ink sm:text-4xl md:text-6xl">
            Local shows worth a look.
          </h1>
          <p className="mt-4 text-base leading-7 text-ink/70 sm:mt-6 sm:text-lg sm:leading-8">
            A lightweight calendar scraped weekly from a small set of Portland
            venue calendars. Always confirm details with the venue before you go.
          </p>
        </div>

        {isConfigured && venues.length > 0 ? (
          <div className="mt-8 flex gap-2 overflow-x-auto pb-2 sm:mt-10 sm:flex-wrap sm:overflow-visible sm:pb-0">
            <Link
              href="/shows"
              className={`shrink-0 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.12em] transition ${
                selectedVenue
                  ? "border-ink/15 text-ink/60 hover:border-clay hover:text-clay"
                  : "border-ink bg-ink text-paper"
              }`}
            >
              All
            </Link>
            {venues.map((venue) => (
              <Link
                key={venue}
                href={`/shows?venue=${encodeURIComponent(venue)}`}
                className={`shrink-0 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.12em] transition ${
                  selectedVenue === venue
                    ? "border-ink bg-ink text-paper"
                    : "border-ink/15 text-ink/60 hover:border-clay hover:text-clay"
                }`}
              >
                {venue}
              </Link>
            ))}
          </div>
        ) : null}

        <div className="mt-8 space-y-4 sm:mt-12">
          {!isConfigured ? (
            <p className="rounded-md border border-ink/10 bg-paper/80 p-5 text-sm font-bold text-ink/65">
              Shows are ready for setup. Add Supabase environment variables to
              display upcoming events here.
            </p>
          ) : null}

          {isConfigured && shows.length === 0 ? (
            <p className="rounded-md border border-ink/10 bg-paper/80 p-5 text-sm font-bold text-ink/65">
              No upcoming shows are listed yet.
            </p>
          ) : null}

          {visibleShows.map((show) => (
            <article
              key={`${show.venue_name}-${show.starts_at}-${show.url}`}
              className="rounded-md border border-ink/10 bg-paper/80 p-5 shadow-soft"
            >
              <p className="text-xs font-black uppercase tracking-[0.16em] text-clay">
                {formatShowDate(show.starts_at)}
              </p>
              <h2 className="mt-2 text-xl font-black leading-tight text-ink">
                {show.title}
              </h2>
              <p className="mt-2 text-sm font-bold text-ink/55">
                {show.venue_name}
              </p>
              <a
                href={show.url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex rounded-full border border-ink/15 px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-ink transition hover:border-clay hover:text-clay"
              >
                View details
              </a>
            </article>
          ))}
        </div>
      </SiteContainer>
    </section>
  );
}
