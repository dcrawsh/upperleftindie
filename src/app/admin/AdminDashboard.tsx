"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FiArchive,
  FiCheck,
  FiCornerUpLeft,
  FiExternalLink,
  FiLock,
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
};

type PlaylistTrack = {
  uri: string;
  id: string;
  name: string;
  artistNames: string;
  albumName: string;
  externalUrl: string;
  imageUrl: string;
  addedAt: string;
};

type Tab = "submissions" | "playlist" | "archive";

const storageKey = "upperleftindie-admin-token";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
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

  async function adminFetch<T>(path: string, init: RequestInit = {}) {
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
    const storedToken = window.localStorage.getItem(storageKey);
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

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

    window.localStorage.setItem(storageKey, nextToken);
    setToken(nextToken);
    setPassword("");
  }

  function handleLogout() {
    window.localStorage.removeItem(storageKey);
    setToken("");
    setSubmissions([]);
    setTracks([]);
    setArchiveTracks([]);
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
            {submissions.map((submission) => (
              <article
                key={submission.id}
                className="rounded-md border border-ink/10 bg-paper p-5 shadow-soft"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 space-y-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink/45">
                        {formatDate(submission.created_at)} /{" "}
                        {submission.status}
                      </p>
                      <h2 className="mt-1 text-2xl font-black text-ink">
                        {submission.artist_name}
                      </h2>
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
                      <a
                        href={submission.song_link}
                        target="_blank"
                        rel="noreferrer"
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
              </article>
            ))}
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
            {tracks.map((track) => (
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
                    Added {formatDate(track.addedAt)}
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
                      href={track.externalUrl}
                      target="_blank"
                      rel="noreferrer"
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
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-ink/60">
              {archiveTracks.length} archived tracks
            </p>
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
                      href={track.externalUrl}
                      target="_blank"
                      rel="noreferrer"
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
