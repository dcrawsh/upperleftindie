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

const browserRequestHeaders = {
  ...requestHeaders,
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

function getRequestHeaders(url) {
  try {
    const hostname = new URL(url).hostname;
    if (hostname === "dopdx.com" || hostname.endsWith(".dopdx.com")) {
      return browserRequestHeaders;
    }
  } catch {
    return requestHeaders;
  }

  return requestHeaders;
}

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
    .replace(/&#(\d+);/g, (_, codePoint) => String.fromCodePoint(Number(codePoint)))
    .replace(/&#x([\da-f]+);/gi, (_, codePoint) =>
      String.fromCodePoint(Number.parseInt(codePoint, 16))
    )
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function normalizeHref(href, sourceUrl) {
  if (!href || /^(?:#|mailto:|tel:|javascript:)/i.test(href)) return "";

  try {
    return new URL(decodeEntities(href), sourceUrl).toString();
  } catch {
    return "";
  }
}

function htmlToLineItems(html, sourceUrl) {
  const linkMarker = "ULI_EVENT_URL";
  const withoutInactiveContent = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");
  const withLinkMarkers = withoutInactiveContent.replace(
    /<a\b([^>]*)>([\s\S]*?)<\/a>/gi,
    (match, attrs, label) => {
      const hrefMatch = attrs.match(
        /\bhref\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i
      );
      const href = hrefMatch?.[1] || hrefMatch?.[2] || hrefMatch?.[3] || "";
      const url = normalizeHref(href, sourceUrl);
      const text = stripTags(label);

      return `${text}${url ? ` [[${linkMarker}:${url}]]` : ""}`;
    }
  );

  return decodeEntities(
    withLinkMarkers
      .replace(
        /<\/?(?:article|aside|br|div|figcaption|h[1-6]|header|li|main|p|section|time|ul|ol)[^>]*>/gi,
        "\n"
      )
      .replace(/<[^>]+>/g, " ")
  )
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .map((line) => {
      const urlMatch = line.match(new RegExp(`\\[\\[${linkMarker}:([^\\]]+)\\]\\]`));
      const text = line
        .replace(new RegExp(`\\s*\\[\\[${linkMarker}:[^\\]]+\\]\\]\\s*`, "g"), " ")
        .replace(/\s+/g, " ")
        .trim();

      return {
        text,
        url: urlMatch?.[1] || "",
      };
    })
    .filter((line) => line.text);
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

function toIsoSecond(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  date.setMilliseconds(0);
  return date.toISOString();
}

function getTimeZoneOffsetMinutes(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value])
  );
  const asUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second)
  );

  return (asUtc - date.getTime()) / 60000;
}

function toTimeZoneIsoSecond(value, timeZone = "America/Los_Angeles") {
  if (!value) return "";
  const match = String(value).match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/
  );
  if (!match) return toIsoSecond(value);

  const [, year, month, day, hour, minute, second = "00"] = match;
  const localAsUtc = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second)
  );
  let utcTime = localAsUtc;

  for (let index = 0; index < 2; index += 1) {
    const offset = getTimeZoneOffsetMinutes(new Date(utcTime), timeZone);
    utcTime = localAsUtc - offset * 60 * 1000;
  }

  return new Date(utcTime).toISOString();
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
  const key = [source.key, show.url, show.starts_at, show.artist_name || show.title].join("|");
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
    artist_name: title,
    genre: null,
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

function parseMcMenaminsDateLine(line) {
  const dateInfo = parseDateLine(line);
  if (dateInfo) return dateInfo;

  const match = line.match(
    new RegExp(`^${weekdayPattern},?\\s+${monthPattern}\\.?\\s+(\\d{1,2})$`, "i")
  );
  if (!match) return null;

  const currentYear = new Date().getFullYear();
  let year = currentYear;
  const date = new Date(`${match[1]} ${match[2]}, ${year} 12:00:00`);

  if (date.getTime() < Date.now() - 1000 * 60 * 60 * 24 * 30) {
    year += 1;
  }

  return {
    dateLabel: `${match[1]} ${match[2]}, ${year}`,
    time: null,
  };
}

function parseMcMenaminsTimeLine(line) {
  if (!line || /all\s+(?:month|day)/i.test(line)) return null;

  const showMatch = line.match(
    /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s*show\b/i
  );
  if (showMatch) {
    return {
      hour: showMatch[1],
      minute: showMatch[2] || "00",
      meridiem: showMatch[3],
    };
  }

  return parseTimeLine(line);
}

function parseClockMinutes(hour, minute = "00", meridiem = "") {
  let parsedHour = Number(hour);
  const parsedMinute = Number(minute || "00");
  const normalizedMeridiem = meridiem.toLowerCase();

  if (normalizedMeridiem === "pm" && parsedHour < 12) parsedHour += 12;
  if (normalizedMeridiem === "am" && parsedHour === 12) parsedHour = 0;

  return parsedHour * 60 + parsedMinute;
}

function getTimeOffsetMinutes(timeLabel) {
  const match = timeLabel.match(
    /Doors:\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s*\/\s*Show:\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i
  );
  if (!match) return null;

  const doors = parseClockMinutes(match[1], match[2], match[3]);
  const show = parseClockMinutes(match[4], match[5], match[6]);
  const offset = show - doors;

  return offset < 0 ? offset + 24 * 60 : offset;
}

