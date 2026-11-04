"use client";

import { useRef, useState } from "react";
import { getErrorMessage } from "./helpers";
import type { PreviewState } from "./types";

/**
 * Shared 30-second audio preview player.
 *
 * Preview URLs are fetched lazily and cached per key, including negative
 * results — a track with no available preview is marked `isMissing` so the UI
 * can disable the control instead of re-requesting on every click.
 */
export function useTrackPreview({
  onMessage,
}: {
  onMessage: (message: string) => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentPreviewTrackUri, setCurrentPreviewTrackUri] = useState("");
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewsByKey, setPreviewsByKey] = useState<
    Record<string, PreviewState>
  >({});
  const [loadingPreviewKey, setLoadingPreviewKey] = useState("");

  async function playPreview({
    key,
    initialPreviewUrl = "",
    loadPreview,
  }: {
    key: string;
    initialPreviewUrl?: string;
    loadPreview: () => Promise<string>;
  }) {
    const audio = audioRef.current;
    const cachedPreview = previewsByKey[key];
    if (!audio || cachedPreview?.isMissing) return;

    if (currentPreviewTrackUri === key && isPreviewPlaying) {
      audio.pause();
      setIsPreviewPlaying(false);
      return;
    }

    let previewUrl = cachedPreview?.previewUrl || initialPreviewUrl;

    if (!previewUrl) {
      setLoadingPreviewKey(key);
      onMessage("");

      try {
        previewUrl = await loadPreview();
        setPreviewsByKey((current) => ({
          ...current,
          [key]: { previewUrl, isMissing: false },
        }));
      } catch (error) {
        setPreviewsByKey((current) => ({
          ...current,
          [key]: { previewUrl: "", isMissing: true },
        }));
        onMessage(getErrorMessage(error));
        return;
      } finally {
        setLoadingPreviewKey("");
      }
    }

    if (currentPreviewTrackUri !== key) {
      audio.src = previewUrl;
      setCurrentPreviewTrackUri(key);
    }

    try {
      await audio.play();
      setIsPreviewPlaying(true);
    } catch {
      onMessage("Track preview could not be played in this browser.");
    }
  }

  return {
    audioRef,
    currentPreviewTrackUri,
    isPreviewPlaying,
    setIsPreviewPlaying,
    previewsByKey,
    loadingPreviewKey,
    playPreview,
  };
}
