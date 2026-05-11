"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { FaBandcamp } from "react-icons/fa";
import { FiExternalLink, FiMapPin, FiTag, FiType } from "react-icons/fi";

export type ArtistCard = {
  name: string;
  location?: string;
  bandcampUrl: string;
  image?: string;
  bio?: string;
  submittedGenre?: string;
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

type FilterMode = "alphabetical" | "genre";

const collator = new Intl.Collator("en", {
  numeric: true,
  sensitivity: "base",
});

const inferredGenreMatchers = [
  { label: "Dream Pop", patterns: [/dream[- ]pop/i] },
  { label: "Power Pop", patterns: [/power pop/i] },
  { label: "Post-Rock", patterns: [/post-rock/i] },
  { label: "Post-Punk", patterns: [/post-punk/i] },
  { label: "Indie Folk", patterns: [/indie[- ]folk/i] },
  { label: "Indie Rock", patterns: [/indie rock/i] },
  { label: "Electronic", patterns: [/electronic/i, /electro[- ]rock/i] },
  { label: "Experimental", patterns: [/experimental/i, /sound artist/i] },
  { label: "Americana", patterns: [/americana/i] },
  { label: "Grunge", patterns: [/grunge/i] },
  { label: "Punk", patterns: [/punk/i] },
  { label: "Folk", patterns: [/folk/i] },
  { label: "Soul", patterns: [/soul/i] },
  { label: "Blues", patterns: [/blues/i] },
  {
    label: "Rock",
    patterns: [/rock/i, /rock & roll/i, /rock and roll/i, /guitar-driven/i],
  },
];

function formatGenre(value: string) {
  return value
    .split(/([\s/-]+)/)
    .map((part) =>
      /^[a-z]/i.test(part)
        ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
        : part
    )
    .join("");
}

function getPrimaryGenre(artist: ArtistCard) {
  if (artist.submittedGenre) {
    return artist.submittedGenre;
  }

  if (artist.tags[0]) {
    return formatGenre(artist.tags[0]);
  }

  const searchableText = `${artist.name} ${artist.bio ?? ""}`;
  const inferredGenre = inferredGenreMatchers.find((genre) =>
    genre.patterns.some((pattern) => pattern.test(searchableText))
  );

  return inferredGenre?.label || "Uncategorized";
}

function sortAlphabetically(artists: ArtistCard[]) {
  return [...artists].sort((first, second) =>
    collator.compare(first.name, second.name)
  );
}

function sortByGenre(artists: ArtistCard[]) {
  return sortAlphabetically(artists).sort((first, second) => {
    const genreComparison = collator.compare(
      getPrimaryGenre(first),
      getPrimaryGenre(second)
    );

    return genreComparison || collator.compare(first.name, second.name);
  });
}

function getInitialLetter(artist: ArtistCard) {
  const firstCharacter = artist.name.trim().charAt(0).toUpperCase();
  return /^[A-Z]$/.test(firstCharacter) ? firstCharacter : "#";
}

function groupByGenre(artists: ArtistCard[]) {
  return sortByGenre(artists).reduce<Record<string, ArtistCard[]>>(
    (groups, artist) => {
      const genre = getPrimaryGenre(artist);
      return {
        ...groups,
        [genre]: [...(groups[genre] ?? []), artist],
      };
    },
    {}
  );
}

function ArtistArticle({
  artist,
  selectedGenre,
  onSelectGenre,
}: {
  artist: ArtistCard;
  selectedGenre?: string;
  onSelectGenre: (genre: string) => void;
}) {
  const primaryGenre = getPrimaryGenre(artist);

  return (
    <article className="min-w-0 rounded-md border border-ink/10 bg-paper/80 p-4 shadow-soft sm:p-6">
      <div className="flex min-w-0 gap-4 sm:gap-5">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-md bg-ink text-lg font-black text-paper sm:h-20 sm:w-20 sm:text-2xl">
          {artist.image ? (
            <Image
              src={artist.image}
              alt={`${artist.name} artist image`}
              width={160}
              height={160}
              className="h-16 w-16 rounded-md object-cover sm:h-20 sm:w-20"
            />
          ) : (
            artist.name
              .split(" ")
              .map((word) => word[0])
              .join("")
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="break-words text-xl font-black leading-tight text-ink sm:text-2xl">
            {artist.name}
          </h2>
          {artist.location ? (
            <p className="mt-2 flex items-start gap-2 text-xs font-bold uppercase leading-5 tracking-[0.1em] text-ink/55 sm:text-sm sm:tracking-[0.14em]">
              <FiMapPin className="mt-0.5 shrink-0" aria-hidden="true" />
              {artist.location}
            </p>
          ) : null}
          <p className="mt-3 text-sm leading-6 text-ink/70 sm:mt-4 sm:text-base sm:leading-7">
            {artist.bio || "Bandcamp profile queued for metadata."}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2 sm:mt-6">
        <button
          type="button"
          onClick={() => onSelectGenre(primaryGenre)}
          className={`rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] transition sm:tracking-[0.12em] ${
            selectedGenre === primaryGenre
              ? "border-ink bg-ink text-paper"
              : "border-clay/25 bg-clay/10 text-ink/70 hover:border-clay hover:text-ink"
          }`}
          aria-pressed={selectedGenre === primaryGenre}
        >
          {primaryGenre}
        </button>
      </div>

      {artist.tags.length > 1 ? (
        <div className="mt-3 flex flex-wrap gap-2 sm:mt-4">
          {artist.tags.slice(1).map((tag) => (
            <button
              type="button"
              key={tag}
              onClick={() => onSelectGenre(formatGenre(tag))}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] transition sm:tracking-[0.12em] ${
                selectedGenre === formatGenre(tag)
                  ? "border-ink bg-ink text-paper"
                  : "border-ink/10 text-ink/60 hover:border-clay hover:text-clay"
              }`}
              aria-pressed={selectedGenre === formatGenre(tag)}
            >
              {formatGenre(tag)}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-6 grid gap-3 sm:mt-7 sm:flex sm:flex-wrap">
        <a
          href={artist.bandcampUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.08em] text-paper transition hover:bg-clay sm:px-5 sm:text-sm sm:tracking-[0.12em]"
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
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-ink/15 px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.08em] text-ink transition hover:border-clay hover:text-clay sm:px-5 sm:text-sm sm:tracking-[0.12em]"
            >
              <span className="min-w-0 break-words">{link.label}</span>
              <FiExternalLink className="shrink-0" aria-hidden="true" />
            </a>
          ))}
      </div>

      {artist.releases.length > 0 ? (
        <div className="mt-7 border-t border-ink/10 pt-5 sm:mt-8 sm:pt-6">
          <h3 className="text-xs font-black uppercase tracking-[0.16em] text-ink/55 sm:text-sm sm:tracking-[0.2em]">
            Bandcamp Releases
          </h3>
          <div className="mt-3 divide-y divide-ink/10 sm:mt-4">
            {artist.releases.map((release) => (
              <a
                key={release.url}
                href={release.url}
                target="_blank"
                rel="noreferrer"
                className="flex min-w-0 items-start justify-between gap-3 py-4 transition hover:text-clay sm:items-center sm:gap-4"
              >
                <span className="min-w-0">
                  <span className="block break-words text-sm font-bold leading-5 text-ink sm:text-base sm:leading-6">
                    {release.title}
                  </span>
                  <span className="mt-1 block text-xs font-bold uppercase leading-5 tracking-[0.1em] text-ink/50 sm:tracking-[0.14em]">
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
  );
}

export default function ArtistsBrowser({ artists }: { artists: ArtistCard[] }) {
  const [filterMode, setFilterMode] = useState<FilterMode>("alphabetical");
  const [selectedLetter, setSelectedLetter] = useState<string | undefined>();
  const [selectedGenre, setSelectedGenre] = useState<string | undefined>();

  const alphabeticalArtists = useMemo(() => sortAlphabetically(artists), [artists]);
  const genreGroups = useMemo(() => groupByGenre(artists), [artists]);
  const genreOptions = useMemo(() => Object.keys(genreGroups), [genreGroups]);
  const letterOptions = useMemo(
    () =>
      [...new Set(alphabeticalArtists.map((artist) => getInitialLetter(artist)))],
    [alphabeticalArtists]
  );
  const alphabetFilteredArtists = useMemo(
    () =>
      selectedLetter
        ? alphabeticalArtists.filter(
            (artist) => getInitialLetter(artist) === selectedLetter
          )
        : alphabeticalArtists,
    [alphabeticalArtists, selectedLetter]
  );
  const genreFilteredArtists = useMemo(
    () =>
      selectedGenre
        ? sortAlphabetically(genreGroups[selectedGenre] ?? [])
        : sortByGenre(artists),
    [artists, genreGroups, selectedGenre]
  );
  const visibleArtistCount =
    filterMode === "alphabetical"
      ? alphabetFilteredArtists.length
      : genreFilteredArtists.length;

  const handleFilterModeChange = (nextFilterMode: FilterMode) => {
    setFilterMode(nextFilterMode);
    if (nextFilterMode === "alphabetical") {
      setSelectedGenre(undefined);
    } else {
      setSelectedLetter(undefined);
    }
  };

  const handleLetterSelect = (letter?: string) => {
    setFilterMode("alphabetical");
    setSelectedLetter(letter);
    setSelectedGenre(undefined);
  };

  const handleGenreSelect = (genre: string) => {
    setFilterMode("genre");
    setSelectedLetter(undefined);
    setSelectedGenre((currentGenre) =>
      currentGenre === genre ? undefined : genre
    );
  };

  return (
    <div className="mt-8 sm:mt-12">
      <div className="mb-5 flex flex-col gap-4 border-y border-ink/10 py-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-bold text-ink/60">
          Showing {visibleArtistCount} artists
        </p>
        <div className="grid grid-cols-2 rounded-full border border-ink/15 bg-white p-1 sm:inline-flex">
          <button
            type="button"
            onClick={() => handleFilterModeChange("alphabetical")}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-xs font-bold uppercase tracking-[0.1em] transition sm:min-h-10 sm:tracking-[0.12em] ${
              filterMode === "alphabetical"
                ? "bg-ink text-paper"
                : "text-ink/65 hover:text-ink"
            }`}
            aria-pressed={filterMode === "alphabetical"}
          >
            <FiType aria-hidden="true" />
            A-Z
          </button>
          <button
            type="button"
            onClick={() => handleFilterModeChange("genre")}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-xs font-bold uppercase tracking-[0.1em] transition sm:min-h-10 sm:tracking-[0.12em] ${
              filterMode === "genre"
                ? "bg-ink text-paper"
                : "text-ink/65 hover:text-ink"
            }`}
            aria-pressed={filterMode === "genre"}
          >
            <FiTag aria-hidden="true" />
            Genre
          </button>
        </div>
      </div>

      <div className="mb-7 sm:mb-8">
        {filterMode === "alphabetical" ? (
          <>
            <div className="mb-4 grid grid-cols-[repeat(auto-fill,minmax(2.5rem,1fr))] gap-2 sm:flex sm:flex-wrap">
              <button
                type="button"
                onClick={() => handleLetterSelect(undefined)}
                className={`min-h-10 rounded-full border px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] transition sm:px-4 sm:tracking-[0.12em] ${
                  !selectedLetter
                    ? "border-ink bg-ink text-paper"
                    : "border-ink/10 bg-white text-ink/65 hover:border-clay hover:text-clay"
                }`}
                aria-pressed={!selectedLetter}
              >
                All
              </button>
              {letterOptions.map((letter) => (
                <button
                  type="button"
                  key={letter}
                  onClick={() => handleLetterSelect(letter)}
                  className={`min-h-10 rounded-full border px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] transition sm:min-w-10 sm:tracking-[0.12em] ${
                    selectedLetter === letter
                      ? "border-ink bg-ink text-paper"
                      : "border-ink/10 bg-white text-ink/65 hover:border-clay hover:text-clay"
                  }`}
                  aria-pressed={selectedLetter === letter}
                >
                  {letter}
                </button>
              ))}
            </div>
            <p className="text-sm font-bold text-ink/55">
              {selectedLetter
                ? `Showing artists filed under ${selectedLetter}`
                : "Showing all artists alphabetically"}
            </p>
          </>
        ) : (
          <>
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedGenre(undefined)}
              className={`min-h-10 rounded-full border px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] transition sm:px-4 sm:tracking-[0.12em] ${
                !selectedGenre
                  ? "border-ink bg-ink text-paper"
                  : "border-ink/10 bg-white text-ink/65 hover:border-clay hover:text-clay"
              }`}
              aria-pressed={!selectedGenre}
            >
              All
            </button>
            {genreOptions.map((genre) => (
              <button
                type="button"
                key={genre}
                onClick={() => handleGenreSelect(genre)}
                className={`min-h-10 rounded-full border px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] transition sm:px-4 sm:tracking-[0.12em] ${
                  selectedGenre === genre
                    ? "border-ink bg-ink text-paper"
                    : "border-ink/10 bg-white text-ink/65 hover:border-clay hover:text-clay"
                }`}
                aria-pressed={selectedGenre === genre}
              >
                {genre}
              </button>
            ))}
          </div>
          <p className="text-sm font-bold text-ink/55">
            {selectedGenre
              ? `Showing ${visibleArtistCount} ${selectedGenre} artists`
              : "Showing all artists grouped by genre"}
          </p>
          </>
        )}
      </div>

      {filterMode === "genre" && !selectedGenre ? (
        <div className="space-y-8 sm:space-y-10">
          {Object.entries(genreGroups).map(([genre, groupedArtists]) => (
            <section key={genre}>
              <h2 className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-ink/55 sm:mb-4 sm:text-sm sm:tracking-[0.2em]">
                {genre}
              </h2>
              <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                {groupedArtists.map((artist) => (
                  <ArtistArticle
                    key={artist.bandcampUrl}
                    artist={artist}
                    selectedGenre={selectedGenre}
                    onSelectGenre={handleGenreSelect}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : filterMode === "genre" ? (
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          {genreFilteredArtists.map((artist) => (
            <ArtistArticle
              key={artist.bandcampUrl}
              artist={artist}
              selectedGenre={selectedGenre}
              onSelectGenre={handleGenreSelect}
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          {alphabetFilteredArtists.map((artist) => (
            <ArtistArticle
              key={artist.bandcampUrl}
              artist={artist}
              selectedGenre={selectedGenre}
              onSelectGenre={handleGenreSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
