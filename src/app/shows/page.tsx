import type { Metadata } from "next";
import Link from "next/link";
import SiteContainer from "../components/SiteContainer";
import EmptyState from "../components/ui/EmptyState";
import SectionHeading from "../components/ui/SectionHeading";
import { ButtonLink } from "../components/ui/Button";

export const dynamic = "force-dynamic";

type Show = {
  title: string;
  artist_name: string | null;
  genre: string | null;
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
    select: "title,artist_name,genre,venue_name,starts_at,url",
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
    timeZone: "America/Los_Angeles",
  }).format(new Date(value));
}

function formatShowTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
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

/**
 * Shows — built from the Figma system rather than a dedicated high-fidelity
 * frame. The route keeps its real Supabase read, its venue filter (which stays
 * server-side and link-based, so it works without JavaScript) and both of its
 * existing empty states; only the presentation is brought onto the design
 * system. The homepage and header now link here — it previously had no inbound
 * links at all.
 */
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

  const tagClasses = (isSelected: boolean) =>
    `inline-flex h-11 shrink-0 items-center justify-center rounded-full border-[1.5px] px-3.5 type-label-m transition ${
      isSelected
        ? "border-inverse bg-inverse text-on-inverse"
        : "border-subtle bg-surface text-secondary hover:border-accent-solid hover:text-accent"
    }`;

  return (
    <section className="py-12 md:py-14">
      <SiteContainer>
        <SectionHeading
          as="h1"
          size="page"
          eyebrow="Portland shows · Updated weekly"
          title="Local shows worth a look."
          description="A lightweight calendar scraped from a small set of Portland venue calendars. Always confirm details with the venue before you go."
        />

        {isConfigured && venues.length > 0 ? (
          <nav
            aria-label="Filter shows by venue"
            className="mt-8 flex gap-2.5 overflow-x-auto border-y border-subtle py-6 sm:flex-wrap sm:overflow-visible"
          >
            <Link
              href="/shows"
              aria-current={selectedVenue ? undefined : "true"}
              className={tagClasses(!selectedVenue)}
            >
              All venues
            </Link>
            {venues.map((venue) => (
              <Link
                key={venue}
                href={`/shows?venue=${encodeURIComponent(venue)}`}
                aria-current={selectedVenue === venue ? "true" : undefined}
                className={tagClasses(selectedVenue === venue)}
              >
                {venue}
              </Link>
            ))}
          </nav>
        ) : null}

        {isConfigured && shows.length > 0 ? (
          <p className="mt-6 type-body-s text-secondary">
            {`Showing ${visibleShows.length} upcoming ${
              visibleShows.length === 1 ? "show" : "shows"
            }`}
            {selectedVenue ? ` at ${selectedVenue}` : ""}
          </p>
        ) : null}

        <div className="mt-6">
          {!isConfigured ? (
            <EmptyState
              title="Shows are ready for setup"
              description="Add the Supabase environment variables to display upcoming events here."
            />
          ) : shows.length === 0 ? (
            <EmptyState
              title="No upcoming shows are listed yet"
              description="The calendar is scraped from a small set of Portland venues, so it goes quiet between updates. The playlist does not."
              action={
                <ButtonLink href="/" emphasis="secondary" size="md">
                  Listen instead
                </ButtonLink>
              }
            />
          ) : visibleShows.length === 0 ? (
            <EmptyState
              title={`Nothing listed at ${selectedVenue} right now`}
              description="Try another venue, or see everything that is coming up."
              action={
                <ButtonLink href="/shows" emphasis="secondary" size="md">
                  Show all venues
                </ButtonLink>
              }
            />
          ) : (
            <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {visibleShows.map((show) => (
                <li
                  key={`${show.venue_name}-${show.starts_at}-${show.url}`}
                  className="flex min-w-0"
                >
                  <article className="flex w-full flex-col gap-2.5 rounded-card border-[1.5px] border-subtle bg-surface p-6">
                    <p className="type-label-s text-accent">
                      {formatShowDate(show.starts_at)} ·{" "}
                      {formatShowTime(show.starts_at)}
                    </p>
                    <h2 className="type-heading-m text-primary">
                      {show.artist_name || show.title}
                    </h2>
                    <p className="type-body-s text-secondary">
                      {show.venue_name}
                      {show.genre ? ` · ${show.genre}` : ""}
                    </p>
                    <div className="mt-auto pt-3">
                      <a
                        href={show.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-11 items-center rounded-full border-[1.5px] border-strong px-3.5 type-label-s text-primary transition hover:border-accent-solid hover:text-accent"
                      >
                        View details
                        <span className="sr-only">{` for ${
                          show.artist_name || show.title
                        } at ${show.venue_name}`}</span>
                      </a>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SiteContainer>
    </section>
  );
}
