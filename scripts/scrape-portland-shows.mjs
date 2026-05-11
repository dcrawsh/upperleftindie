import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const sourcesPath = path.join(rootDir, "src/data/show-sources.json");

const requestHeaders = {
  "User-Agent":
    "UpperLeftIndieBot/1.0 (+https://www.upperleftindie.com; local shows scraper)",
  Accept: "text/html,application/xhtml+xml",
};

function stripTags(value = "") {
  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeEntities(value = "") {
  return String(value)
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function htmlToLines(html) {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(
        /<\/?(?:article|aside|br|div|figcaption|h[1-6]|header|li|main|p|section|time|ul|ol)[^>]*>/gi,
        "\n"
      )
      .replace(/<[^>]+>/g, " ")
  )
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function getNestedName(value) {
  if (!value) return "";
  if (typeof value === "string") return stripTags(decodeEntities(value));
  if (Array.isArray(value)) return value.map(getNestedName).find(Boolean) || "";
  if (typeof value === "object") return getNestedName(value.name);
  return "";
}

function getNestedUrl(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(getNestedUrl).find(Boolean) || "";
  if (typeof value === "object") return getNestedUrl(value.url || value["@id"]);
  return "";
}

function isEventType(type) {
  const types = Array.isArray(type) ? type : [type];
  return types.some((value) => /^(event|musicevent)$/i.test(String(value)));
}

function collectJsonLdEvents(value, events = []) {
  if (!value) return events;

  if (Array.isArray(value)) {
    for (const item of value) {
      collectJsonLdEvents(item, events);
    }
    return events;
  }

  if (typeof value !== "object") return events;

  if (isEventType(value["@type"])) {
    events.push(value);
  }

  for (const nestedValue of Object.values(value)) {
    if (nestedValue && typeof nestedValue === "object") {
      collectJsonLdEvents(nestedValue, events);
    }
  }

  return events;
}

function getJsonLdEvents(html) {
  const events = [];
  const matches = html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );

  for (const match of matches) {
    const rawJson = decodeEntities(match[1]).trim();
    if (!rawJson) continue;

    try {
      collectJsonLdEvents(JSON.parse(rawJson), events);
    } catch (error) {
      console.warn("Could not parse JSON-LD block", error.message);
    }
  }

  return events;
}

function toIsoDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function getEventUrl(event, sourceUrl) {
  const rawUrl = getNestedUrl(event.url || event.mainEntityOfPage) || sourceUrl;

  try {
    return new URL(rawUrl, sourceUrl).toString();
  } catch {
    return sourceUrl;
  }
}

function getSourceId(source, show) {
  const key = [source.key, show.url, show.starts_at, show.title].join("|");
  const hash = createHash("sha1").update(key).digest("hex").slice(0, 16);
  return `${source.key}:${hash}`;
}

function normalizeEvent(source, event) {
  const title = getNestedName(event.name);
  const startsAt = toIsoDate(event.startDate);

  if (!title || !startsAt) return null;

  const url = getEventUrl(event, source.url);
  const venueName = getNestedName(event.location) || source.name;
  const show = {
    source_id: "",
    venue_name: venueName,
    title,
    starts_at: startsAt,
    url,
    scraped_at: new Date().toISOString(),
  };

  return {
    ...show,
    source_id: getSourceId(source, show),
  };
}

const monthPattern =
  "(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Sept|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)";
const weekdayPattern =
  "(?:Sun(?:day)?|Mon(?:day)?|Tue(?:sday)?|Tues|Wed(?:nesday)?|Thu(?:rsday)?|Thurs|Fri(?:day)?|Sat(?:urday)?)";
const datePattern = new RegExp(
  `^(?:${weekdayPattern},?\\s+)?${monthPattern}\\.?\\s+(\\d{1,2})(?:,?\\s+(\\d{4}))?(?:\\s+(\\d{1,2})(?::(\\d{2}))?\\s*(am|pm))?`,
  "i"
);
const longDatePattern = new RegExp(
  `^${weekdayPattern}\\s+${monthPattern}\\.?\\s+(\\d{1,2})(?:,?\\s+(\\d{4}))?(?:\\s+(\\d{1,2})(?::(\\d{2}))?\\s*(am|pm))?`,
  "i"
);
const timePattern = /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i;
const skipTitlePattern =
  /^(all ages|ages|buy tickets|calendar|doors|free|google calendar|ics|image|more info|rsvp|skip to content|tickets|view event|website accessibility)$/i;

function parseDateLine(line) {
  const match = line.match(datePattern) || line.match(longDatePattern);
  if (!match) return null;

  const monthName = match[1];
  const day = match[2];
  const explicitYear = match[3];
  const hour = match[4];
  const minute = match[5] || "00";
  const meridiem = match[6];
  const currentYear = new Date().getFullYear();
  let year = explicitYear ? Number(explicitYear) : currentYear;
  const date = new Date(`${monthName} ${day}, ${year} 12:00:00`);

  if (!explicitYear && date.getTime() < Date.now() - 1000 * 60 * 60 * 24 * 30) {
    year += 1;
  }

  const parsedTime = hour && meridiem ? { hour, minute, meridiem } : null;

  return {
    dateLabel: `${monthName} ${day}, ${year}`,
    time: parsedTime,
  };
}

function parseTimeLine(line) {
  const match = line.match(timePattern);
  if (!match) return null;

  return {
    hour: match[1],
    minute: match[2] || "00",
    meridiem: match[3],
  };
}

function toShowIso(dateInfo, timeInfo) {
  const time = timeInfo || dateInfo.time || {
    hour: "7",
    minute: "00",
    meridiem: "pm",
  };
  const date = new Date(
    `${dateInfo.dateLabel} ${time.hour}:${time.minute} ${time.meridiem}`
  );

  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function isTitleCandidate(line, source) {
  if (!line || line.length < 3) return false;
  if (skipTitlePattern.test(line)) return false;
  if (line === source.name) return false;
  if (/^\$?\d+(?:\.\d{2})?$/.test(line)) return false;
  if (/^(doors|cover|ages?|all ages|21\+|free|sold out)\b/i.test(line)) {
    return false;
  }
  if (/\bpresents?:?$/i.test(line)) return false;
  if (parseDateLine(line) || parseTimeLine(line)) return false;
  return true;
}

function findNearbyTitle(lines, index, source) {
  for (let offset = 1; offset <= 5; offset += 1) {
    const previous = lines[index - offset];
    if (isTitleCandidate(previous, source)) return previous;
  }

  for (let offset = 1; offset <= 8; offset += 1) {
    const next = lines[index + offset];
    if (isTitleCandidate(next, source)) return next;
  }

  return "";
}

function findNearbyTime(lines, index) {
  for (let offset = 1; offset <= 5; offset += 1) {
    const time = parseTimeLine(lines[index + offset] || "");
    if (time) return time;
  }

  return null;
}

function getLineEventUrl(source) {
  return source.url;
}

function getHtmlLineEvents(source, html) {
  const lines = htmlToLines(html);
  const seen = new Set();
  const shows = [];

  for (let index = 0; index < lines.length; index += 1) {
    const dateInfo = parseDateLine(lines[index]);
    if (!dateInfo) continue;

    const title = findNearbyTitle(lines, index, source);
    if (!title) continue;

    const startsAt = toShowIso(dateInfo, findNearbyTime(lines, index));
    if (!startsAt) continue;

    const show = {
      source_id: "",
      venue_name: source.name,
      title,
      starts_at: startsAt,
      url: getLineEventUrl(source),
      scraped_at: new Date().toISOString(),
    };
    const sourceId = getSourceId(source, show);

    if (seen.has(sourceId)) continue;
    seen.add(sourceId);
    shows.push({
      ...show,
      source_id: sourceId,
    });
  }

  return shows;
}

async function scrapeSource(source) {
  const response = await fetch(source.url, { headers: requestHeaders });

  if (!response.ok) {
    throw new Error(`${source.name} returned ${response.status}`);
  }

  const html = await response.text();
  let shows = getJsonLdEvents(html)
    .map((event) => normalizeEvent(source, event))
    .filter(Boolean);

  if (shows.length === 0 && source.parser === "html-lines") {
    shows = getHtmlLineEvents(source, html);
    console.log(`${source.name}: ${shows.length} HTML line shows`);
    return shows;
  }

  console.log(`${source.name}: ${shows.length} JSON-LD shows`);
  return shows;
}

async function upsertShows(shows) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (process.env.DRY_RUN === "1") {
    console.log(JSON.stringify(shows, null, 2));
    return;
  }

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  if (shows.length === 0) {
    console.log("No shows to upsert.");
    return;
  }

  const response = await fetch(
    `${supabaseUrl.replace(/\/$/, "")}/rest/v1/shows?on_conflict=source_id`,
    {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(shows),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Supabase upsert failed with ${response.status}: ${await response.text()}`
    );
  }

  console.log(`Upserted ${shows.length} shows.`);
}

async function main() {
  const sources = JSON.parse(await readFile(sourcesPath, "utf8"));
  const results = await Promise.allSettled(sources.map(scrapeSource));
  const shows = [];

  for (const result of results) {
    if (result.status === "fulfilled") {
      shows.push(...result.value);
    } else {
      console.warn(result.reason instanceof Error ? result.reason.message : result.reason);
    }
  }

  const upcomingShows = shows
    .filter((show) => new Date(show.starts_at).getTime() >= Date.now())
    .sort((first, second) => first.starts_at.localeCompare(second.starts_at));

  await upsertShows(upcomingShows);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
