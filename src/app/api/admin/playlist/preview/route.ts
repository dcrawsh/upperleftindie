import { NextRequest } from "next/server";
import {
  AdminAuthError,
  assertAdminRequest,
} from "../../../../../lib/admin-auth";
import {
  ApplePreviewError,
  findApplePreview,
} from "../../../../../lib/apple-preview";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    assertAdminRequest(req);

    const body = (await req.json()) as {
      trackName?: unknown;
      artistNames?: unknown;
      albumName?: unknown;
    };
    const trackName =
      typeof body.trackName === "string" ? body.trackName.trim() : "";
    const artistNames =
      typeof body.artistNames === "string" ? body.artistNames.trim() : "";
    const albumName =
      typeof body.albumName === "string" ? body.albumName.trim() : "";

    const preview = await findApplePreview({
      trackName,
      artistNames,
      albumName,
    });

    return Response.json(preview);
  } catch (error) {
    console.error("apple preview lookup error", error);

    if (error instanceof AdminAuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof ApplePreviewError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    return Response.json(
      { error: "Apple preview lookup failed." },
      { status: 500 }
    );
  }
}
