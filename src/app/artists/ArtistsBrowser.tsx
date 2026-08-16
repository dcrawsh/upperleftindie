"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import ArtistCard from "../components/ArtistCard";
import EmptyState from "../components/ui/EmptyState";
import { Button } from "../components/ui/Button";
import { Tag } from "../components/ui/Tag";
import {
  getPrimaryGenre,
  getRegion,
  REGIONS,
  type Artist,
} from "../../lib/artists";

/**
 * Artists browser — Figma "Artists · Desktop 1440" (25:95) and
 * "Artists · Empty filter result" (25:209).
 *
 * Replaces the A–Z / genre toggle with the two axes the data actually
 * supports and a listener actually uses: region and genre, plus a recency
 * sort. Filter state lives in the URL so a filtered view can be shared.
 */
type SortKey = "recent" | "az";

const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });

const sortOptions: Array<{ key: SortKey; label: string }> = [
  { key: "recent", label: "Recently added" },
  { key: "az", label: "A–Z" },
];

function readParam(value: string | null, allowed: string[]) {
  return value && allowed.includes(value) ? value : "";
}

export default function ArtistsBrowser({ artists }: { artists: Artist[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // `artists.generated.ts` is written in source order, and the scraper reads
  // its sources ordered by `created_at` ascending — so a higher index means a
  // more recent addition. This is the only recency signal the directory has;
  // there is no per-artist timestamp in the generated file.
  const indexed = useMemo(
    () =>
      artists.map((artist, index) => ({
        artist,
        addedOrder: index,
        region: getRegion(artist),
        genre: getPrimaryGenre(artist),
      })),
    [artists]
  );

  const regionOptions = useMemo(() => {
    const present = new Set(indexed.map((entry) => entry.region));
    return REGIONS.filter((region) => present.has(region));
  }, [indexed]);

  const genreOptions = useMemo(() => {
    const counts = new Map<string, number>();

    for (const entry of indexed) {
      counts.set(entry.genre, (counts.get(entry.genre) ?? 0) + 1);
    }

    return [...counts.entries()]
      .sort(
        (first, second) =>
          second[1] - first[1] || collator.compare(first[0], second[0])
      )
      .map(([genre]) => genre);
  }, [indexed]);

  const selectedRegion = readParam(searchParams.get("region"), [...regionOptions]);
  const selectedGenre = readParam(searchParams.get("genre"), genreOptions);
  const sort: SortKey = searchParams.get("sort") === "az" ? "az" : "recent";

  const visible = useMemo(() => {
    const filtered = indexed.filter(
      (entry) =>
        (!selectedRegion || entry.region === selectedRegion) &&
        (!selectedGenre || entry.genre === selectedGenre)
    );

    return filtered.sort((first, second) =>
      sort === "az"
        ? collator.compare(first.artist.name, second.artist.name)
        : second.addedOrder - first.addedOrder
    );
  }, [indexed, selectedRegion, selectedGenre, sort]);

  const updateParams = (changes: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(changes)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }

    const query = params.toString();
    router.replace(query ? `/artists?${query}` : "/artists", { scroll: false });
  };

  const activeFilters = [
    selectedRegion ? { key: "region", label: selectedRegion } : null,
    selectedGenre ? { key: "genre", label: selectedGenre } : null,
  ].filter(Boolean) as Array<{ key: string; label: string }>;

  const clearFilters = () => updateParams({ region: "", genre: "" });

  return (
    <div className="mt-8">
      <div className="flex flex-col gap-3.5 border-y border-subtle py-6">
        <div role="group" aria-labelledby="filter-region" className="flex items-center gap-2.5 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
          <span id="filter-region" className="w-20 shrink-0 type-label-s text-tertiary">
            Region
          </span>
          <Tag selected={!selectedRegion} onClick={() => updateParams({ region: "" })}>
            All
            <span className="sr-only"> regions</span>
          </Tag>
          {regionOptions.map((region) => (
            <Tag
              key={region}
              selected={selectedRegion === region}
              onClick={() =>
                updateParams({ region: selectedRegion === region ? "" : region })
              }
            >
              {region}
            </Tag>
          ))}
        </div>

        <div role="group" aria-labelledby="filter-genre" className="flex items-center gap-2.5 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
          <span id="filter-genre" className="w-20 shrink-0 type-label-s text-tertiary">
            Genre
          </span>
          <Tag selected={!selectedGenre} onClick={() => updateParams({ genre: "" })}>
            All
            <span className="sr-only"> genres</span>
          </Tag>
          {genreOptions.map((genre) => (
            <Tag
              key={genre}
              selected={selectedGenre === genre}
              onClick={() =>
                updateParams({ genre: selectedGenre === genre ? "" : genre })
              }
            >
              {genre}
            </Tag>
          ))}
        </div>

        <div role="group" aria-labelledby="filter-sort" className="flex items-center gap-2.5 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
          <span id="filter-sort" className="w-20 shrink-0 type-label-s text-tertiary">
            Sort
          </span>
          {sortOptions.map((option) => (
            <Tag
              key={option.key}
              selected={sort === option.key}
              onClick={() =>
                updateParams({ sort: option.key === "recent" ? "" : option.key })
              }
            >
              {option.label}
            </Tag>
          ))}
        </div>
      </div>

      <p className="mt-6 type-body-s text-secondary" role="status" aria-live="polite">
        {`Showing ${visible.length} of ${artists.length} artists`}
        {activeFilters.length > 0
          ? ` · ${activeFilters.map((filter) => filter.label).join(" · ")}`
          : ""}
      </p>

      {visible.length > 0 ? (
        <ul className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((entry) => (
            <li key={entry.artist.bandcampUrl} className="flex min-w-0">
              <ArtistCard artist={entry.artist} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6">
          <EmptyState
            title={`No ${selectedGenre ? `${selectedGenre} ` : ""}artists${
              selectedRegion ? ` from ${selectedRegion}` : ""
            } yet`}
            description="Only a fraction of the Northwest is on the playlist so far. Try clearing one filter, or browse everything."
            action={
              <Button emphasis="secondary" size="md" onClick={clearFilters}>
                Clear filters
              </Button>
            }
          />
        </div>
      )}
    </div>
  );
}
