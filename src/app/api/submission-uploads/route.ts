import { NextRequest } from "next/server";
import {
  createSubmissionAudioUpload,
  SubmissionAudioError,
} from "@/lib/submission-audio";

export const runtime = "nodejs";

function clientAddress(req: NextRequest) {
  if (process.env.VERCEL !== "1") {
    return null;
  }

  const address =
    req.headers.get("x-vercel-forwarded-for") ??
    req.headers.get("x-forwarded-for")?.split(",")[0];
  const normalized = address?.trim() ?? "";

  return normalized && normalized.length <= 64 ? normalized : null;
}

export async function POST(req: NextRequest) {
  try {
    const requestOrigin = req.headers.get("origin");
    const fetchSite = req.headers.get("sec-fetch-site");

    if (
      fetchSite === "cross-site" ||
      (requestOrigin && new URL(requestOrigin).host !== req.nextUrl.host)
    ) {
      return Response.json(
        { error: "MP3 uploads must start from the submission form." },
        { status: 403 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as {
      fileName?: unknown;
      size?: unknown;
      mimeType?: unknown;
    };
    const upload = await createSubmissionAudioUpload(body, clientAddress(req));

    return Response.json(upload);
  } catch (error) {
    console.error("submission audio upload preparation error", error);

    if (error instanceof SubmissionAudioError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    return Response.json(
      { error: "The MP3 upload could not be prepared." },
      { status: 500 }
    );
  }
}
