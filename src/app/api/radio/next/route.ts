import { NextRequest } from "next/server";
import { getNextRadioTrack, RadioError } from "@/lib/radio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const excludeId = req.nextUrl.searchParams.get("exclude")?.trim() ?? "";
    const track = await getNextRadioTrack(excludeId);

    if (!track) {
      return Response.json(
        { error: "Upper Left Radio is waiting for its first approved track." },
        { status: 404 }
      );
    }

    return Response.json(
      { track },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error("radio next track error", error);

    if (error instanceof RadioError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    return Response.json(
      { error: "Upper Left Radio could not load the next track." },
      { status: 500 }
    );
  }
}
