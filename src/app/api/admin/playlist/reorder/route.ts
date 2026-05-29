import { NextRequest } from "next/server";
import {
  AdminAuthError,
  assertAdminRequest,
} from "../../../../../lib/admin-auth";
import {
  reorderActivePlaylistTrack,
  SpotifyRequestError,
} from "../../../../../lib/spotify";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    assertAdminRequest(req);

    const body = (await req.json()) as {
      fromIndex?: unknown;
      toIndex?: unknown;
    };
    const fromIndex =
      typeof body.fromIndex === "number" ? body.fromIndex : Number.NaN;
    const toIndex = typeof body.toIndex === "number" ? body.toIndex : Number.NaN;

    await reorderActivePlaylistTrack(fromIndex, toIndex);

    return Response.json({ success: true });
  } catch (error) {
    console.error("reorder playlist track error", error);

    if (error instanceof AdminAuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof SpotifyRequestError) {
      return Response.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return Response.json(
      { error: "Track could not be reordered." },
      { status: 500 }
    );
  }
}
