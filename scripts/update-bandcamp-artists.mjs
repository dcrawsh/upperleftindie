import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const urlsPath = path.join(rootDir, "src/data/bandcamp-urls.json");
const outputPath = path.join(rootDir, "src/data/artists.generated.ts");

const requestHeaders = {
  "User-Agent":
    "UpperLeftIndieBot/1.0 (+https://www.upperleftindie.com; artist metadata generator)",
};

function decodeEntities(value = "") {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCharCode(Number.parseInt(code, 16))
    );
}

function stripTags(value = "") {
  return decodeEntities(value.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUrl(url) {
  return url.trim().replace(/\/+$/, "");
}

function getFallbackName(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "").replace(/\.bandcamp\.com$/, "");
  } catch {
    return "Bandcamp Artist";
  }
}

function getMetaContent(html, property) {
  const pattern = new RegExp(
    `<meta\\s+(?:property|name)=["']${property}["']\\s+content=["']([^"']+)["']`,
    "i"
  );
  return decodeEntities(html.match(pattern)?.[1] || "");
}

function getJsonLdValues(html) {
  const values = [];
  const scriptMatches = html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );

  for (const match of scriptMatches) {
    try {
      values.push(JSON.parse(decodeEntities(match[1]).trim()));
    } catch {
      // Bandcamp has changed this payload before; keep falling through to regexes.
    }
  }

  return values;
}

function getNestedName(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.map(getNestedName).find(Boolean) || "";
  }
  if (typeof value === "object") {
    return getNestedName(value.name);
  }
  return "";
}

function getBandcampProfileImage(html) {
  return (
    decodeEntities(
      html.match(/<a class="popupImage" href="([^"]+)"/i)?.[1] || ""
    ) ||
    getMetaContent(html, "og:image") ||
    decodeEntities(
      html.match(/https:\/\/f4\.bcbits\.com\/img\/[^"'\s<]+/i)?.[0] || ""
    )
  );
}

function getBandName(html, url) {
  const nameFromBio = html.match(
    /<p id="band-name-location">[\s\S]*?<span class="title">([\s\S]*?)<\/span>/i
  )?.[1];
  if (nameFromBio) return stripTags(nameFromBio);

  for (const value of getJsonLdValues(html)) {
    const artistName = getNestedName(value.byArtist || value.artist);
    if (artistName) return stripTags(artistName);
  }

  const tralbumArtist = html.match(/"artist"\s*:\s*"([^"]+)"/i)?.[1];
  if (tralbumArtist) return decodeEntities(tralbumArtist).trim();

  const byArtist = html.match(
    /<span[^>]+itemprop=["']byArtist["'][\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i
  )?.[1];
  if (byArtist) return stripTags(byArtist).replace(/^by\s+/i, "").trim();

  const ogTitle = getMetaContent(html, "og:title");
  if (ogTitle) {
    const titleByArtist = ogTitle.match(/,\s*by\s+(.+)$/i)?.[1];
    if (titleByArtist) return titleByArtist.trim();

    const titlePipeArtist = ogTitle.match(/\|\s*([^|]+)$/)?.[1];
    if (titlePipeArtist) return titlePipeArtist.trim();

    return ogTitle.replace(/^Music\s+\|\s+/i, "").trim();
  }

  return getFallbackName(url);
}

function getLocation(html) {
  const location = html.match(
    /<p id="band-name-location">[\s\S]*?<span class="location[^"]*">([\s\S]*?)<\/span>/i
  )?.[1];
  return location ? stripTags(location) : "";
}

function getBio(html) {
  const bio = html.match(/<p id="bio-text">([\s\S]*?)<\/p>/i)?.[1];
  if (bio) return stripTags(bio);

  return getMetaContent(html, "og:description").replace(/\s+/g, " ").trim();
}

