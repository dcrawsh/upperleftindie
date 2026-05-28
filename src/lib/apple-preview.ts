type AppleSearchResult = {
  wrapperType?: string;
  kind?: string;
  artistName?: string;
  trackName?: string;
  collectionName?: string;
  previewUrl?: string;
};

type AppleSearchResponse = {
  resultCount: number;
  results: AppleSearchResult[];
};

export class ApplePreviewError extends Error {
  constructor(
    message: string,
    readonly status = 500
  ) {
    super(message);
  }
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\b(feat|ft)\.?\b.*$/g, "")
    .replace(/\([^)]*\)|\[[^\]]*\]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getArtistCandidates(artistNames: string) {
  return artistNames
    .split(",")
    .map((artist) => normalize(artist))
    .filter(Boolean);
}

function scoreResult(
  result: AppleSearchResult,
  trackName: string,
  artistNames: string,
  albumName: string
) {
  const wantedTrack = normalize(trackName);
  const wantedArtists = getArtistCandidates(artistNames);
  const wantedAlbum = normalize(albumName);
  const resultTrack = normalize(result.trackName ?? "");
  const resultArtist = normalize(result.artistName ?? "");
  const resultAlbum = normalize(result.collectionName ?? "");

  if (!result.previewUrl || result.kind !== "song") return 0;

  let score = 0;

  if (resultTrack === wantedTrack) {
    score += 70;
  } else if (
    resultTrack.includes(wantedTrack) ||
    wantedTrack.includes(resultTrack)
  ) {
    score += 35;
  }

  if (
    wantedArtists.some(
      (artist) => resultArtist === artist || resultArtist.includes(artist)
    )
  ) {
    score += 25;
  }

  if (wantedAlbum && resultAlbum === wantedAlbum) {
    score += 10;
  }

  return score;
}

export async function findApplePreview({
  trackName,
  artistNames,
  albumName = "",
}: {
  trackName: string;
  artistNames: string;
  albumName?: string;
}) {
  if (!trackName || !artistNames) {
    throw new ApplePreviewError("Track name and artist names are required.", 400);
  }

  const searchParams = new URLSearchParams({
    term: `${trackName} ${artistNames}`,
    media: "music",
    entity: "song",
    limit: "10",
    country: "US",
  });
  const response = await fetch(
    `https://itunes.apple.com/search?${searchParams.toString()}`
  );

  if (!response.ok) {
    throw new ApplePreviewError(
      `Apple preview lookup failed with ${response.status}.`,
      502
    );
  }

  const data = (await response.json()) as AppleSearchResponse;
  const bestMatch = data.results
    .map((result) => ({
      result,
      score: scoreResult(result, trackName, artistNames, albumName),
    }))
    .sort((a, b) => b.score - a.score)[0];

  if (!bestMatch || bestMatch.score < 70 || !bestMatch.result.previewUrl) {
    throw new ApplePreviewError("No Apple preview match found.", 404);
  }

  return {
    previewUrl: bestMatch.result.previewUrl,
    source: "apple",
    matchedTrack: bestMatch.result.trackName,
    matchedArtist: bestMatch.result.artistName,
  };
}
