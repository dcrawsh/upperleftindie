"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiArchive,
  FiCheck,
  FiCornerUpLeft,
  FiExternalLink,
  FiLock,
  FiMail,
  FiMove,
  FiPause,
  FiPlay,
  FiRefreshCw,
  FiX,
} from "react-icons/fi";
import { FaSpotify } from "react-icons/fa";

type SubmissionStatus = "pending" | "added" | "rejected" | "archived";

type Submission = {
  id: string;
  created_at: string;
  status: SubmissionStatus;
  artist_name: string;
  contact_name: string;
  email: string;
  city: string;
  region: string;
  genre: string;
  song_link: string;
  bandcamp_link?: string | null;
  social_link?: string | null;
  notes?: string | null;
  active_playlist_added_at?: string | null;
  replied_at?: string | null;
  reply_subject?: string | null;
};

type PlaylistTrack = {
  uri: string;
  id: string;
  name: string;
  artistNames: string;
  albumName: string;
  externalUrl: string;
  imageUrl: string;
  previewUrl: string;
  addedAt: string;
};

type Tab = "submissions" | "playlist" | "archive";

type ReplyDraft = {
  isOpen: boolean;
  subject: string;
  message: string;
};

type PreviewState = {
  previewUrl: string;
  isMissing: boolean;
};

const playlistUrl =
  "https://open.spotify.com/playlist/3LTI227By7Wt7hGs3mz5hF?si=f9293e66628f4b54";

const storageKey = "upperleftindie-admin-token";
const sessionDurationMs = 60 * 60 * 1000;

type StoredAdminSession = {
  token: string;
  expiresAt: number;
};

function getStoredAdminSession(): StoredAdminSession | null {
  const storedValue = window.localStorage.getItem(storageKey);
  if (!storedValue) return null;

  try {
    const parsed = JSON.parse(storedValue) as Partial<StoredAdminSession>;

    if (typeof parsed.token === "string" && typeof parsed.expiresAt === "number") {
      return {
        token: parsed.token,
        expiresAt: parsed.expiresAt,
      };
    }
  } catch {
    return {
      token: storedValue,
      expiresAt: Date.now() + sessionDurationMs,
    };
  }

  return null;
}

