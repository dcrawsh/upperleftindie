import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { supabaseRequest } from "./supabase";

describe("supabaseRequest", () => {
  beforeEach(() => {
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it.each([200, 201, 204])(
    "accepts a successful %i response with no body",
    async (status) => {
      const fetchMock = vi
        .fn()
        .mockResolvedValue(new Response(null, { status }));
      vi.stubGlobal("fetch", fetchMock);

      await expect(
        supabaseRequest("track_ratings", {
          method: "POST",
          prefer: "return=minimal",
          body: JSON.stringify({ track_uri: "spotify:track:1", rating: 2 }),
        })
      ).resolves.toBeUndefined();
    }
  );

  it("parses a successful JSON response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify([{ rating: 3 }]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );

    await expect(
      supabaseRequest<Array<{ rating: number }>>("track_ratings")
    ).resolves.toEqual([{ rating: 3 }]);
  });

  it("turns malformed successful responses into a request error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("not json", { status: 200 }))
    );

    await expect(supabaseRequest("track_ratings")).rejects.toMatchObject({
      message: "Supabase returned an invalid JSON response.",
      status: 502,
    });
  });
});