function cleanArtistName(title) {
  return title
    .replace(/^(?:sold out|cancelled|canceled|postponed|rescheduled):\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getFirstMatch(value, pattern) {
  const match = value.match(pattern);
  return match?.[1] || "";
}

function getDoPdxEventCards(html) {
  const cardStartPattern =
    /<div class="[^"]*\bds-listing\b[^"]*\bevent-card\b[^"]*"[\s\S]*?>/gi;
  const starts = [...html.matchAll(cardStartPattern)].map((match) => match.index);

  return starts.map((start, index) => {
    const nextStart = starts[index + 1] ?? html.indexOf("<div class=\"ds-paging\"", start);
    return html.slice(start, nextStart === -1 ? undefined : nextStart);
  });
}

function getDoPdxNextPageUrl(html, sourceUrl) {
  const href = getFirstMatch(
    html,
    /<a(?=[^>]+class=["'][^"']*\bds-next-page\b[^"']*["'])(?=[^>]+href=["']([^"']+)["'])[^>]*>/i
  );

  return normalizeHref(href, sourceUrl);
}

function normalizeDoPdxVenueEvent(source, card) {
  const title = cleanArtistName(
    stripTags(
      decodeEntities(
        getFirstMatch(
          card,
          /<span[^>]+class=["'][^"']*\bds-listing-event-title-text\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i
        )
      )
    )
  );
  const startsAt = toIsoSecond(
    getFirstMatch(card, /<meta[^>]+itemprop=["']startDate["'][^>]+content=["']([^"']+)["']/i) ||
      getFirstMatch(card, /<meta[^>]+itemprop=["']startDate["'][^>]+datetime=["']([^"']+)["']/i)
  );

  if (!title || !startsAt) return null;

  const href =
    getFirstMatch(card, /\bdata-permalink=["']([^"']+)["']/i) ||
    getFirstMatch(
      card,
      /<a[^>]+class=["'][^"']*\bds-listing-event-title\b[^"']*["'][^>]+href=["']([^"']+)["']/i
    );
  const venueName =
    stripTags(
      decodeEntities(
        getFirstMatch(
          card,
          /<div[^>]+class=["'][^"']*\bds-venue-name\b[^"']*["'][\s\S]*?<span[^>]+itemprop=["']name["'][^>]*>([\s\S]*?)<\/span>/i
        )
      )
    ) || source.name;
  const show = {
    source_id: "",
    venue_name: venueName,
    title,
    artist_name: title,
    genre: null,
    starts_at: startsAt,
    url: normalizeHref(href, source.url) || source.url,
    scraped_at: new Date().toISOString(),
  };

  return {
    ...show,
    source_id: getSourceId(source, show),
  };
}

async function getDoPdxVenueEvents(source, initialHtml) {
  const seen = new Set();
  const shows = [];
  let html = initialHtml;
  let pageUrl = source.url;

  for (let page = 0; page < 10 && html; page += 1) {
    for (const card of getDoPdxEventCards(html)) {
      const show = normalizeDoPdxVenueEvent(source, card);
      if (!show || seen.has(show.source_id)) continue;

      seen.add(show.source_id);
      shows.push(show);
    }

    const nextPageUrl = getDoPdxNextPageUrl(html, pageUrl);
    if (!nextPageUrl || seen.has(`page:${nextPageUrl}`)) break;

    seen.add(`page:${nextPageUrl}`);
    pageUrl = nextPageUrl;

    const response = await fetch(pageUrl, { headers: getRequestHeaders(pageUrl) });
    if (!response.ok) {
      throw new Error(`${source.name} DoPDX page returned ${response.status}`);
    }

    html = await response.text();
  }

  return shows;
}

function getNextFlightText(html) {
  const chunks = [];
  const matches = html.matchAll(/self\.__next_f\.push\(([\s\S]*?)\)<\/script>/g);

  for (const match of matches) {
    try {
      const payload = JSON.parse(match[1]);
      if (typeof payload?.[1] === "string") chunks.push(payload[1]);
    } catch {
      continue;
    }
  }

  return chunks.join("\n");
}

function getBalancedJsonArray(text, marker) {
  const markerIndex = text.indexOf(marker);
  if (markerIndex === -1) return "";

  const start = text.indexOf("[", markerIndex + marker.length);
  if (start === -1) return "";

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index += 1) {
    const character = text[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === "\"") {
        inString = false;
      }
      continue;
    }

    if (character === "\"") {
      inString = true;
      continue;
    }

    if (character === "[") depth += 1;
    if (character === "]") depth -= 1;

    if (depth === 0) return text.slice(start, index + 1);
  }

  return "";
}

function getBunkBarEmbeddedEvents(html) {
  const flightText = getNextFlightText(html);
  const eventsJson = getBalancedJsonArray(flightText, "\"events\":");
  if (!eventsJson) return [];

  try {
    return JSON.parse(eventsJson);
  } catch (error) {
    console.warn("Could not parse Bunk Bar embedded events", error.message);
    return [];
  }
}

function normalizeBunkBarEvent(source, event) {
  const title = cleanArtistName(stripTags(decodeEntities(event.name || "")));
  const startsAt = toIsoSecond(event.start_at);

  if (!title || !startsAt) return null;

  const show = {
    source_id: "",
    venue_name: event.location?.name || event.host?.name || source.name,
    title,
    artist_name: title,
    genre: null,
    starts_at: startsAt,
    url: normalizeHref(event.url, source.url) || source.url,
    scraped_at: new Date().toISOString(),
  };

  return {
    ...show,
    source_id: getSourceId(source, show),
  };
}

function getBunkBarEvents(source, html) {
  const seen = new Set();
  const shows = [];

  for (const event of getBunkBarEmbeddedEvents(html)) {
    const show = normalizeBunkBarEvent(source, event);
    if (!show || seen.has(show.source_id)) continue;

    seen.add(show.source_id);
    shows.push(show);
  }

  return shows;
}

function getDantesEventBlocks(html) {
  const list = getFirstMatch(
    html,
    /<div class=["']tw-plugin-upcoming-event-list["'][^>]*>([\s\S]*?)<\/div><!-- END \.tw-plugin-upcoming-event-list -->/i
  );
  const sectionStartPattern = /<div class=["']tw-section["']>/gi;
  const starts = [...list.matchAll(sectionStartPattern)].map((match) => match.index);

  return starts.map((start, index) => {
    const nextStart = starts[index + 1];
    return list.slice(start, nextStart);
  });
}

function getDantesNextPageUrl(html, sourceUrl) {
  const href = getFirstMatch(
    html,
    /<a(?=[^>]+class=["'][^"']*\bnext\b[^"']*\bpage-numbers\b[^"']*["'])(?=[^>]+href=["']([^"']+)["'])[^>]*>/i
  );

  return normalizeHref(href, sourceUrl);
}

function getDantesDateFromTitle(titleAttr) {
  const match = decodeEntities(titleAttr).match(/-\s*(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s*$/);
  if (!match) return "";

  const day = match[1].padStart(2, "0");
  const month = match[2].padStart(2, "0");
  const year = match[3].length === 2 ? `20${match[3]}` : match[3];

  return `${year}-${month}-${day}`;
}

function getDantesTimeLabel(block) {
  const showTime = getFirstMatch(
    block,
    /<span[^>]+class=["']tw-event-time["'][^>]*>\s*Show:\s*([\s\S]*?)<\/span>/i
  );
  if (showTime) return stripTags(decodeEntities(showTime));

  const doorTime = getFirstMatch(
    block,
    /<span[^>]+class=["']tw-event-door-time["'][^>]*>([\s\S]*?)<\/span>/i
  );
  if (doorTime) return stripTags(decodeEntities(doorTime));

  return "7:00 pm";
}

function toTwentyFourHourTime(timeLabel) {
  const time = parseTimeLine(timeLabel);
  if (!time) return "19:00";

  const minutes = parseClockMinutes(time.hour, time.minute, time.meridiem);
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(
    minutes % 60
  ).padStart(2, "0")}`;
}

function normalizeDantesEvent(source, block) {
  const titleAnchor = getFirstMatch(
    block,
    /<div[^>]+class=["']tw-name["'][\s\S]*?(<a[\s\S]*?<\/a>)/i
  );
  const title = cleanArtistName(stripTags(decodeEntities(titleAnchor)));
  const titleAttr =
    getFirstMatch(titleAnchor, /\btitle=["']([^"']+)["']/i) ||
    getFirstMatch(block, /\baria-label=["']([^"']+)["']/i);
  const eventDate = getDantesDateFromTitle(titleAttr);
  const startsAt = eventDate
    ? toPortlandIsoDate(eventDate, toTwentyFourHourTime(getDantesTimeLabel(block)))
    : "";

  if (!title || !startsAt) return null;

  const eventHref = getFirstMatch(titleAnchor, /\bhref=["']([^"']+)["']/i);
  const ticketHref = getFirstMatch(
    block,
    /<a(?=[^>]+class=["'][^"']*\btw-buy-tix-btn\b[^"']*["'])(?=[^>]+href=["']([^"']+)["'])[^>]*>/i
  );
  const show = {
    source_id: "",
    venue_name: source.name,
    title,
    artist_name: title,
    genre: null,
    starts_at: startsAt,
    url: normalizeHref(eventHref, source.url) || normalizeHref(ticketHref, source.url) || source.url,
    scraped_at: new Date().toISOString(),
  };

  return {
    ...show,
    source_id: getSourceId(source, show),
  };
}

async function getDantesEvents(source, initialHtml) {
  const seen = new Set();
  const shows = [];
  let html = initialHtml;
  let pageUrl = source.url;

  for (let page = 0; page < 10 && html; page += 1) {
    for (const block of getDantesEventBlocks(html)) {
      const show = normalizeDantesEvent(source, block);
      if (!show || seen.has(show.source_id)) continue;

      seen.add(show.source_id);
      shows.push(show);
    }

    const nextPageUrl = getDantesNextPageUrl(html, pageUrl);
    if (!nextPageUrl || seen.has(`page:${nextPageUrl}`)) break;

    seen.add(`page:${nextPageUrl}`);
    pageUrl = nextPageUrl;

    const response = await fetch(pageUrl, { headers: getRequestHeaders(pageUrl) });
    if (!response.ok) {
      throw new Error(`${source.name} page returned ${response.status}`);
    }

    html = await response.text();
  }

  return shows;
}

function cleanHawthorneHideawayTitleFromUrl(imageUrl) {
  const filename = decodeURIComponent(imageUrl)
    .split("/")
    .pop()
    ?.replace(/\?.*/, "")
    .replace(/\.[a-z0-9]+$/i, "") || "";
  const cleaned = filename
    .replace(/\+/g, " ")
    .replace(/\b(?:HH|poster|socials?|flyer|web|copy)\b/gi, " ")
    .replace(/\b\d+(?:\.\d+)?(?:st|nd|rd|th)?\b/gi, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned || /^may\b/i.test(cleaned) || /^[a-f0-9-]{12,}$/i.test(cleaned)) {
    return "Hawthorne Hideaway show";
  }

  return cleaned;
}

function getHawthorneHideawayPageItems(html, sourceUrl) {
  const matches = html.matchAll(
    /<h2[^>]*>([\s\S]*?)<\/h2>|<img[^>]+(?:data-image|src)=["']([^"']+)["'][^>]*>/gi
  );
  const items = [];

  for (const match of matches) {
    if (match[1]) {
      const text = stripTags(decodeEntities(match[1]));
      if (/^May\s+\d{1,2}$/i.test(text)) {
        items.push({ type: "date", value: text });
      }
      continue;
    }

    const imageUrl = normalizeHref(match[2], sourceUrl);
    if (
      imageUrl.includes("images.squarespace-cdn.com") &&
      !/logo|HIDEAWAY\+HOURS|karaoke\+room/i.test(imageUrl)
    ) {
      items.push({ type: "image", value: imageUrl });
    }
  }

  return items;
}

function getHawthorneHideawayPairs(source, html) {
  const items = getHawthorneHideawayPageItems(html, source.url);
  const pairs = [];
  let pendingDate = "";
  let pendingImage = "";

  for (const item of items) {
    if (item.type === "date") {
      if (pendingImage) {
        pairs.push({ dateLabel: item.value, imageUrl: pendingImage });
        pendingImage = "";
        pendingDate = "";
      } else {
        pendingDate = item.value;
      }
      continue;
    }

    if (pendingDate) {
      pairs.push({ dateLabel: pendingDate, imageUrl: item.value });
      pendingDate = "";
    } else {
      pendingImage = item.value;
    }
  }

  return pairs;
}

function normalizeHawthorneHideawayEvent(source, pair) {
  const dateInfo = parseDateLine(pair.dateLabel);
  const startsAt = dateInfo ? toPortlandIsoDate(
    `${new Date(`${dateInfo.dateLabel} 12:00:00`).getFullYear()}-${String(
      new Date(`${dateInfo.dateLabel} 12:00:00`).getMonth() + 1
    ).padStart(2, "0")}-${String(
      new Date(`${dateInfo.dateLabel} 12:00:00`).getDate()
    ).padStart(2, "0")}`,
    "20:00"
  ) : "";

  if (!startsAt || !pair.imageUrl) return null;

  const title = cleanHawthorneHideawayTitleFromUrl(pair.imageUrl);
  const show = {
    source_id: "",
    venue_name: source.name,
    title,
    artist_name: title,
    genre: null,
    starts_at: startsAt,
    url: pair.imageUrl,
    scraped_at: new Date().toISOString(),
  };

  return {
    ...show,
    source_id: getSourceId(source, show),
  };
}

function getHawthorneHideawayEvents(source, html) {
  const seen = new Set();
  const shows = [];

  for (const pair of getHawthorneHideawayPairs(source, html)) {
    const show = normalizeHawthorneHideawayEvent(source, pair);
    if (!show || seen.has(show.source_id)) continue;

    seen.add(show.source_id);
    shows.push(show);
  }

  return shows;
}

function getHawthorneTheatreEventCards(html) {
  const cardStartPattern =
    /<div\s+class\s*=\s*["'][^"']*\beventWrapper\b[^"']*\brhpSingleEvent\b[^"']*["'][^>]*>/gi;
  const starts = [...html.matchAll(cardStartPattern)].map((match) => match.index);
  const monthSeparators = [
    ...html.matchAll(
      /<span[^>]+class=["'][^"']*\brhp-events-list-separator-month\b[^"']*["'][^>]*>[\s\S]*?<span>([\s\S]*?)<\/span>/gi
    ),
  ].map((match) => ({
    index: match.index,
    label: stripTags(decodeEntities(match[1])),
  }));

  return starts.map((start, index) => {
    const nextStart = starts[index + 1];
    const monthYear = monthSeparators
      .filter((separator) => separator.index < start)
      .at(-1)?.label || "";

    return {
      html: html.slice(start, nextStart),
      monthYear,
    };
  });
}

function getHawthorneTheatreNextPageUrl(html, sourceUrl) {
  const href = getFirstMatch(
    html,
    /<link[^>]+rel=["']next["'][^>]+href=["']([^"']+)["'][^>]*>/i
  );

  return normalizeHref(href, sourceUrl);
}

function getHawthorneTheatreTitleLink(block) {
  const match = block.match(
    /<a\b(?=[^>]*\bid\s*=\s*["']eventTitle["'])([^>]*)>([\s\S]*?)<\/a>/i
  );

  if (!match) return { title: "", url: "" };

  const attrs = match[1];
  const title =
    cleanArtistName(stripTags(decodeEntities(match[2]))) ||
    cleanArtistName(decodeEntities(getFirstMatch(attrs, /\btitle=["']([^"']+)["']/i)));
  const href = getFirstMatch(attrs, /\bhref=["']([^"']+)["']/i);

  return { title, url: href };
}

function getHawthorneTheatreDateLabel(card) {
  const dateText = stripTags(
    decodeEntities(getFirstMatch(card.html, /<div[^>]+\bid\s*=\s*["']eventDate["'][^>]*>([\s\S]*?)<\/div>/i))
  );

  if (!dateText) return "";

  const yearMatch = card.monthYear.match(/\b(20\d{2})\b/);

  return yearMatch && !/\b20\d{2}\b/.test(dateText)
    ? `${dateText}, ${yearMatch[1]}`
    : dateText;
}

function normalizeHawthorneTheatreEvent(source, card) {
  const { html: block } = card;
  const titleLink = getHawthorneTheatreTitleLink(block);
  const dateInfo = parseDateLine(getHawthorneTheatreDateLabel(card));
  const timeInfo = parseTimeLine(
    stripTags(
      decodeEntities(
        getFirstMatch(
          block,
          /<span[^>]+class\s*=\s*["'][^"']*\brhp-event__time-text--list\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i
        )
      )
    )
  );
  const startsAt = dateInfo ? toShowIso(dateInfo, timeInfo) : "";

  if (!titleLink.title || !startsAt) return null;

  const venueName =
    stripTags(
      decodeEntities(
        getFirstMatch(
          block,
          /<a[^>]+class\s*=\s*["'][^"']*\bvenueLink\b[^"']*["'][^>]*>([\s\S]*?)<\/a>/i
        )
      )
    ) || source.name;
  const show = {
    source_id: "",
    venue_name: venueName,
    title: titleLink.title,
    artist_name: titleLink.title,
    genre: null,
    starts_at: startsAt,
    url: normalizeHref(titleLink.url, source.url) || source.url,
    scraped_at: new Date().toISOString(),
  };

  return {
    ...show,
    source_id: getSourceId(source, show),
  };
}

async function getHawthorneTheatreEvents(source, initialHtml) {
  const seen = new Set();
  const shows = [];
  let html = initialHtml;
  let pageUrl = source.url;

  for (let page = 0; page < 10 && html; page += 1) {
    let addedOnPage = 0;

    for (const card of getHawthorneTheatreEventCards(html)) {
      const show = normalizeHawthorneTheatreEvent(source, card);
      if (!show || seen.has(show.source_id)) continue;

      seen.add(show.source_id);
      shows.push(show);
      addedOnPage += 1;
    }

    const nextPageUrl = getHawthorneTheatreNextPageUrl(html, pageUrl);
    if (!nextPageUrl || seen.has(`page:${nextPageUrl}`) || addedOnPage === 0) break;

    seen.add(`page:${nextPageUrl}`);
    pageUrl = nextPageUrl;

    const response = await fetch(pageUrl, { headers: getRequestHeaders(pageUrl) });
    if (!response.ok) {
      throw new Error(`${source.name} page returned ${response.status}`);
    }

    html = await response.text();
  }

  return shows;
}

function getMcMenaminsCardEvents(source, html) {
  const cards = html.match(
    /<div class="[^"]*\btm-panel-card\b[^"]*\bevent\b[^"]*"[\s\S]*?<\/li>/gi
  );
  const seen = new Set();
  const shows = [];

  for (const card of cards || []) {
    const teaser = getFirstMatch(
      card,
      /<div class="tm-panel-titlebg">([\s\S]*?)<\/div>\s*<a/i
    );
    const title = stripTags(decodeEntities(getFirstMatch(teaser, /<h3[^>]*>([\s\S]*?)<\/h3>/i)));
    if (!title) continue;

    const content = getFirstMatch(
      card,
      /<div class="tm-card-content[^"]*">([\s\S]*?)<\/div>\s*<\/li>/i
    );
    const dateLabel = stripTags(
      decodeEntities(getFirstMatch(content, /<h3 class="uk-panel-title">([\s\S]*?)<\/h3>/i))
    );
    const timeLabel = stripTags(
      decodeEntities(getFirstMatch(content, /<p class="uk-panel-time[^"]*">([\s\S]*?)<\/p>/i))
    );
    const dateInfo = parseMcMenaminsDateLine(dateLabel);
    const timeInfo = parseMcMenaminsTimeLine(timeLabel);

    if (!dateInfo || !timeInfo) continue;

    const startsAt = toShowIso(dateInfo, timeInfo);
    if (!startsAt) continue;

    const href = getFirstMatch(card, /<a href="([^"]*venueevent\.aspx[^"]*)"/i);
    const show = {
      source_id: "",
      venue_name: source.name,
      title,
      artist_name: title,
      genre: null,
      starts_at: startsAt,
      url: normalizeHref(href, source.url) || source.url,
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

function getAladdinTheaterEvents(source, html) {
  const eventsFeed = getFirstMatch(
    html,
    /<div id="feed-primary"[\s\S]*?<\/script>([\s\S]*?)<style>/i
  );
  const cards = eventsFeed.match(
    /<div class="event event--list-style[\s\S]*?(?=\n    <div class="event event--list-style|\n    <\/div>)/gi
  );
  const seen = new Set();
  const shows = [];

  for (const card of cards || []) {
    const venueName = stripTags(
      decodeEntities(getFirstMatch(card, /<div class="event-venue">([\s\S]*?)<\/div>/i))
    );
    if (venueName !== source.name) continue;

    const title = cleanArtistName(
      stripTags(decodeEntities(getFirstMatch(card, /<h3 class="event-title"[^>]*>([\s\S]*?)<\/h3>/i)))
    );
    if (!title) continue;

    const doorsAt = getFirstMatch(card, /data-event-doors="([^"]+)"/i);
    const timeLabel = stripTags(
      decodeEntities(getFirstMatch(card, /<span class="event-doors-showtime"[^>]*>([\s\S]*?)<\/span>/i))
    );
    const timeOffset = getTimeOffsetMinutes(timeLabel);
    const doorsDate = new Date(doorsAt);

    if (!doorsAt || Number.isNaN(doorsDate.getTime()) || timeOffset === null) continue;

    const startsAt = new Date(doorsDate.getTime() + timeOffset * 60 * 1000).toISOString();
    const href = getFirstMatch(card, /<a href="([^"]+)"[^>]*\bevent-action\b/i);
    const show = {
      source_id: "",
      venue_name: source.name,
      title,
      artist_name: title,
      genre: null,
      starts_at: startsAt,
      url: normalizeHref(href, source.url) || source.url,
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

function toPortlandIsoDate(dateLabel, timeLabel = "19:00") {
  const dateMatch = String(dateLabel).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeMatch = String(timeLabel || "00:00").match(/^(\d{1,2}):(\d{2})/);
  if (!dateMatch || !timeMatch) return "";

  const [, year, month, day] = dateMatch;
  const [, hour, minute] = timeMatch;
  const utcGuess = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute))
  );
  const zonedFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    zonedFormatter.formatToParts(utcGuess).map((part) => [part.type, part.value])
  );
  const localAsUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  const offset = localAsUtc - utcGuess.getTime();
  const zonedDate = new Date(utcGuess.getTime() - offset);

  return Number.isNaN(zonedDate.getTime()) ? "" : zonedDate.toISOString();
}

function getAlbertaAbbeyWidgetId(html) {
  return getFirstMatch(html, /\belfsight-app-([a-f0-9-]{36})\b/i);
}

function getEventTypeNameMap(eventTypes = []) {
  return new Map(
    eventTypes
      .filter((eventType) => eventType?.id && eventType?.name)
      .map((eventType) => [eventType.id, stripTags(decodeEntities(eventType.name))])
  );
}

function getLocationNameMap(locations = []) {
  return new Map(
    locations
      .filter((location) => location?.id && location?.name)
      .map((location) => [location.id, stripTags(decodeEntities(location.name))])
  );
}

function getAlbertaAbbeyGenre(event, eventTypeNameMap) {
  const genreNames = new Set([
    "Blues",
    "Folk",
    "Funk",
    "Hip-Hop",
    "Indie",
    "Jazz",
    "Latin",
    "Pop",
    "R & B",
    "Rap",
    "Rock",
    "Soul",
    "World Music",
  ]);
  const names = (event.eventType || [])
    .map((eventTypeId) => eventTypeNameMap.get(eventTypeId))
    .filter(Boolean);
  const genre = names.find((name) => genreNames.has(name));

  if (genre) return genre;

  return (event.tags || [])
    .map((tag) => stripTags(decodeEntities(tag?.tagName || "")))
    .find((tagName) => genreNames.has(tagName)) || null;
}

function getAlbertaAbbeyEventUrl(event, source) {
  const rawUrl = event.buttonLink?.value || event.buttonLink?.rawValue || "";
  return normalizeHref(rawUrl, source.url) || source.url;
}

function normalizeAlbertaAbbeyEvent(source, event, eventTypeNameMap, locationNameMap) {
  const title = cleanArtistName(stripTags(decodeEntities(event.name || "")));
  const startsAt = toPortlandIsoDate(event.start?.date, event.start?.time);

  if (!title || !startsAt) return null;

  const locationName = locationNameMap.get(event.location?.[0]) || source.name;
  const show = {
    source_id: "",
    venue_name: locationName,
    title,
    artist_name: title,
    genre: getAlbertaAbbeyGenre(event, eventTypeNameMap),
    starts_at: startsAt,
    url: getAlbertaAbbeyEventUrl(event, source),
    scraped_at: new Date().toISOString(),
  };

  return {
    ...show,
    source_id: getSourceId(source, show),
  };
}

async function getAlbertaAbbeyEvents(source, html) {
  const widgetId = getAlbertaAbbeyWidgetId(html);
  if (!widgetId) return [];

  const bootUrl = new URL("https://core.service.elfsight.com/p/boot/");
  bootUrl.searchParams.set("w", widgetId);
  bootUrl.searchParams.set("page", source.url);

  const response = await fetch(bootUrl, { headers: requestHeaders });
  if (!response.ok) {
    throw new Error(`${source.name} Elfsight calendar returned ${response.status}`);
  }

  const payload = await response.json();
  const settings = payload?.data?.widgets?.[widgetId]?.data?.settings;
  const eventTypeNameMap = getEventTypeNameMap(settings?.eventTypes || []);
  const locationNameMap = getLocationNameMap(settings?.locations || []);
  const seen = new Set();
  const shows = [];

  for (const event of settings?.events || []) {
    const show = normalizeAlbertaAbbeyEvent(
      source,
      event,
      eventTypeNameMap,
      locationNameMap
    );
    if (!show || seen.has(show.source_id)) continue;

    seen.add(show.source_id);
    shows.push(show);
  }

  return shows;
}

function getWordPressRenderedContent(payload) {
  return payload?.content?.rendered || "";
}

function parseRockhouseDateLabel(dateLabel) {
  const dateInfo = parseDateLine(
    stripTags(decodeEntities(dateLabel)).replace(/\s+/g, " ").trim()
  );
  if (!dateInfo) return "";

  const date = new Date(`${dateInfo.dateLabel} 12:00:00`);
  if (Number.isNaN(date.getTime())) return "";

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function parseRockhouseShowTime(timeLabel) {
  const showMatch = stripTags(decodeEntities(timeLabel)).match(
    /\bShow:\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i
  );
  if (showMatch) {
    const minutes = parseClockMinutes(showMatch[1], showMatch[2], showMatch[3]);
    return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(
      minutes % 60
    ).padStart(2, "0")}`;
  }

  const time = parseTimeLine(timeLabel);
  if (!time) return "19:00";

  const minutes = parseClockMinutes(time.hour, time.minute, time.meridiem);
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(
    minutes % 60
  ).padStart(2, "0")}`;
}

function getRockhouseEventBlocks(html) {
  return html
    .split(/<!-- Event List Wrapper -->/i)
    .filter((block) => /\beventWrapper\b[\s\S]*?\brhpSingleEvent\b/i.test(block));
}

function getAlbertaRoseTheatreEventsFromHtml(source, html) {
  const seen = new Set();
  const shows = [];

  for (const block of getRockhouseEventBlocks(html)) {
    const title = cleanArtistName(
      stripTags(decodeEntities(getFirstMatch(block, /<h2[^>]*>([\s\S]*?)<\/h2>/i)))
    );
    const eventHref =
      getFirstMatch(block, /<a[^>]+id\s*=\s*["']?eventTitle["']?[^>]+href=["']([^"']+)["']/i) ||
      getFirstMatch(block, /<a[^>]+class=["'][^"']*\burl\b[^"']*["'][^>]+href=["']([^"']+)["']/i);
    const dateLabel = getFirstMatch(
      block,
      /<div[^>]+class\s*=\s*["'][^"']*\bsingleEventDate\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i
    );
    const timeLabel = getFirstMatch(
      block,
      /<span[^>]+class\s*=\s*["'][^"']*\brhp-event__time-text--list\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i
    );
    const eventDate = parseRockhouseDateLabel(dateLabel);
    const showTime = parseRockhouseShowTime(timeLabel);
    const startsAt = eventDate ? toPortlandIsoDate(eventDate, showTime) : "";

    if (!title || !startsAt) continue;

    const ticketHref = getFirstMatch(
      block,
      /<span[^>]+class=["'][^"']*\brhp-event-cta\b[^"']*["'][\s\S]*?<a[^>]+href=["']([^"']+)["']/i
    );
    const show = {
      source_id: "",
      venue_name: source.name,
      title,
      artist_name: title,
      genre: null,
      starts_at: startsAt,
      url: normalizeHref(eventHref, source.url) || normalizeHref(ticketHref, source.url) || source.url,
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

async function getAlbertaRoseTheatreEvents(source) {
  const response = await fetch(
    "https://albertarosetheatre.com/wp-json/wp/v2/pages/25",
    { headers: { ...requestHeaders, Accept: "application/json" } }
  );

  if (!response.ok) {
    throw new Error(`${source.name} WordPress events page returned ${response.status}`);
  }

  const payload = await response.json();
  return getAlbertaRoseTheatreEventsFromHtml(
    source,
    getWordPressRenderedContent(payload)
  );
}

function getSquarespaceJsonUrl(sourceUrl) {
  const url = new URL(sourceUrl);
  url.searchParams.set("format", "json");
  return url;
}

function getSquarespaceNextJsonUrl(nextPageUrl, sourceUrl) {
  if (!nextPageUrl) return null;

  const url = new URL(nextPageUrl, sourceUrl);
  url.searchParams.set("format", "json");
  return url;
}

function normalizeAlbertaStreetPubEvent(source, event) {
  const title = cleanArtistName(stripTags(decodeEntities(event.title || "")));
  const startsAt = toIsoSecond(event.startDate || event.structuredContent?.startDate);

  if (!title || !startsAt) return null;

  const show = {
    source_id: "",
    venue_name: event.location?.addressTitle || source.name,
    title,
    artist_name: title,
    genre: null,
    starts_at: startsAt,
    url: normalizeHref(event.fullUrl, source.url) || source.url,
    scraped_at: new Date().toISOString(),
  };

  return {
    ...show,
    source_id: getSourceId(source, show),
  };
}

async function getAlbertaStreetPubEvents(source) {
  const seen = new Set();
  const shows = [];
  let pageUrl = getSquarespaceJsonUrl(source.url);

  for (let page = 0; page < 10 && pageUrl; page += 1) {
    const response = await fetch(pageUrl, {
      headers: { ...requestHeaders, Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`${source.name} Squarespace events returned ${response.status}`);
    }

    const payload = await response.json();

    for (const event of payload.upcoming || []) {
      const show = normalizeAlbertaStreetPubEvent(source, event);
      if (!show || seen.has(show.source_id)) continue;

      seen.add(show.source_id);
      shows.push(show);
    }

    pageUrl = getSquarespaceNextJsonUrl(payload.pagination?.nextPageUrl, source.url);
  }

  return shows;
}

function normalizeHaymakerEvent(source, event) {
  const title = cleanArtistName(stripTags(decodeEntities(event.title || "")));
  const startsAt = toIsoSecond(event.startDate || event.structuredContent?.startDate);

  if (!title || !startsAt) return null;

  const show = {
    source_id: "",
    venue_name: source.name,
    title,
    artist_name: title,
    genre: null,
    starts_at: startsAt,
    url: normalizeHref(event.fullUrl, source.url) || source.url,
    scraped_at: new Date().toISOString(),
  };

  return {
    ...show,
    source_id: getSourceId(source, show),
  };
}

async function getHaymakerEvents(source) {
  const seen = new Set();
  const shows = [];
  let pageUrl = getSquarespaceJsonUrl(source.url);

  for (let page = 0; page < 5 && pageUrl; page += 1) {
    const response = await fetch(pageUrl, {
      headers: { ...requestHeaders, Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`${source.name} Squarespace events returned ${response.status}`);
    }

    const payload = await response.json();
    const upcoming = payload.upcoming || [];

    for (const event of upcoming) {
      const show = normalizeHaymakerEvent(source, event);
      if (!show || seen.has(show.source_id)) continue;

      seen.add(show.source_id);
      shows.push(show);
    }

    if (upcoming.length === 0) break;
    pageUrl = getSquarespaceNextJsonUrl(payload.pagination?.nextPageUrl, source.url);
  }

  return shows;
}

function getAftonApiKey(html) {
  return getFirstMatch(html, /\bapiKey\s*:\s*["']([^"']+)["']/i);
}

function normalizeAftonEvent(source, event) {
  const title = cleanArtistName(stripTags(decodeEntities(event.event_name || "")));
  const startsAt = toTimeZoneIsoSecond(event.start_time);

  if (!title || !startsAt) return null;

  const show = {
    source_id: "",
    venue_name: stripTags(decodeEntities(event.venue_name || "")) || source.name,
    title,
    artist_name: title,
    genre: null,
    starts_at: startsAt,
    url: normalizeHref(event.buy_ticket_url, source.url) || source.url,
    scraped_at: new Date().toISOString(),
  };

  return {
    ...show,
    source_id: getSourceId(source, show),
  };
}

async function getAftonEvents(source, html) {
  const apiKey = source.apiKey || getAftonApiKey(html);
  if (!apiKey) {
    throw new Error(`${source.name} Afton widget did not expose an API key`);
  }

  const apiUrl = new URL("https://aftontickets.com/api/get-events");
  apiUrl.searchParams.set("key", apiKey);

  const response = await fetch(apiUrl, {
    headers: { ...requestHeaders, Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`${source.name} Afton events returned ${response.status}`);
  }

  const payload = await response.json();
  const seen = new Set();
  const shows = [];

  for (const event of payload.data || []) {
    const show = normalizeAftonEvent(source, event);
    if (!show || seen.has(show.source_id)) continue;

    seen.add(show.source_id);
    shows.push(show);
  }

  return shows;
}

function getTreeTixEventCards(html) {
  return [...html.matchAll(
    /<a\b(?=[^>]*\bclass=["'][^"']*\bappend-refer\b[^"']*["'])(?=[^>]*\bhref=["']([^"']*\/event\?[^"']*)["'])[^>]*>([\s\S]*?)<\/a>/gi
  )].map((match) => ({
    url: match[1],
    html: match[2],
  }));
}

function htmlToCommaText(value = "") {
  return stripTags(
    decodeEntities(
      String(value)
        .replace(/<br\s*\/?>/gi, ", ")
        .replace(/<\/(?:p|div|span)>/gi, ", ")
    )
  )
    .replace(/\s*,\s*/g, ", ")
    .replace(/(?:,\s*){2,}/g, ", ")
    .replace(/^,\s*|\s*,$/g, "")
    .trim();
}

function getTreeTixTitle(html) {
  const header =
    getFirstMatch(
      html,
      /<div[^>]+class=["'][^"']*\bevent-header\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i
    ) ||
    getFirstMatch(
      html,
      /<p[^>]+class=["'][^"']*\bevent-header\b[^"']*["'][^>]*>([\s\S]*?)<\/p>/i
    );

  return cleanArtistName(htmlToCommaText(header));
}

function getTreeTixDateLabel(html) {
  return stripTags(
    decodeEntities(
      getFirstMatch(
        html,
        /<span[^>]+class=["'][^"']*\bevent-date\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i
      ) ||
        getFirstMatch(
          html,
          /<p[^>]+class=["'][^"']*\bevent-date\b[^"']*["'][^>]*>([\s\S]*?)<\/p>/i
        )
    )
  );
}

function getTreeTixShowTime(html) {
  const text = stripTags(decodeEntities(html));
  const match = text.match(/\bShow\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = match[2] || "00";
  const meridiem = match[3] || (hour >= 1 && hour <= 11 ? "pm" : "");

  return {
    hour: String(hour),
    minute,
    meridiem,
  };
}

function getTreeTixStartsAt(dateLabel, timeInfo) {
  const match = dateLabel.match(
    new RegExp(`^(?:${weekdayPattern},?\\s+)?${monthPattern}\\.?\\s+(\\d{1,2}),?\\s+(\\d{4})$`, "i")
  );
  if (!match) return "";

  let hour = Number(timeInfo?.hour || 7);
  const minute = String(timeInfo?.minute || "00").padStart(2, "0");
  const meridiem = (timeInfo?.meridiem || "pm").toLowerCase();

  if (meridiem === "pm" && hour < 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;

  const month = String(new Date(`${match[1]} 1, 2000`).getMonth() + 1).padStart(2, "0");
  const day = String(Number(match[2])).padStart(2, "0");
  const value = `${match[3]}-${month}-${day} ${String(hour).padStart(2, "0")}:${minute}:00`;

  return toTimeZoneIsoSecond(value);
}

function getTreeTixGenre(html) {
  const seen = new Set();
  const genres = [];
  const matches = html.matchAll(
    /<p[^>]+class=["'][^"']*\btext-center\b[^"']*\btext-balance\b[^"']*["'][^>]*>([\s\S]*?)<\/p>/gi
  );

  for (const match of matches) {
    const lines = decodeEntities(match[1])
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .split(/\n+/)
      .map((line) => line.replace(/\s+/g, " ").trim())
      .filter(Boolean);
    const genreLine = lines.slice(1).join(", ");

    for (const genre of genreLine.split(",")) {
      const cleaned = genre.replace(/\s+/g, " ").trim();
      const key = cleaned.toLowerCase();
      if (
        !cleaned ||
        seen.has(key) ||
        /^https?:\/\//i.test(cleaned) ||
        /^(portland|oregon|usa)$/i.test(cleaned)
      ) {
        continue;
      }

      seen.add(key);
      genres.push(cleaned);
    }
  }

  return genres.slice(0, 12).join(", ") || null;
}

async function normalizeTreeTixEvent(source, card) {
  const url = normalizeHref(card.url, source.url);
  const fallbackTitle = getTreeTixTitle(card.html);
  const fallbackDate = getTreeTixDateLabel(card.html);
  let detailHtml = "";

  if (url) {
    const response = await fetch(url, { headers: getRequestHeaders(url) });
    if (response.ok) {
      detailHtml = await response.text();
    }
  }

  const title = getTreeTixTitle(detailHtml) || fallbackTitle;
  const dateLabel = getTreeTixDateLabel(detailHtml) || fallbackDate;
  const startsAt = getTreeTixStartsAt(dateLabel, getTreeTixShowTime(detailHtml));

  if (!title || !startsAt) return null;

  const show = {
    source_id: "",
    venue_name: source.name,
    title,
    artist_name: title,
    genre: getTreeTixGenre(detailHtml),
    starts_at: startsAt,
    url: url || source.url,
    scraped_at: new Date().toISOString(),
  };

  return {
    ...show,
    source_id: getSourceId(source, show),
  };
}

async function getTreeTixEvents(source, html) {
  const seen = new Set();
  const shows = [];

  for (const card of getTreeTixEventCards(html)) {
    const show = await normalizeTreeTixEvent(source, card);
    if (!show || seen.has(show.source_id)) continue;

    seen.add(show.source_id);
    shows.push(show);
  }

  return shows;
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

function findNearbyTitleItem(lineItems, index, source) {
  for (let offset = 1; offset <= 5; offset += 1) {
    const previous = lineItems[index - offset];
    if (isTitleCandidate(previous?.text, source)) return previous;
  }

  for (let offset = 1; offset <= 8; offset += 1) {
    const next = lineItems[index + offset];
    if (isTitleCandidate(next?.text, source)) return next;
  }

  return null;
}

function findNearbyTime(lineItems, index) {
  for (let offset = 1; offset <= 5; offset += 1) {
    const time = parseTimeLine(lineItems[index + offset]?.text || "");
    if (time) return time;
  }

  return null;
}

function findNearbyLink(lineItems, index) {
  const offsets = [0, -1, 1, -2, 2, -3, 3, -4, 4, -5, 5, 6, 7, 8];

  for (const offset of offsets) {
    const url = lineItems[index + offset]?.url;
    if (url) return url;
  }

  return "";
}

function getLineEventUrl(source, titleItem, lineItems, index) {
  return titleItem?.url || findNearbyLink(lineItems, index) || source.url;
}

function getHtmlLineEvents(source, html) {
  const lineItems = htmlToLineItems(html, source.url);
  const seen = new Set();
  const shows = [];

  for (let index = 0; index < lineItems.length; index += 1) {
    const dateInfo = parseDateLine(lineItems[index].text);
    if (!dateInfo) continue;

    const titleItem = findNearbyTitleItem(lineItems, index, source);
    if (!titleItem) continue;

    const startsAt = toShowIso(dateInfo, findNearbyTime(lineItems, index));
    if (!startsAt) continue;

    const show = {
      source_id: "",
      venue_name: source.name,
      title: titleItem.text,
      artist_name: titleItem.text,
      genre: null,
      starts_at: startsAt,
      url: getLineEventUrl(source, titleItem, lineItems, index),
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
  const response = await fetch(source.url, { headers: getRequestHeaders(source.url) });

  if (!response.ok) {
    throw new Error(`${source.name} returned ${response.status}`);
  }

  const html = await response.text();
  let shows = getJsonLdEvents(html)
    .map((event) => normalizeEvent(source, event))
    .filter(Boolean);

  if (source.parser === "mcmenamins-venue") {
    shows = getMcMenaminsCardEvents(source, html);
    console.log(`${source.name}: ${shows.length} McMenamins card shows`);
    return shows;
  }

  if (source.parser === "aladdin-theater") {
    shows = getAladdinTheaterEvents(source, html);
    console.log(`${source.name}: ${shows.length} Aladdin Theater shows`);
    return shows;
  }

  if (source.parser === "alberta-abbey") {
    shows = await getAlbertaAbbeyEvents(source, html);
    console.log(`${source.name}: ${shows.length} Alberta Abbey calendar shows`);
    return shows;
  }

  if (source.parser === "alberta-rose-theatre") {
    shows = await getAlbertaRoseTheatreEvents(source);
    console.log(`${source.name}: ${shows.length} Alberta Rose Theatre shows`);
    return shows;
  }

  if (source.parser === "alberta-street-pub") {
    shows = await getAlbertaStreetPubEvents(source);
    console.log(`${source.name}: ${shows.length} Alberta Street Pub shows`);
    return shows;
  }

  if (source.parser === "haymaker") {
    shows = await getHaymakerEvents(source);
    console.log(`${source.name}: ${shows.length} Haymaker shows`);
    return shows;
  }

  if (source.parser === "dopdx-venue") {
    shows = await getDoPdxVenueEvents(source, html);
    console.log(`${source.name}: ${shows.length} DoPDX venue shows`);
    return shows;
  }

  if (source.parser === "bunk-bar") {
    shows = getBunkBarEvents(source, html);
    console.log(`${source.name}: ${shows.length} Bunk Bar shows`);
    return shows;
  }

  if (source.parser === "dantes-live") {
    shows = await getDantesEvents(source, html);
    console.log(`${source.name}: ${shows.length} Dante's shows`);
    return shows;
  }

  if (source.parser === "hawthorne-hideaway") {
    shows = getHawthorneHideawayEvents(source, html);
    console.log(`${source.name}: ${shows.length} Hawthorne Hideaway shows`);
    return shows;
  }

  if (source.parser === "hawthorne-theatre") {
    shows = await getHawthorneTheatreEvents(source, html);
    console.log(`${source.name}: ${shows.length} Hawthorne Theatre shows`);
    return shows;
  }

  if (source.parser === "afton-events") {
    shows = await getAftonEvents(source, html);
    console.log(`${source.name}: ${shows.length} Afton shows`);
    return shows;
  }

  if (source.parser === "treetix-events") {
    shows = await getTreeTixEvents(source, html);
    console.log(`${source.name}: ${shows.length} TreeTix shows`);
    return shows;
  }

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
  const sourceKey = process.env.SHOW_SOURCE_KEY || "";
  const selectedSources = sourceKey
    ? sources.filter((source) => source.key === sourceKey)
    : sources;

  if (sourceKey && selectedSources.length === 0) {
    throw new Error(`No show source found for SHOW_SOURCE_KEY=${sourceKey}`);
  }

  const results = await Promise.allSettled(selectedSources.map(scrapeSource));
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