function getReleaseTitle(html, url) {
  for (const value of getJsonLdValues(html)) {
    const title = getNestedName(value.name);
    if (title) return stripTags(title);
  }

  const trackTitle = html.match(
    /<h2[^>]+class=["'][^"']*trackTitle[^"']*["'][^>]*>([\s\S]*?)<\/h2>/i
  )?.[1];
  if (trackTitle) return stripTags(trackTitle);

  const ogTitle = getMetaContent(html, "og:title");
  if (ogTitle) {
    return ogTitle
      .replace(/,\s*by\s+.+$/i, "")
      .replace(/\s+\|\s+.+$/i, "")
      .trim();
  }

  try {
    const slug = new URL(url).pathname.split("/").filter(Boolean).at(-1) || "";
    return slug
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  } catch {
    return "";
  }
}

function getCurrentRelease(html, bandcampUrl) {
  let type = "";
  try {
    type = new URL(bandcampUrl).pathname.includes("/track/") ? "track" : "";
    if (!type && new URL(bandcampUrl).pathname.includes("/album/")) {
      type = "album";
    }
  } catch {
    return null;
  }

  if (!type) return null;

  const title = getReleaseTitle(html, bandcampUrl);
  if (!title) return null;

  return {
    title,
    type,
    url: bandcampUrl,
  };
}

function getExternalLinks(html, bandcampUrl) {
  const links = [
    {
      label: "Bandcamp",
      url: bandcampUrl,
    },
  ];
  const seen = new Set([normalizeUrl(bandcampUrl)]);
  const linkSource = html.match(/<ol id="band-links"[\s\S]*?<\/ol>/i)?.[0] || "";
  const linkMatches = linkSource.matchAll(/<a [^>]*href="(https?:\/\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi);

  for (const match of linkMatches) {
    const url = decodeEntities(match[1]);
    const normalized = normalizeUrl(url);

    if (
      seen.has(normalized) ||
      normalized.includes("bandcamp.com") ||
      normalized.includes("bandcamp.help") ||
      normalized.includes("bcbits.com")
    ) {
      continue;
    }

    let label = stripTags(match[2]);
    if (!label) {
      try {
        label = new URL(url).hostname.replace(/^www\./, "");
      } catch {
        label = "Website";
      }
    }

    links.push({ label, url });
    seen.add(normalized);
  }

  return links.slice(0, 5);
}

function getTags(html) {
  const tags = [];
  const seen = new Set();
  const tagMatches = html.matchAll(
    /<a [^>]*href="https:\/\/bandcamp\.com\/tag\/[^"]+"[^>]*>([\s\S]*?)<\/a>/gi
  );

  for (const match of tagMatches) {
    const tag = stripTags(match[1]).toLowerCase();
    if (!tag || seen.has(tag)) continue;
    tags.push(tag);
    seen.add(tag);
  }

  return tags.slice(0, 10);
}

function getReleases(html, bandcampUrl) {
  const grid = html.match(/<ol id="music-grid"[\s\S]*?<\/ol>/i)?.[0] || "";
  const releases = [];
  const seen = new Set();
  const currentRelease = getCurrentRelease(html, bandcampUrl);

  if (currentRelease) {
    releases.push(currentRelease);
    seen.add(normalizeUrl(currentRelease.url));
  }

  const releaseMatches = grid.matchAll(
    /<li [^>]*data-item-id="(album|track)-[^"]+"[\s\S]*?<a href="([^"]+)"[\s\S]*?<p class="title">([\s\S]*?)<\/p>/gi
  );

  for (const match of releaseMatches) {
    const type = match[1];
    const title = stripTags(match[3]);
    if (!title) continue;

    const url = new URL(decodeEntities(match[2]), bandcampUrl).toString();
    const normalized = normalizeUrl(url);
    if (seen.has(normalized)) continue;

    releases.push({ title, type, url });
    seen.add(normalized);
  }

  return releases.slice(0, 6);
}

async function fetchHtml(url) {
  const response = await fetch(url, { headers: requestHeaders });
  if (!response.ok) {
    throw new Error(`Bandcamp returned ${response.status} for ${url}`);
  }
  return {
    finalUrl: response.url,
    html: await response.text(),
  };
}

async function buildArtist(bandcampUrl) {
  const cleanUrl = normalizeUrl(bandcampUrl) + "/";

  try {
    const { finalUrl, html } = await fetchHtml(cleanUrl);
    const resolvedUrl = normalizeUrl(finalUrl || cleanUrl) + "/";

    return {
      name: getBandName(html, resolvedUrl),
      location: getLocation(html),
      bandcampUrl: resolvedUrl,
      image: getBandcampProfileImage(html),
      bio: getBio(html),
      tags: getTags(html),
      links: getExternalLinks(html, resolvedUrl),
      releases: getReleases(html, resolvedUrl),
    };
  } catch (error) {
    console.warn(error instanceof Error ? error.message : error);
    return {
      name: getFallbackName(cleanUrl),
      location: "",
      bandcampUrl: cleanUrl,
      image: "",
      bio: "Bandcamp profile queued for metadata.",
      tags: [],
      links: [{ label: "Bandcamp", url: cleanUrl }],
      releases: [],
    };
  }
}

function toGeneratedFile(artists) {
  return `export type ArtistLink = {
  label: string;
  url: string;
};

export type ArtistRelease = {
  title: string;
  type: "album" | "track";
  released?: string;
  url: string;
};

export type Artist = {
  name: string;
  location?: string;
  bandcampUrl: string;
  image?: string;
  bio?: string;
  tags: string[];
  links: ArtistLink[];
  releases: ArtistRelease[];
};

export const artists: Artist[] = ${JSON.stringify(artists, null, 2)};
`;
}

async function main() {
  const rawUrls = JSON.parse(await readFile(urlsPath, "utf8"));
  if (!Array.isArray(rawUrls)) {
    throw new Error("src/data/bandcamp-urls.json must be an array of URLs");
  }

  const urls = [...new Set(rawUrls.map((url) => String(url).trim()).filter(Boolean))];
  const artists = [];

  for (const url of urls) {
    console.log(`Fetching ${url}`);
    artists.push(await buildArtist(url));
  }

  await writeFile(outputPath, toGeneratedFile(artists), "utf8");
  console.log(`Wrote ${path.relative(rootDir, outputPath)} with ${artists.length} artists`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
