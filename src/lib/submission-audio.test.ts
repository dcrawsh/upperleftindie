import { describe, expect, it } from "vitest";
import {
  hasMp3FileSignature,
  MAX_SUBMISSION_AUDIO_BYTES,
  SubmissionAudioError,
  validateAudioUploadRequest,
} from "@/lib/submission-audio";

describe("validateAudioUploadRequest", () => {
  it("normalizes an MP3 upload", () => {
    expect(
      validateAudioUploadRequest({
        fileName: " My Song.MP3 ",
        size: 1024,
        mimeType: "audio/mp3",
      })
    ).toEqual({
      fileName: "My Song.MP3",
      size: 1024,
      mimeType: "audio/mpeg",
    });
  });

  it("rejects a non-MP3 extension", () => {
    expect(() =>
      validateAudioUploadRequest({
        fileName: "song.wav",
        size: 1024,
        mimeType: "audio/wav",
      })
    ).toThrow(SubmissionAudioError);
  });

  it("rejects files over the configured limit", () => {
    expect(() =>
      validateAudioUploadRequest({
        fileName: "song.mp3",
        size: MAX_SUBMISSION_AUDIO_BYTES + 1,
        mimeType: "audio/mpeg",
      })
    ).toThrow("12 MB or smaller");
  });
});

describe("hasMp3FileSignature", () => {
  it("accepts ID3-tagged MP3 files", () => {
    expect(hasMp3FileSignature(Uint8Array.from([0x49, 0x44, 0x33]))).toBe(true);
  });

  it("accepts an MPEG frame sync", () => {
    expect(hasMp3FileSignature(Uint8Array.from([0xff, 0xfb]))).toBe(true);
  });

  it("rejects arbitrary bytes", () => {
    expect(hasMp3FileSignature(Uint8Array.from([0x50, 0x4b, 0x03]))).toBe(
      false
    );
  });
});