function storeAdminSession(token: string) {
  window.localStorage.setItem(
    storageKey,
    JSON.stringify({
      token,
      expiresAt: Date.now() + sessionDurationMs,
    })
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatDaysLive(value: string) {
  const addedAt = new Date(value).getTime();

  if (Number.isNaN(addedAt)) {
    return "Live date unknown";
  }

  const daysLive = Math.max(
    0,
    Math.floor((Date.now() - addedAt) / 86_400_000)
  );

  if (daysLive === 0) return "Live today";
  if (daysLive === 1) return "Live for 1 day";
  return `Live for ${daysLive} days`;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function getSpotifyAppTrackUrl(value: string) {
  if (value.startsWith("spotify:track:")) return value;

  try {
    const url = new URL(value);
    const [, type, id] = url.pathname.split("/");

    if (url.hostname.includes("spotify.com") && type === "track" && id) {
      return `spotify:track:${id}`;
    }
  } catch {
    // Keep the original link if it is not a parseable URL.
  }

  return value;
}

export default function AdminDashboard() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState<Tab>("submissions");
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | "all">(
    "pending"
  );
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [tracks, setTracks] = useState<PlaylistTrack[]>([]);
  const [archiveTracks, setArchiveTracks] = useState<PlaylistTrack[]>([]);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, ReplyDraft>>(
    {}
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentPreviewTrackUri, setCurrentPreviewTrackUri] = useState("");
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewsByKey, setPreviewsByKey] = useState<
    Record<string, PreviewState>
  >({});
  const [loadingPreviewKey, setLoadingPreviewKey] = useState("");
  const [draggedTrackUri, setDraggedTrackUri] = useState("");
  const [dragOverTrackUri, setDragOverTrackUri] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [workingId, setWorkingId] = useState("");
  const [message, setMessage] = useState("");

  const isUnlocked = Boolean(token);

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      "x-admin-token": token,
    }),
    [token]
  );

  function clearAdminSession() {
    window.localStorage.removeItem(storageKey);
    setToken("");
    setSubmissions([]);
    setTracks([]);
    setArchiveTracks([]);
    setReplyDrafts({});
  }

  function isAdminSessionExpired() {
    const session = getStoredAdminSession();
    return !session || session.expiresAt <= Date.now();
  }

  function expireAdminSession() {
    clearAdminSession();
    setMessage("Admin session expired. Please unlock again.");
  }

  async function adminFetch<T>(path: string, init: RequestInit = {}) {
    if (isAdminSessionExpired()) {
      expireAdminSession();
      throw new Error("Admin session expired. Please unlock again.");
    }

    const response = await fetch(path, {
      ...init,
      headers: {
        ...headers,
        ...init.headers,
      },
    });

    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
    };

    if (!response.ok) {
      if (response.status === 401) {
        clearAdminSession();
      }

      throw new Error(body.error || `Request failed with ${response.status}`);
    }

    return body as T;
  }

  async function loadSubmissions() {
    if (!token) return;

    setIsLoading(true);
    setMessage("");

    try {
      const data = await adminFetch<{ submissions: Submission[] }>(
        `/api/admin/submissions?status=${statusFilter}`
      );
      setSubmissions(data.submissions);
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  async function loadTracks() {
    if (!token) return;

    setIsLoading(true);
    setMessage("");

    try {
      const data = await adminFetch<{ tracks: PlaylistTrack[] }>(
        "/api/admin/playlist/active"
      );
      setTracks(data.tracks);
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  async function loadArchiveTracks() {
    if (!token) return;

    setIsLoading(true);
    setMessage("");

    try {
      const data = await adminFetch<{ tracks: PlaylistTrack[] }>(
        "/api/admin/playlist/archived"
      );
      setArchiveTracks(data.tracks);
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const session = getStoredAdminSession();

    if (!session) return;

    if (session.expiresAt <= Date.now()) {
      window.localStorage.removeItem(storageKey);
      return;
    }

    storeAdminSession(session.token);
    setToken(session.token);
  }, []);

  useEffect(() => {
    if (!token) return;

    const session = getStoredAdminSession();
    if (!session) return;

    const timeout = window.setTimeout(() => {
      expireAdminSession();
    }, Math.max(0, session.expiresAt - Date.now()));

    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!token) return;

    if (tab === "submissions") {
      loadSubmissions();
    } else if (tab === "playlist") {
      loadTracks();
    } else {
      loadArchiveTracks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, tab, statusFilter]);

  function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextToken = password.trim();

    if (!nextToken) {
      setMessage("Enter the admin password.");
      return;
    }

    storeAdminSession(nextToken);
    setToken(nextToken);
    setPassword("");
  }

  function handleLogout() {
    clearAdminSession();
  }

  async function addSubmissionToPlaylist(id: string) {
    setWorkingId(id);
    setMessage("");

    try {
      await adminFetch(`/api/admin/submissions/${id}/add-to-playlist`, {
        method: "POST",
      });
      setMessage("Track added to the active playlist.");
      await loadSubmissions();
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setWorkingId("");
    }
  }

  async function rejectSubmission(id: string) {
    setWorkingId(id);
    setMessage("");

    try {
      await adminFetch(`/api/admin/submissions/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "rejected" }),
      });
      setMessage("Submission archived from the review queue.");
      await loadSubmissions();
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setWorkingId("");
    }
  }

  function getDefaultReplySubject(submission: Submission) {
    return `Re: Upper Left Indie submission from ${submission.artist_name}`;
  }

  function getDefaultReplyMessage(submission: Submission) {
    const contactName = submission.contact_name || "there";

    return `Hello ${contactName},



Please save and share the playlist to help more NW artists get heard:
${playlistUrl}

Cheers,
Upper Left Indie team`;
  }

  function getReplyDraft(submission: Submission) {
    return (
      replyDrafts[submission.id] ?? {
        isOpen: false,
        subject: getDefaultReplySubject(submission),
        message: getDefaultReplyMessage(submission),
      }
    );
  }

  function updateReplyDraft(
    submission: Submission,
    values: Partial<ReplyDraft>
  ) {
    setReplyDrafts((current) => {
      const existing =
        current[submission.id] ?? {
          isOpen: false,
          subject: getDefaultReplySubject(submission),
          message: getDefaultReplyMessage(submission),
        };

      return {
        ...current,
        [submission.id]: {
          ...existing,
          ...values,
        },
      };
    });
  }

  function toggleReplyDraft(submission: Submission) {
    const draft = getReplyDraft(submission);
    updateReplyDraft(submission, { isOpen: !draft.isOpen });
  }

  async function sendSubmissionReply(submission: Submission) {
    const draft = getReplyDraft(submission);
    const replyId = `reply-${submission.id}`;

    if (!draft.message.trim()) {
      setMessage("Write a reply before sending.");
      return;
    }

    setWorkingId(replyId);
    setMessage("");

    try {
      const data = await adminFetch<{ submission?: Submission }>(
        `/api/admin/submissions/${submission.id}/reply`,
        {
          method: "POST",
          body: JSON.stringify({
            subject: draft.subject,
            message: draft.message,
          }),
        }
      );
      if (data.submission) {
        setSubmissions((current) =>
          current.map((item) =>
            item.id === data.submission?.id ? data.submission : item
          )
        );
      }
      updateReplyDraft(submission, { isOpen: false, message: "" });
      setMessage(`Reply sent to ${submission.email}.`);
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setWorkingId("");
    }
  }

  async function archiveTrackFromPlaylist(trackUri: string) {
    setWorkingId(trackUri);
    setMessage("");

    try {
      await adminFetch("/api/admin/playlist/archive", {
        method: "POST",
        body: JSON.stringify({ trackUri }),
      });
      setTracks((current) =>
        current.filter((track) => track.uri !== trackUri)
      );
      setMessage("Track moved to the archive playlist.");
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setWorkingId("");
    }
  }

  async function unarchiveTrackToPlaylist(trackUri: string) {
    setWorkingId(trackUri);
    setMessage("");

    try {
      await adminFetch("/api/admin/playlist/unarchive", {
        method: "POST",
        body: JSON.stringify({ trackUri }),
      });
      setArchiveTracks((current) =>
        current.filter((track) => track.uri !== trackUri)
      );
      setMessage("Track moved back to the active playlist.");
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setWorkingId("");
    }
  }

  function moveTrackInList(
    currentTracks: PlaylistTrack[],
    fromIndex: number,
    toIndex: number
  ) {
    const nextTracks = [...currentTracks];
    const [track] = nextTracks.splice(fromIndex, 1);

    if (!track) return currentTracks;

    nextTracks.splice(toIndex, 0, track);
    return nextTracks;
  }

  async function reorderActiveTrack(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;

    const track = tracks[fromIndex];
    if (!track) return;

    const previousTracks = tracks;
    const nextTracks = moveTrackInList(tracks, fromIndex, toIndex);

    setTracks(nextTracks);
    setWorkingId(`reorder:${track.uri}`);
    setMessage("");

    try {
      await adminFetch("/api/admin/playlist/reorder", {
        method: "POST",
        body: JSON.stringify({ fromIndex, toIndex }),
      });
      setMessage(`Moved ${track.name}.`);
    } catch (error) {
      setTracks(previousTracks);
      setMessage(getErrorMessage(error));
    } finally {
      setWorkingId("");
      setDraggedTrackUri("");
      setDragOverTrackUri("");
    }
  }

  function handleTrackDrop(toIndex: number) {
    if (!draggedTrackUri) return;

    const fromIndex = tracks.findIndex((track) => track.uri === draggedTrackUri);
    void reorderActiveTrack(fromIndex, toIndex);
  }

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
      setMessage("");

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
        setMessage(getErrorMessage(error));
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
      setMessage("Track preview could not be played in this browser.");
    }
  }

  async function toggleTrackPreview(track: PlaylistTrack) {
    const key = `track:${track.uri}`;

    await playPreview({
      key,
      initialPreviewUrl: track.previewUrl,
      loadPreview: async () => {
        const data = await adminFetch<{
          previewUrl: string;
          source: "apple";
        }>("/api/admin/playlist/preview", {
          method: "POST",
          body: JSON.stringify({
            trackName: track.name,
            artistNames: track.artistNames,
            albumName: track.albumName,
          }),
        });

        return data.previewUrl;
      },
    });
  }

  async function toggleSubmissionPreview(submission: Submission) {
    const key = `submission:${submission.id}`;

    await playPreview({
      key,
      loadPreview: async () => {
        const data = await adminFetch<{
          previewUrl: string;
          source: "spotify" | "apple";
        }>(`/api/admin/submissions/${submission.id}/preview`);

        return data.previewUrl;
      },
    });
  }

  if (!isUnlocked) {
    return (
      <div className="mx-auto max-w-md rounded-md border border-ink/10 bg-paper p-6 shadow-soft">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-ink text-paper">
            <FiLock size={20} />
          </span>
          <div>
            <h1 className="text-2xl font-black text-ink">Admin</h1>
            <p className="text-sm text-ink/60">Upper Left Indie queue</p>
          </div>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <label className="space-y-2 text-sm font-bold text-ink/70">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-md border border-ink/15 bg-white px-4 py-3 text-base text-ink outline-none transition focus:border-clay"
            />
          </label>
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-paper transition hover:bg-clay"
          >
            <FiLock size={16} />
            Unlock
          </button>
        </form>
        {message ? <p className="mt-4 text-sm text-clay">{message}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <audio
        ref={audioRef}
        preload="none"
        onEnded={() => setIsPreviewPlaying(false)}
        onPause={() => setIsPreviewPlaying(false)}
      />
      <header className="flex flex-col gap-4 border-b border-ink/10 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-clay">
            Admin
          </p>
          <h1 className="mt-2 text-3xl font-black text-ink md:text-4xl">
            Playlist Desk
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab("submissions")}
            className={`rounded-full px-5 py-3 text-sm font-bold transition ${
              tab === "submissions"
                ? "bg-ink text-paper"
                : "border border-ink/15 text-ink hover:border-clay hover:text-clay"
            }`}
          >
            Submissions
          </button>
          <button
            type="button"
            onClick={() => setTab("playlist")}
            className={`rounded-full px-5 py-3 text-sm font-bold transition ${
              tab === "playlist"
                ? "bg-ink text-paper"
                : "border border-ink/15 text-ink hover:border-clay hover:text-clay"
            }`}
          >
            Active Playlist
          </button>
          <button
            type="button"
            onClick={() => setTab("archive")}
            className={`rounded-full px-5 py-3 text-sm font-bold transition ${
              tab === "archive"
                ? "bg-ink text-paper"
                : "border border-ink/15 text-ink hover:border-clay hover:text-clay"
            }`}
          >
            Archive
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-ink/15 px-5 py-3 text-sm font-bold text-ink/70 transition hover:border-clay hover:text-clay"
          >
            Lock
          </button>
        </div>
      </header>

      {message ? (
        <div className="rounded-md border border-clay/20 bg-clay/10 px-4 py-3 text-sm font-bold text-clay">
          {message}
        </div>
      ) : null}

      {tab === "submissions" ? (
        <section className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              {(["pending", "added", "rejected", "all"] as const).map(
                (status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`rounded-full px-4 py-2 text-sm font-bold capitalize transition ${
                      statusFilter === status
                        ? "bg-moss text-paper"
                        : "border border-ink/15 text-ink/70 hover:border-moss hover:text-moss"
                    }`}
                  >
                    {status}
                  </button>
                )
              )}
            </div>
            <button
              type="button"
              onClick={loadSubmissions}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-sm font-bold text-ink transition hover:border-clay hover:text-clay disabled:opacity-60"
            >
              <FiRefreshCw size={16} />
              Refresh
            </button>
          </div>

          <div className="grid gap-4">
            {submissions.map((submission) => {
              const replyDraft = getReplyDraft(submission);
              const replyWorkingId = `reply-${submission.id}`;
              const hasReplied = Boolean(submission.replied_at);
              const previewKey = `submission:${submission.id}`;
              const previewState = previewsByKey[previewKey];
              const isPreviewLoading = loadingPreviewKey === previewKey;
              const isCurrentPreview =
                currentPreviewTrackUri === previewKey && isPreviewPlaying;

              return (
                <article
                  key={submission.id}
                  className={`rounded-md border p-5 shadow-soft ${
                    hasReplied
                      ? "border-moss/40 bg-moss/5"
                      : "border-ink/10 bg-paper"
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 space-y-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink/45">
                          {formatDate(submission.created_at)} /{" "}
                          {submission.status}
                          {submission.replied_at
                            ? ` / replied ${formatDate(submission.replied_at)}`
                            : ""}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <h2 className="text-2xl font-black text-ink">
                            {submission.artist_name}
                          </h2>
                          {hasReplied ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-moss px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-paper">
                              <FiMail size={13} />
                              Replied
                            </span>
                          ) : null}
                        </div>
                        <p className="text-sm leading-6 text-ink/65">
                          {submission.genre || "No genre"} /{" "}
                          {submission.city || "No city"}{" "}
                          {submission.region ? `/${submission.region}` : ""}
                        </p>
                      </div>
                      <div className="grid gap-2 text-sm text-ink/70 md:grid-cols-2">
                        <p>
                          <span className="font-bold text-ink">Contact:</span>{" "}
                          {submission.contact_name}
                        </p>
                        <p>
                          <span className="font-bold text-ink">Email:</span>{" "}
                          <a
                            href={`mailto:${submission.email}`}
                            className="text-clay hover:text-ink"
                          >
                            {submission.email}
                          </a>
                        </p>
                      </div>
                      {submission.notes ? (
                        <p className="max-w-3xl whitespace-pre-wrap text-sm leading-6 text-ink/70">
                          {submission.notes}
                        </p>
                      ) : null}
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => toggleSubmissionPreview(submission)}
                          disabled={isPreviewLoading || previewState?.isMissing}
                          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition ${
                            previewState?.isMissing
                              ? "border-ink/10 text-ink/35"
                              : "border-ink/15 text-ink hover:border-moss hover:text-moss"
                          }`}
                        >
                          {isCurrentPreview ? (
                            <FiPause size={16} />
                          ) : (
                            <FiPlay size={16} />
                          )}
                          {isPreviewLoading
                            ? "Finding..."
                            : previewState?.isMissing
                              ? "No Preview"
                              : isCurrentPreview
                                ? "Pause"
                                : previewState?.previewUrl
                                  ? "Preview"
                                  : "Find Preview"}
                        </button>
                        <a
                          href={getSpotifyAppTrackUrl(submission.song_link)}
                          className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-sm font-bold text-ink transition hover:border-green-700 hover:text-green-700"
                        >
                          <FaSpotify size={16} />
                          Song
                        </a>
                        {submission.bandcamp_link ? (
                          <a
                            href={submission.bandcamp_link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-sm font-bold text-ink transition hover:border-clay hover:text-clay"
                          >
                            <FiExternalLink size={16} />
                            Bandcamp
                          </a>
                        ) : null}
                        {submission.social_link ? (
                          <a
                            href={submission.social_link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-sm font-bold text-ink transition hover:border-clay hover:text-clay"
                          >
                            <FiExternalLink size={16} />
                            Social
                          </a>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">
                      <button
                        type="button"
                        onClick={() => toggleReplyDraft(submission)}
                        className={`inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-bold uppercase tracking-[0.1em] transition ${
                          hasReplied
                            ? "border-moss/40 text-moss hover:border-ink hover:text-ink"
                            : "border-ink/15 text-ink hover:border-clay hover:text-clay"
                        }`}
                      >
                        <FiMail size={16} />
                        {hasReplied ? "Replied" : "Reply"}
                      </button>
                      <button
                        type="button"
                        onClick={() => addSubmissionToPlaylist(submission.id)}
                        disabled={workingId === submission.id}
                        className="inline-flex items-center gap-2 rounded-full bg-moss px-5 py-3 text-sm font-bold uppercase tracking-[0.1em] text-paper transition hover:bg-ink disabled:opacity-60"
                      >
                        <FiCheck size={16} />
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => rejectSubmission(submission.id)}
                        disabled={workingId === submission.id}
                        className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-5 py-3 text-sm font-bold uppercase tracking-[0.1em] text-ink transition hover:border-clay hover:text-clay disabled:opacity-60"
                      >
                        <FiX size={16} />
                        Pass
                      </button>
                    </div>
                  </div>

                  {replyDraft.isOpen ? (
                    <div className="mt-5 space-y-3 border-t border-ink/10 pt-5">
                      <label className="block space-y-2 text-sm font-bold text-ink/70">
                        Subject
                        <input
                          type="text"
                          value={replyDraft.subject}
                          onChange={(event) =>
                            updateReplyDraft(submission, {
                              subject: event.target.value,
                            })
                          }
                          className="w-full rounded-md border border-ink/15 bg-white px-4 py-3 text-base font-normal text-ink outline-none transition focus:border-clay"
                        />
                      </label>
                      <label className="block space-y-2 text-sm font-bold text-ink/70">
                        Message
                        <textarea
                          value={replyDraft.message}
                          onChange={(event) =>
                            updateReplyDraft(submission, {
                              message: event.target.value,
                            })
                          }
                          rows={7}
                          placeholder={`Hey ${submission.contact_name || "there"},`}
                          className="w-full rounded-md border border-ink/15 bg-white px-4 py-3 text-base font-normal leading-6 text-ink outline-none transition focus:border-clay"
                        />
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => sendSubmissionReply(submission)}
                          disabled={workingId === replyWorkingId}
                          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-bold uppercase tracking-[0.1em] text-paper transition hover:bg-clay disabled:opacity-60"
                        >
                          <FiMail size={16} />
                          Send
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateReplyDraft(submission, { isOpen: false })
                          }
                          className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-5 py-3 text-sm font-bold uppercase tracking-[0.1em] text-ink transition hover:border-clay hover:text-clay"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>

          {!isLoading && submissions.length === 0 ? (
            <p className="rounded-md border border-ink/10 bg-paper/75 p-5 text-sm font-bold text-ink/60">
              No submissions in this view.
            </p>
          ) : null}
        </section>
      ) : tab === "playlist" ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-ink/60">
              {tracks.length} active tracks
            </p>
            <button
              type="button"
              onClick={loadTracks}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-sm font-bold text-ink transition hover:border-clay hover:text-clay disabled:opacity-60"
            >
              <FiRefreshCw size={16} />
              Refresh
            </button>
          </div>

          <div className="grid gap-3">
            {tracks.map((track, index) => (
              <article
                key={track.uri}
                onDragOver={(event) => {
                  if (!draggedTrackUri) return;
                  event.preventDefault();
                  setDragOverTrackUri(track.uri);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  handleTrackDrop(index);
                }}
                onDragEnd={() => {
                  setDraggedTrackUri("");
                  setDragOverTrackUri("");
                }}
                className={`flex flex-col gap-4 rounded-md border bg-paper p-4 shadow-soft transition sm:flex-row sm:items-center ${
                  dragOverTrackUri === track.uri &&
                  draggedTrackUri !== track.uri
                    ? "border-clay bg-clay/5"
                    : "border-ink/10"
                }`}
              >
                <button
                  type="button"
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", track.uri);
                    setDraggedTrackUri(track.uri);
                    setDragOverTrackUri(track.uri);
                  }}
                  disabled={workingId.startsWith("reorder:")}
                  className="inline-flex h-10 w-10 shrink-0 cursor-grab items-center justify-center rounded-md border border-ink/10 text-ink/45 transition hover:border-clay hover:text-clay active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={`Drag ${track.name} to reorder`}
                  title="Drag to reorder"
                >
                  <FiMove size={18} />
                </button>
                {track.imageUrl ? (
                  <img
                    src={track.imageUrl}
                    alt=""
                    className="h-20 w-20 rounded-md object-cover"
                  />
                ) : (
                  <div className="grid h-20 w-20 place-items-center rounded-md bg-ink/10 text-ink/40">
                    <FaSpotify size={24} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink/45">
                    {formatDaysLive(track.addedAt)} / Added{" "}
                    {formatDate(track.addedAt)}
                  </p>
                  <h2 className="truncate text-lg font-black text-ink">
                    {track.name}
                  </h2>
                  <p className="truncate text-sm text-ink/65">
                    {track.artistNames} / {track.albumName}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => toggleTrackPreview(track)}
                    disabled={
                      loadingPreviewKey === `track:${track.uri}` ||
                      previewsByKey[`track:${track.uri}`]?.isMissing
                    }
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-3 text-sm font-bold transition ${
                      previewsByKey[`track:${track.uri}`]?.isMissing
                        ? "border-ink/10 text-ink/35"
                        : "border-ink/15 text-ink hover:border-moss hover:text-moss"
                    }`}
                  >
                    {currentPreviewTrackUri === `track:${track.uri}` &&
                    isPreviewPlaying ? (
                      <FiPause size={16} />
                    ) : (
                      <FiPlay size={16} />
                    )}
                    {loadingPreviewKey === `track:${track.uri}`
                      ? "Finding..."
                      : previewsByKey[`track:${track.uri}`]?.isMissing
                        ? "No Preview"
                        : currentPreviewTrackUri === `track:${track.uri}` &&
                            isPreviewPlaying
                          ? "Pause"
                          : track.previewUrl ||
                              previewsByKey[`track:${track.uri}`]?.previewUrl
                            ? "Preview"
                            : "Find Preview"}
                  </button>
                  {track.externalUrl ? (
                    <a
                      href={track.uri || track.externalUrl}
                      className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-3 text-sm font-bold text-ink transition hover:border-green-700 hover:text-green-700"
                    >
                      <FaSpotify size={16} />
                      Open
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => archiveTrackFromPlaylist(track.uri)}
                    disabled={workingId === track.uri}
                    className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-3 text-sm font-bold uppercase tracking-[0.1em] text-paper transition hover:bg-clay disabled:opacity-60"
                  >
                    <FiArchive size={16} />
                    Archive
                  </button>
                </div>
              </article>
            ))}
          </div>

          {!isLoading && tracks.length === 0 ? (
            <p className="rounded-md border border-ink/10 bg-paper/75 p-5 text-sm font-bold text-ink/60">
              No active playlist tracks loaded.
            </p>
          ) : null}
        </section>
      ) : (
        <section className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold text-ink/60">
                {archiveTracks.length} archived tracks
              </p>
              <a
                href="/archive"
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-ink/45 transition hover:text-clay"
              >
                View public archive page
                <FiExternalLink size={13} />
              </a>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href="/archive"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-sm font-bold text-ink transition hover:border-clay hover:text-clay"
              >
                <FiExternalLink size={16} />
                Public Page
              </a>
              <button
                type="button"
                onClick={loadArchiveTracks}
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-sm font-bold text-ink transition hover:border-clay hover:text-clay disabled:opacity-60"
              >
                <FiRefreshCw size={16} />
                Refresh
              </button>
            </div>
          </div>

          <div className="grid gap-3">
            {archiveTracks.map((track) => (
              <article
                key={track.uri}
                className="flex flex-col gap-4 rounded-md border border-ink/10 bg-paper p-4 shadow-soft sm:flex-row sm:items-center"
              >
                {track.imageUrl ? (
                  <img
                    src={track.imageUrl}
                    alt=""
                    className="h-20 w-20 rounded-md object-cover"
                  />
                ) : (
                  <div className="grid h-20 w-20 place-items-center rounded-md bg-ink/10 text-ink/40">
                    <FaSpotify size={24} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink/45">
                    Archived {formatDate(track.addedAt)}
                  </p>
                  <h2 className="truncate text-lg font-black text-ink">
                    {track.name}
                  </h2>
                  <p className="truncate text-sm text-ink/65">
                    {track.artistNames} / {track.albumName}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {track.externalUrl ? (
                    <a
                      href={track.uri || track.externalUrl}
                      className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-3 text-sm font-bold text-ink transition hover:border-green-700 hover:text-green-700"
                    >
                      <FaSpotify size={16} />
                      Open
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => unarchiveTrackToPlaylist(track.uri)}
                    disabled={workingId === track.uri}
                    className="inline-flex items-center gap-2 rounded-full bg-moss px-4 py-3 text-sm font-bold uppercase tracking-[0.1em] text-paper transition hover:bg-ink disabled:opacity-60"
                  >
                    <FiCornerUpLeft size={16} />
                    Unarchive
                  </button>
                </div>
              </article>
            ))}
          </div>

          {!isLoading && archiveTracks.length === 0 ? (
            <p className="rounded-md border border-ink/10 bg-paper/75 p-5 text-sm font-bold text-ink/60">
              No archived playlist tracks loaded.
            </p>
          ) : null}
        </section>
      )}
    </div>
  );
}
