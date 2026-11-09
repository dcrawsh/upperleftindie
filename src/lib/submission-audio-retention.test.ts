import { describe, expect, it } from "vitest";
import {
  getSubmissionAudioCleanupAction,
  isAbandonedSubmissionAudio,
} from "@/lib/submission-audio-retention";

const now = Date.parse("2026-11-08T20:00:00.000Z");

describe("getSubmissionAudioCleanupAction", () => {
  it("retries physical deletion for removed audio", () => {
    expect(
      getSubmissionAudioCleanupAction({
        status: "rejected",
        audio_storage_path: "incoming/rejected.mp3",
        audio_upload_status: "removed",
        audio_expires_at: null,
        audio_deleted_at: null,
        radio_removed_at: "2026-11-01T00:00:00.000Z",
        replied_at: null,
      })
    ).toBe("delete-removed");
  });

  it("expires an unreviewed pending upload", () => {
    expect(
      getSubmissionAudioCleanupAction(
        {
          status: "pending",
          audio_storage_path: "incoming/pending.mp3",
          audio_upload_status: "uploaded",
          audio_expires_at: "2026-11-08T19:59:59.000Z",
          audio_deleted_at: null,
          radio_removed_at: null,
          replied_at: null,
        },
        now
      )
    ).toBe("expire-pending");
  });

  it("preserves pending audio after an acceptance email", () => {
    expect(
      getSubmissionAudioCleanupAction(
        {
          status: "pending",
          audio_storage_path: "incoming/repair.mp3",
          audio_upload_status: "uploaded",
          audio_expires_at: "2026-11-01T00:00:00.000Z",
          audio_deleted_at: null,
          radio_removed_at: null,
          replied_at: "2026-11-02T00:00:00.000Z",
        },
        now
      )
    ).toBeNull();
  });

  it("preserves published audio", () => {
    expect(
      getSubmissionAudioCleanupAction(
        {
          status: "added",
          audio_storage_path: "incoming/published.mp3",
          audio_upload_status: "published",
          audio_expires_at: null,
          audio_deleted_at: null,
          radio_removed_at: null,
          replied_at: "2026-10-01T00:00:00.000Z",
        },
        now
      )
    ).toBeNull();
  });
});

describe("isAbandonedSubmissionAudio", () => {
  it("deletes an unreferenced upload after 24 hours", () => {
    expect(
      isAbandonedSubmissionAudio(
        {
          path: "incoming/2026-11-07/orphan.mp3",
          createdAt: "2026-11-07T19:59:59.000Z",
        },
        new Set(),
        now
      )
    ).toBe(true);
  });

  it("preserves referenced and recent uploads", () => {
    const referenced = "incoming/2026-11-01/referenced.mp3";

    expect(
      isAbandonedSubmissionAudio(
        { path: referenced, createdAt: "2026-11-01T00:00:00.000Z" },
        new Set([referenced]),
        now
      )
    ).toBe(false);
    expect(
      isAbandonedSubmissionAudio(
        {
          path: "incoming/2026-11-08/recent.mp3",
          createdAt: "2026-11-08T19:00:00.000Z",
        },
        new Set(),
        now
      )
    ).toBe(false);
  });
});
