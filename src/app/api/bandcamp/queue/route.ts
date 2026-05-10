import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

const urlsFilePath = path.join(process.cwd(), "src/data/bandcamp-urls.json");
const urlsFileRepoPath = "src/data/bandcamp-urls.json";
const defaultRepository = "dcrawsh/upperleftindie";
const defaultBranch = "main";

type QueuePayload = {
  bandcampUrl?: unknown;
  artistName?: unknown;
};

type UrlsFile = {
  urls: string[];
  sha?: string;
};

class BandcampQueueError extends Error {
  constructor(
    message: string,
    readonly status = 500
  ) {
    super(message);
  }
}

function normalizeBandcampArtistUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    const hostname = url.hostname.replace(/^www\./, "").toLowerCase();

    if (!hostname.endsWith(".bandcamp.com") || hostname === "bandcamp.com") {
      return "";
    }

    return `https://${hostname}/`;
  } catch {
    return "";
  }
}

function uniqueUrls(urls: string[]) {
  const seen = new Set<string>();
  return urls.filter((url) => {
    const normalized = normalizeBandcampArtistUrl(url);
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

async function readLocalUrlsFile(): Promise<UrlsFile> {
  const raw = await readFile(urlsFilePath, "utf8");
  const urls = JSON.parse(raw);

  if (!Array.isArray(urls)) {
    throw new Error("Bandcamp URLs file must be a JSON array");
  }

  return { urls: urls.map(String) };
}

async function writeLocalUrlsFile(urls: string[]) {
  await writeFile(urlsFilePath, `${JSON.stringify(urls, null, 2)}\n`, "utf8");
}

async function readGithubUrlsFile({
  repository,
  branch,
  token,
}: {
  repository: string;
  branch: string;
  token: string;
}): Promise<UrlsFile> {
  const response = await fetch(
    `https://api.github.com/repos/${repository}/contents/${urlsFileRepoPath}?ref=${branch}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`GitHub file lookup failed with ${response.status}`);
  }

  const file = (await response.json()) as { content?: string; sha?: string };
  const content = Buffer.from(file.content ?? "", "base64").toString("utf8");
  const urls = JSON.parse(content);

  if (!Array.isArray(urls)) {
    throw new Error("Bandcamp URLs file must be a JSON array");
  }

  return { urls: urls.map(String), sha: file.sha };
}

async function writeGithubUrlsFile({
  repository,
  branch,
  token,
  urls,
  sha,
  artistName,
}: {
  repository: string;
  branch: string;
  token: string;
  urls: string[];
  sha: string;
  artistName: string;
}) {
  const response = await fetch(
    `https://api.github.com/repos/${repository}/contents/${urlsFileRepoPath}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        branch,
        sha,
        message: `Add Bandcamp artist${artistName ? ` for ${artistName}` : ""}`,
        content: Buffer.from(`${JSON.stringify(urls, null, 2)}\n`).toString(
          "base64"
        ),
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`GitHub file update failed with ${response.status}`);
  }
}

async function appendUrl(url: string, artistName: string) {
  const token =
    process.env.BANDCAMP_URLS_GITHUB_TOKEN ?? process.env.GITHUB_TOKEN ?? "";
  const repository =
    process.env.BANDCAMP_URLS_GITHUB_REPOSITORY ??
    process.env.GITHUB_REPOSITORY ??
    defaultRepository;
  const branch = process.env.BANDCAMP_URLS_GITHUB_BRANCH ?? defaultBranch;
  const storage = token ? "github" : "local";

  if (!token && process.env.NODE_ENV === "production") {
    throw new BandcampQueueError(
      "Bandcamp queue is missing BANDCAMP_URLS_GITHUB_TOKEN",
      500
    );
  }

  const file = token
    ? await readGithubUrlsFile({ repository, branch, token })
    : await readLocalUrlsFile();
  const urls = uniqueUrls([...file.urls.map(normalizeBandcampArtistUrl), url]);
  const added = !uniqueUrls(file.urls.map(normalizeBandcampArtistUrl)).includes(
    url
  );

  if (added) {
    if (token) {
      if (!file.sha) {
        throw new Error("GitHub file update is missing the current file SHA");
      }

      await writeGithubUrlsFile({
        repository,
        branch,
        token,
        urls,
        sha: file.sha,
        artistName,
      });
    } else {
      await writeLocalUrlsFile(urls);
    }
  }

  return { added, storage };
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as QueuePayload;
    const bandcampUrl =
      typeof payload.bandcampUrl === "string" ? payload.bandcampUrl : "";
    const artistName =
      typeof payload.artistName === "string" ? payload.artistName.trim() : "";
    const normalizedUrl = normalizeBandcampArtistUrl(bandcampUrl);

    if (!normalizedUrl) {
      return Response.json(
        { error: "A valid Bandcamp artist, album, or track URL is required" },
        { status: 400 }
      );
    }

    const result = await appendUrl(normalizedUrl, artistName);

    return Response.json({
      success: true,
      bandcampUrl: normalizedUrl,
      ...result,
    });
  } catch (error) {
    console.error("bandcamp queue error", error);

    if (error instanceof BandcampQueueError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    return Response.json(
      { error: "Bandcamp artist could not be queued" },
      { status: 500 }
    );
  }
}
