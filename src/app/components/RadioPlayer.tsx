"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { FiExternalLink, FiPause, FiPlay, FiRadio } from "react-icons/fi";
import SiteContainer from "./SiteContainer";
import ArtistImage from "./ui/ArtistImage";

type RadioTrack = {
  id: string;
  artistName: string;
  trackTitle: string;
  place: string;
  artistUrl: string | null;
  artistBio: string | null;
  imageSrc: string | null;
  audioUrl: string;
};

async function responseError(response: Response) {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error || "Upper Left Radio could not load.";
  } catch {
    return "Upper Left Radio could not load.";
  }
}

export default function RadioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [track, setTrack] = useState<RadioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  const [message, setMessage] = useState("");

  async function loadNext() {
    const audio = audioRef.current;
    if (!audio || isLoading) return;

    setIsLoading(true);
    setMessage("");

    try {
      const query = track ? `?exclude=${encodeURIComponent(track.id)}` : "";
      const response = await fetch(`/api/radio/next${query}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(await responseError(response));
      }

      const result = (await response.json()) as { track: RadioTrack };
      audio.src = result.track.audioUrl;
      setTrack(result.track);
      setIsBioExpanded(false);
      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      setIsPlaying(false);
      setMessage(
        error instanceof Error
          ? error.message
          : "Upper Left Radio could not load."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;

    if (!track) {
      await loadNext();
      return;
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    try {
      await audio.play();
      setIsPlaying(true);
      setMessage("");
    } catch {
      setMessage("Playback could not start in this browser.");
    }
  }

  return (
    <section
      className="border-b border-subtle bg-inverse text-on-inverse"
      aria-label="Upper Left Radio player"
    >
      <SiteContainer className="flex min-h-[78px] flex-wrap items-center gap-4 py-3">
        <button
          type="button"
          onClick={togglePlayback}
          disabled={isLoading}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-page text-primary transition hover:bg-accent-soft disabled:opacity-50"
          aria-label={
            isPlaying ? "Pause Upper Left Radio" : "Play Upper Left Radio"
          }
        >
          {isLoading ? (
            <FiRadio size={20} aria-hidden="true" />
          ) : isPlaying ? (
            <FiPause size={20} aria-hidden="true" />
          ) : (
            <FiPlay size={20} aria-hidden="true" />
          )}
        </button>

        {track ? (
          <ArtistImage
            name={track.artistName}
            src={track.imageSrc ?? undefined}
            size={56}
          />
        ) : null}

        <div className="min-w-0 flex-1">
          <p className="type-label-s text-on-inverse/70">
            Upper Left Radio · Continuous artist submissions
          </p>
          <p
            className="truncate type-heading-s text-on-inverse"
            aria-live="polite"
          >
            {track
              ? `${track.trackTitle} — ${track.artistName}`
              : isLoading
                ? "Tuning in…"
                : "Press play to tune in"}
          </p>
          {message ? (
            <p className="type-body-s text-on-inverse/80" role="status">
              {message}
            </p>
          ) : track ? (
            <div className="flex flex-col gap-0.5">
              {track.place ? (
                <p className="type-body-s text-on-inverse/70">{track.place}</p>
              ) : null}
              {track.artistBio ? (
                <p
                  className="max-w-measure overflow-hidden type-body-s text-on-inverse/80"
                  style={
                    isBioExpanded
                      ? undefined
                      : {
                          display: "-webkit-box",
                          WebkitBoxOrient: "vertical",
                          WebkitLineClamp: 2,
                        }
                  }
                >
                  {track.artistBio}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {track?.artistBio ? (
            <button
              type="button"
              onClick={() => setIsBioExpanded((current) => !current)}
              aria-expanded={isBioExpanded}
              className="inline-flex min-h-11 items-center rounded-full px-3 type-label-s text-on-inverse underline decoration-transparent underline-offset-4 transition hover:decoration-on-inverse"
            >
              {isBioExpanded ? "Less" : "Bio"}
            </button>
          ) : null}
          {track?.artistUrl ? (
            <a
              href={track.artistUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-on-inverse/30 px-4 type-label-s text-on-inverse transition hover:bg-page hover:text-primary"
            >
              Artist
              <FiExternalLink size={14} aria-hidden="true" />
            </a>
          ) : null}
          <Link
            href="/radio"
            className="inline-flex min-h-11 items-center rounded-full px-3 type-label-s text-on-inverse underline decoration-transparent underline-offset-4 transition hover:decoration-on-inverse"
          >
            About the radio
          </Link>
        </div>

        <audio
          ref={audioRef}
          preload="none"
          onEnded={loadNext}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          onError={() => {
            setIsPlaying(false);
            setTrack(null);
            setIsBioExpanded(false);
            setMessage("That track could not play. Press play to try again.");
          }}
        />
      </SiteContainer>
    </section>
  );
}
