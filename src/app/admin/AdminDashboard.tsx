"use client";

import { useCallback, useEffect, useState } from "react";
import { ArchiveTab } from "./ArchiveTab";
import { LoginScreen } from "./LoginScreen";
import { PlaylistTab } from "./PlaylistTab";
import { SubmissionsTab } from "./SubmissionsTab";
import {
  getDefaultReplyMessage,
  getDefaultReplySubject,
  getErrorMessage,
} from "./helpers";
import type {
  PlaylistTrack,
  ReplyDraft,
  Submission,
  SubmissionStatus,
  Tab,
} from "./types";
import { useActivePlaylist } from "./useActivePlaylist";
import { useAdminSession } from "./useAdminSession";
import { useTrackPreview } from "./useTrackPreview";

/**
 * Orchestrates the admin console: owns the data for each tab and the actions
 * that mutate it. Session handling lives in useAdminSession, the active
 * playlist in useActivePlaylist, audio previews in useTrackPreview, and all
 * presentation in the per-tab components.
 */
export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("submissions");
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | "all">(
    "pending"
  );
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [archiveTracks, setArchiveTracks] = useState<PlaylistTrack[]>([]);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, ReplyDraft>>(
    {}
  );
  const [isLoading, setIsLoading] = useState(false);
  const [workingId, setWorkingId] = useState("");
  const [message, setMessage] = useState("");

  const resetDashboardData = useCallback(() => {
    setSubmissions([]);
    setArchiveTracks([]);
    setReplyDrafts({});
  }, []);

  const {
    token,
    isUnlocked,
    password,
    setPassword,
    handleLogin,
    handleLogout,
    adminFetch,
  } = useAdminSession({
    onReset: resetDashboardData,
    onMessage: setMessage,
  });

  const playlist = useActivePlaylist({
    token,
    adminFetch,
    setIsLoading,
    setWorkingId,
    setMessage,
  });

  const {
    audioRef,
    currentPreviewTrackUri,
    isPreviewPlaying,
    setIsPreviewPlaying,
    previewsByKey,
    loadingPreviewKey,
    playPreview,
  } = useTrackPreview({ onMessage: setMessage });

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
    if (!token) return;

    if (tab === "submissions") {
      loadSubmissions();
    } else if (tab === "playlist") {
      playlist.loadTracks();
    } else {
      loadArchiveTracks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, tab, statusFilter]);

  function getReplyDraft(submission: Submission): ReplyDraft {
    return (
      replyDrafts[submission.id] ?? {
        isOpen: false,
        subject: getDefaultReplySubject(submission.artist_name),
        message: getDefaultReplyMessage(submission.contact_name),
      }
    );
  }

  function updateReplyDraft(
    submission: Submission,
    values: Partial<ReplyDraft>
  ) {
    setReplyDrafts((current) => {
      const existing = current[submission.id] ?? {
        isOpen: false,
        subject: getDefaultReplySubject(submission.artist_name),
        message: getDefaultReplyMessage(submission.contact_name),
      };

      return {
        ...current,
        [submission.id]: { ...existing, ...values },
      };
    });
  }

  function toggleReplyDraft(submission: Submission) {
    updateReplyDraft(submission, { isOpen: !getReplyDraft(submission).isOpen });
  }

  async function generateSubmissionReply(submission: Submission) {
    const draft = getReplyDraft(submission);
    const draftWorkingId = `draft-${submission.id}`;

    updateReplyDraft(submission, { isOpen: true });
    setWorkingId(draftWorkingId);
    setMessage("");

    try {
      const data = await adminFetch<{
        draftId: string;
        subject: string;
        message: string;
      }>(`/api/admin/submissions/${submission.id}/draft-reply`, {
        method: "POST",
        body: JSON.stringify({ previousDraftId: draft.aiDraftId }),
      });

      updateReplyDraft(submission, {
        isOpen: true,
        subject: data.subject,
        message: data.message,
        aiDraftId: data.draftId,
        aiRating: 0,
      });
      setMessage(
        "AI reply drafted. The track joins the playlist when you send it."
      );
      return true;
    } catch (error) {
      setMessage(getErrorMessage(error));
      return false;
    } finally {
      setWorkingId("");
    }
  }

  /**
   * Repair path only. The acceptance normally adds the track itself, so this
   * runs when the email went out but Spotify refused the insert.
   */
  async function addSubmissionToPlaylist(submission: Submission) {
    setWorkingId(submission.id);
    setMessage("");

    try {
      const data = await adminFetch<{ submission?: Submission }>(
        `/api/admin/submissions/${submission.id}/add-to-playlist`,
        { method: "POST" }
      );

      if (data.submission) {
        const added = data.submission;
        setSubmissions((current) =>
          statusFilter !== "all" && added.status !== statusFilter
            ? current.filter((item) => item.id !== added.id)
            : current.map((item) => (item.id === added.id ? added : item))
        );
      }

      setMessage("Track added to the playlist.");
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

  async function rateReplyDraft(submission: Submission, rating: -1 | 1) {
    const draft = getReplyDraft(submission);
    if (!draft.aiDraftId) return;

    setWorkingId(`rating-${submission.id}`);

    try {
      await adminFetch(`/api/admin/reply-drafts/${draft.aiDraftId}`, {
        method: "PATCH",
        body: JSON.stringify({ rating, feedbackTags: [] }),
      });
      updateReplyDraft(submission, { aiRating: rating });
      setMessage(
        rating === 1
          ? "Draft marked as a good example."
          : "Draft marked as needing work. Your final edit will be saved if you send it."
      );
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setWorkingId("");
    }
  }

  async function sendSubmissionReply(submission: Submission) {
    const draft = getReplyDraft(submission);

    if (!draft.message.trim()) {
      setMessage("Write a reply before sending.");
      return;
    }

    setWorkingId(`reply-${submission.id}`);
    setMessage("");

    try {
      const data = await adminFetch<{
        submission?: Submission;
        trainingSaved?: boolean | null;
        playlistAdded?: boolean | null;
        submissionSaved?: boolean;
      }>(`/api/admin/submissions/${submission.id}/reply`, {
        method: "POST",
        body: JSON.stringify({
          subject: draft.subject,
          message: draft.message,
          draftId: draft.aiDraftId,
        }),
      });

      if (data.submission) {
        const sent = data.submission;
        // Sending an acceptance flips the status to "added", so the row may no
        // longer belong in the list the curator is currently filtered to.
        setSubmissions((current) =>
          statusFilter !== "all" && sent.status !== statusFilter
            ? current.filter((item) => item.id !== sent.id)
            : current.map((item) => (item.id === sent.id ? sent : item))
        );
      }

      updateReplyDraft(submission, {
        isOpen: false,
        message: "",
        aiDraftId: undefined,
        aiRating: undefined,
      });
      setMessage(
        data.submissionSaved === false
          ? `Reply sent to ${submission.email}, but the submission could not be updated. Refresh before sending again.`
          : data.playlistAdded === false
            ? `Reply sent to ${submission.email}, but the track could not be added to the playlist. Use Add to Playlist to finish.`
            : data.trainingSaved === false
              ? `Reply sent to ${submission.email}, but the training example could not be saved.`
              : data.playlistAdded
                ? `Reply sent to ${submission.email} and the track is on the playlist.`
                : `Reply sent to ${submission.email}.`
      );
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

  async function toggleTrackPreview(track: PlaylistTrack) {
    await playPreview({
      key: `track:${track.uri}`,
      initialPreviewUrl: track.previewUrl,
      loadPreview: async () => {
        const data = await adminFetch<{ previewUrl: string }>(
          "/api/admin/playlist/preview",
          {
            method: "POST",
            body: JSON.stringify({
              trackName: track.name,
              artistNames: track.artistNames,
              albumName: track.albumName,
            }),
          }
        );

        return data.previewUrl;
      },
    });
  }

  async function toggleSubmissionPreview(submission: Submission) {
    await playPreview({
      key: `submission:${submission.id}`,
      loadPreview: async () => {
        const data = await adminFetch<{ previewUrl: string }>(
          `/api/admin/submissions/${submission.id}/preview`
        );

        return data.previewUrl;
      },
    });
  }

  if (!isUnlocked) {
    return (
      <LoginScreen
        password={password}
        setPassword={setPassword}
        onSubmit={handleLogin}
        message={message}
      />
    );
  }

  const tabButtonClass = (value: Tab) =>
    `rounded-full px-5 py-3 text-sm font-bold transition ${
      tab === value
        ? "bg-ink text-paper"
        : "border border-ink/15 text-ink hover:border-clay hover:text-clay"
    }`;

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
            className={tabButtonClass("submissions")}
          >
            Submissions
          </button>
          <button
            type="button"
            onClick={() => setTab("playlist")}
            className={tabButtonClass("playlist")}
          >
            Active Playlist
          </button>
          <button
            type="button"
            onClick={() => setTab("archive")}
            className={tabButtonClass("archive")}
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
        <SubmissionsTab
          submissions={submissions}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          isLoading={isLoading}
          workingId={workingId}
          onRefresh={loadSubmissions}
          getReplyDraft={getReplyDraft}
          updateReplyDraft={updateReplyDraft}
          onToggleReplyDraft={toggleReplyDraft}
          onAddToPlaylist={addSubmissionToPlaylist}
          onReject={rejectSubmission}
          onGenerateReply={generateSubmissionReply}
          onRateDraft={rateReplyDraft}
          onSendReply={sendSubmissionReply}
          onTogglePreview={toggleSubmissionPreview}
          currentPreviewTrackUri={currentPreviewTrackUri}
          isPreviewPlaying={isPreviewPlaying}
          previewsByKey={previewsByKey}
          loadingPreviewKey={loadingPreviewKey}
        />
      ) : tab === "playlist" ? (
        <PlaylistTab
          tracks={playlist.tracks}
          isLoading={isLoading}
          workingId={workingId}
          draggedTrackUri={playlist.draggedTrackUri}
          dragOverTrackUri={playlist.dragOverTrackUri}
          setDraggedTrackUri={playlist.setDraggedTrackUri}
          setDragOverTrackUri={playlist.setDragOverTrackUri}
          onRefresh={playlist.loadTracks}
          onSort={playlist.sortTracks}
          onTrackDrop={playlist.handleTrackDrop}
          onArchive={playlist.archiveTrack}
          onRate={playlist.rateTrack}
          onTogglePreview={toggleTrackPreview}
          currentPreviewTrackUri={currentPreviewTrackUri}
          isPreviewPlaying={isPreviewPlaying}
          previewsByKey={previewsByKey}
          loadingPreviewKey={loadingPreviewKey}
        />
      ) : (
        <ArchiveTab
          archiveTracks={archiveTracks}
          isLoading={isLoading}
          workingId={workingId}
          onRefresh={loadArchiveTracks}
          onUnarchive={unarchiveTrackToPlaylist}
        />
      )}
    </div>
  );
}
