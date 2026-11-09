"use client";

import { FaSpotify } from "react-icons/fa";
import {
  FiAlertTriangle,
  FiCheck,
  FiCpu,
  FiExternalLink,
  FiMail,
  FiPause,
  FiPlay,
  FiRefreshCw,
  FiThumbsDown,
  FiThumbsUp,
  FiX,
} from "react-icons/fi";
import { StarRating } from "./StarRating";
import { formatDate, getSpotifyAppTrackUrl } from "./helpers";
import type {
  AiReplyFeedbackTag,
  PreviewState,
  ReplyDraft,
  Submission,
  SubmissionStatus,
} from "./types";

const STATUS_FILTERS = ["pending", "added", "rejected", "all"] as const;

const POSITIVE_FEEDBACK_TAGS: Array<{
  value: AiReplyFeedbackTag;
  label: string;
}> = [
  { value: "insightful-specific", label: "Insightful / specific" },
  { value: "right-tone", label: "Right tone" },
  { value: "concise", label: "Concise" },
  { value: "ready-to-send", label: "Ready to send" },
];

const NEGATIVE_FEEDBACK_TAGS: Array<{
  value: AiReplyFeedbackTag;
  label: string;
}> = [
  { value: "too-generic", label: "Too generic" },
  { value: "repeats-submission", label: "Repeats submission" },
  { value: "invented-details", label: "Invented details" },
  { value: "missed-detail", label: "Missed key detail" },
  { value: "wrong-tone", label: "Wrong tone" },
  { value: "too-promotional", label: "Too promotional" },
  { value: "too-long", label: "Too long" },
  { value: "awkward-wording", label: "Awkward wording" },
];

type SubmissionsTabProps = {
  submissions: Submission[];
  statusFilter: SubmissionStatus | "all";
  setStatusFilter: (status: SubmissionStatus | "all") => void;
  isLoading: boolean;
  workingId: string;
  onRefresh: () => void;
  getReplyDraft: (submission: Submission) => ReplyDraft;
  updateReplyDraft: (
    submission: Submission,
    values: Partial<ReplyDraft>
  ) => void;
  onToggleReplyDraft: (submission: Submission) => void;
  onAddToPlaylist: (submission: Submission) => void;
  onPublishToRadio: (submission: Submission) => void;
  onReject: (id: string) => void;
  onGenerateReply: (submission: Submission) => void;
  onRateDraft: (
    submission: Submission,
    rating: -1 | 1,
    feedbackTags?: AiReplyFeedbackTag[]
  ) => void;
  onSendReply: (submission: Submission) => void;
  onTogglePreview: (submission: Submission) => void;
  onToggleStreamingPreview: (submission: Submission) => void;
  currentPreviewTrackUri: string;
  isPreviewPlaying: boolean;
  previewsByKey: Record<string, PreviewState>;
  loadingPreviewKey: string;
};

function SubmissionCard({
  submission,
  workingId,
  getReplyDraft,
  updateReplyDraft,
  onToggleReplyDraft,
  onAddToPlaylist,
  onPublishToRadio,
  onReject,
  onGenerateReply,
  onRateDraft,
  onSendReply,
  onTogglePreview,
  onToggleStreamingPreview,
  currentPreviewTrackUri,
  isPreviewPlaying,
  previewsByKey,
  loadingPreviewKey,
}: { submission: Submission } & Omit<
  SubmissionsTabProps,
  "submissions" | "statusFilter" | "setStatusFilter" | "isLoading" | "onRefresh"
>) {
  const replyDraft = getReplyDraft(submission);
  const replyWorkingId = `reply-${submission.id}`;
  const draftWorkingId = `draft-${submission.id}`;
  const ratingWorkingId = `rating-${submission.id}`;
  const hasReplied = Boolean(submission.replied_at);
  const isOnPlaylist = Boolean(submission.active_playlist_added_at);
  const hasSpotifyLink = Boolean(submission.song_link);
  const hasRadioAudio = Boolean(
    submission.audio_storage_path &&
    submission.audio_upload_status !== "removed"
  );
  const isOnRadio = Boolean(submission.radio_published_at);
  const isInReview = submission.status === "pending";
  const canAccept = isInReview && !hasReplied;
  const canDraftAcceptance = canAccept && hasSpotifyLink;
  // The acceptance adds the track itself, so a replied submission that never
  // reached the playlist is a failed insert waiting to be retried.
  const needsPlaylistRepair =
    isInReview && hasReplied && hasSpotifyLink && !isOnPlaylist;
  const needsRadioRepair =
    isInReview && hasReplied && hasRadioAudio && !isOnRadio;
  const previewKey = `submission:${submission.id}`;
  const previewState = previewsByKey[previewKey];
  const isPreviewLoading = loadingPreviewKey === previewKey;
  const isCurrentPreview =
    currentPreviewTrackUri === previewKey && isPreviewPlaying;
  const streamingPreviewKey = `submission-stream:${submission.id}`;
  const streamingPreviewState = previewsByKey[streamingPreviewKey];
  const isStreamingPreviewLoading = loadingPreviewKey === streamingPreviewKey;
  const isCurrentStreamingPreview =
    currentPreviewTrackUri === streamingPreviewKey && isPreviewPlaying;
  const feedbackTags =
    replyDraft.aiRating === 1
      ? POSITIVE_FEEDBACK_TAGS
      : replyDraft.aiRating === -1
        ? NEGATIVE_FEEDBACK_TAGS
        : [];

  function rateDraft(rating: -1 | 1) {
    onRateDraft(
      submission,
      rating,
      replyDraft.aiRating === rating ? (replyDraft.aiFeedbackTags ?? []) : []
    );
  }

  function toggleFeedbackTag(tag: AiReplyFeedbackTag) {
    if (replyDraft.aiRating !== 1 && replyDraft.aiRating !== -1) return;

    const current = replyDraft.aiFeedbackTags ?? [];
    const next = current.includes(tag)
      ? current.filter((value) => value !== tag)
      : [...current, tag];

    onRateDraft(submission, replyDraft.aiRating, next);
  }

  return (
    <article
      className={`rounded-md border p-5 shadow-soft ${
        needsPlaylistRepair || needsRadioRepair
          ? "border-clay/40 bg-clay/5"
          : hasReplied
            ? "border-moss/40 bg-moss/5"
            : "border-ink/10 bg-paper"
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink/45">
              {formatDate(submission.created_at)} / {submission.status}
              {submission.replied_at
                ? ` / replied ${formatDate(submission.replied_at)}`
                : ""}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-black text-ink">
                {submission.artist_name}
              </h2>
              {needsPlaylistRepair || needsRadioRepair ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-clay px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-paper">
                  <FiAlertTriangle size={13} />
                  Replied / Publication Needs Repair
                </span>
              ) : hasReplied ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-moss px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-paper">
                  <FiMail size={13} />
                  Replied
                </span>
              ) : null}
            </div>
            <p className="text-sm leading-6 text-ink/65">
              {submission.genre || "No genre"} / {submission.city || "No city"}{" "}
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
          {submission.artist_bio ? (
            <div className="max-w-3xl rounded-md border border-moss/30 bg-moss/5 p-3">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-moss">
                Artist-approved radio bio
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-ink/70">
                {submission.artist_bio}
              </p>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => onTogglePreview(submission)}
                disabled={isPreviewLoading || previewState?.isMissing}
                title={
                  hasRadioAudio
                    ? "Play the full artist-submitted MP3 from private storage"
                    : "Find and play a Spotify or Apple Music preview"
                }
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
                {hasRadioAudio
                  ? isPreviewLoading
                    ? "Loading submitted MP3..."
                    : previewState?.isMissing
                      ? "MP3 unavailable"
                      : isCurrentPreview
                        ? "Pause submitted MP3"
                        : "Play submitted MP3"
                  : isPreviewLoading
                    ? "Finding..."
                    : previewState?.isMissing
                      ? "No Preview"
                      : isCurrentPreview
                        ? "Pause"
                        : previewState?.previewUrl
                          ? "Preview"
                          : "Find Preview"}
              </button>
              {hasRadioAudio ? (
                <span className="pl-2 text-xs text-ink/45">
                  Full private upload · review before accepting
                </span>
              ) : null}
            </div>
            {hasRadioAudio && hasSpotifyLink ? (
              <button
                type="button"
                onClick={() => onToggleStreamingPreview(submission)}
                disabled={
                  isStreamingPreviewLoading || streamingPreviewState?.isMissing
                }
                title="Play the Spotify preview or its Apple Music fallback"
                className={`inline-flex items-center gap-2 self-start rounded-full border px-4 py-2 text-sm font-bold transition ${
                  streamingPreviewState?.isMissing
                    ? "border-ink/10 text-ink/35"
                    : "border-ink/15 text-ink hover:border-moss hover:text-moss"
                }`}
              >
                {isCurrentStreamingPreview ? (
                  <FiPause size={16} />
                ) : (
                  <FiPlay size={16} />
                )}
                {isStreamingPreviewLoading
                  ? "Finding streaming preview..."
                  : streamingPreviewState?.isMissing
                    ? "No streaming preview"
                    : isCurrentStreamingPreview
                      ? "Pause streaming preview"
                      : "Play streaming preview"}
              </button>
            ) : null}
            {submission.song_link ? (
              <a
                href={getSpotifyAppTrackUrl(submission.song_link)}
                className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-sm font-bold text-ink transition hover:border-green-700 hover:text-green-700"
              >
                <FaSpotify size={16} />
                Song
              </a>
            ) : null}
            {hasRadioAudio ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-sm font-bold text-ink">
                MP3 · {submission.audio_original_filename ?? "Uploaded track"}
              </span>
            ) : null}
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
            onClick={() => onToggleReplyDraft(submission)}
            className={`inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-bold uppercase tracking-[0.1em] transition ${
              hasReplied
                ? "border-moss/40 text-moss hover:border-ink hover:text-ink"
                : "border-ink/15 text-ink hover:border-clay hover:text-clay"
            }`}
          >
            <FiMail size={16} />
            {hasReplied ? "Replied" : "Reply"}
          </button>
          {needsPlaylistRepair ? (
            <button
              type="button"
              onClick={() => onAddToPlaylist(submission)}
              disabled={workingId === submission.id}
              className="inline-flex items-center gap-2 rounded-full bg-clay px-5 py-3 text-sm font-bold uppercase tracking-[0.1em] text-paper transition hover:bg-ink disabled:opacity-60"
            >
              <FiCheck size={16} />
              Add to Playlist
            </button>
          ) : canDraftAcceptance ? (
            <button
              type="button"
              onClick={() => onGenerateReply(submission)}
              disabled={
                workingId === submission.id || workingId === draftWorkingId
              }
              className="inline-flex items-center gap-2 rounded-full bg-moss px-5 py-3 text-sm font-bold uppercase tracking-[0.1em] text-paper transition hover:bg-ink disabled:opacity-60"
            >
              <FiCpu size={16} />
              {workingId === draftWorkingId
                ? "Drafting..."
                : "Draft Acceptance"}
            </button>
          ) : null}
          {needsRadioRepair ? (
            <button
              type="button"
              onClick={() => onPublishToRadio(submission)}
              disabled={workingId === `radio-${submission.id}`}
              className="inline-flex items-center gap-2 rounded-full bg-clay px-5 py-3 text-sm font-bold uppercase tracking-[0.1em] text-paper transition hover:bg-ink disabled:opacity-60"
            >
              <FiCheck size={16} />
              {workingId === `radio-${submission.id}`
                ? "Publishing..."
                : "Publish to Radio"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onReject(submission.id)}
            disabled={
              workingId === submission.id || workingId === draftWorkingId
            }
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
                updateReplyDraft(submission, { subject: event.target.value })
              }
              className="w-full rounded-md border border-ink/15 bg-white px-4 py-3 text-base font-normal text-ink outline-none transition focus:border-clay"
            />
          </label>
          <label className="block space-y-2 text-sm font-bold text-ink/70">
            Message
            <textarea
              value={replyDraft.message}
              onChange={(event) =>
                updateReplyDraft(submission, { message: event.target.value })
              }
              rows={7}
              placeholder={`Hey ${submission.contact_name || "there"},`}
              className="w-full rounded-md border border-ink/15 bg-white px-4 py-3 text-base font-normal leading-6 text-ink outline-none transition focus:border-clay"
            />
          </label>
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-ink/10 bg-white/60 p-3">
            <button
              type="button"
              onClick={() => onGenerateReply(submission)}
              disabled={!canDraftAcceptance || workingId === draftWorkingId}
              className="inline-flex items-center gap-2 rounded-full border border-clay/40 px-4 py-2 text-sm font-bold text-clay transition hover:border-ink hover:text-ink disabled:opacity-60"
            >
              <FiCpu size={16} />
              {workingId === draftWorkingId
                ? "Drafting..."
                : !canDraftAcceptance
                  ? "Acceptance Drafting Unavailable"
                  : replyDraft.aiDraftId
                    ? "Regenerate AI Draft"
                    : "Draft with AI"}
            </button>
            {replyDraft.aiDraftId ? (
              <>
                <span className="text-xs font-bold uppercase tracking-[0.1em] text-ink/45">
                  Training feedback
                </span>
                <button
                  type="button"
                  onClick={() => rateDraft(1)}
                  disabled={workingId === ratingWorkingId}
                  aria-pressed={replyDraft.aiRating === 1}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-bold transition disabled:opacity-60 ${
                    replyDraft.aiRating === 1
                      ? "border-moss bg-moss text-paper"
                      : "border-ink/15 text-ink hover:border-moss hover:text-moss"
                  }`}
                >
                  <FiThumbsUp size={15} />
                  Good
                </button>
                <button
                  type="button"
                  onClick={() => rateDraft(-1)}
                  disabled={workingId === ratingWorkingId}
                  aria-pressed={replyDraft.aiRating === -1}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-bold transition disabled:opacity-60 ${
                    replyDraft.aiRating === -1
                      ? "border-clay bg-clay text-paper"
                      : "border-ink/15 text-ink hover:border-clay hover:text-clay"
                  }`}
                >
                  <FiThumbsDown size={15} />
                  Needs Work
                </button>
                {feedbackTags.length ? (
                  <div className="basis-full border-t border-ink/10 pt-3">
                    <p className="text-xs font-bold uppercase tracking-[0.1em] text-ink/45">
                      {replyDraft.aiRating === 1
                        ? "What worked?"
                        : "What needs work?"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {feedbackTags.map((tag) => {
                        const isSelected = (
                          replyDraft.aiFeedbackTags ?? []
                        ).includes(tag.value);

                        return (
                          <button
                            key={tag.value}
                            type="button"
                            onClick={() => toggleFeedbackTag(tag.value)}
                            disabled={workingId === ratingWorkingId}
                            aria-pressed={isSelected}
                            className={`rounded-full border px-3 py-1.5 text-xs font-bold transition disabled:opacity-60 ${
                              isSelected
                                ? replyDraft.aiRating === 1
                                  ? "border-moss bg-moss/10 text-moss"
                                  : "border-clay bg-clay/10 text-clay"
                                : "border-ink/15 text-ink/60 hover:border-ink/40 hover:text-ink"
                            }`}
                          >
                            {tag.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <span className="text-xs leading-5 text-ink/50">
                {!isInReview
                  ? "This submission has left the review queue."
                  : !hasSpotifyLink
                    ? "Write the radio acceptance here. AI drafting currently uses Spotify playlist wording."
                    : isOnPlaylist
                      ? "The result fills the editor but never sends automatically."
                      : "The result fills the editor. Sending it adds the track to the playlist."}
              </span>
            )}
          </div>
          {canDraftAcceptance ? (
            <div className="flex flex-wrap items-center gap-3 rounded-md border border-ink/10 bg-white/60 p-3">
              <span className="text-xs font-bold uppercase tracking-[0.1em] text-ink/45">
                {hasSpotifyLink && hasRadioAudio
                  ? "Playlist + radio rating"
                  : hasRadioAudio
                    ? "Radio rating"
                    : "Playlist rating"}
              </span>
              <StarRating
                value={replyDraft.trackRating ?? 3}
                label={`Track rating for ${submission.artist_name}`}
                disabled={workingId === replyWorkingId}
                onChange={(trackRating) =>
                  updateReplyDraft(submission, { trackRating })
                }
              />
              <span className="text-xs leading-5 text-ink/50">
                {hasSpotifyLink && hasRadioAudio
                  ? "One shared rating for the playlist and Upper Left Radio."
                  : hasRadioAudio
                    ? "Sets its removal priority on Upper Left Radio."
                    : "Sets where the track lands when it joins the playlist."}
              </span>
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onSendReply(submission)}
              disabled={
                workingId === replyWorkingId || workingId === draftWorkingId
              }
              className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-bold uppercase tracking-[0.1em] text-paper transition hover:bg-clay disabled:opacity-60"
            >
              <FiMail size={16} />
              {canAccept
                ? hasSpotifyLink && hasRadioAudio
                  ? "Send + Publish Both"
                  : hasRadioAudio
                    ? "Send + Publish to Radio"
                    : "Send + Add to Playlist"
                : "Send"}
            </button>
            <button
              type="button"
              onClick={() => updateReplyDraft(submission, { isOpen: false })}
              className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-5 py-3 text-sm font-bold uppercase tracking-[0.1em] text-ink transition hover:border-clay hover:text-clay"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}

export function SubmissionsTab({
  submissions,
  statusFilter,
  setStatusFilter,
  isLoading,
  onRefresh,
  ...cardProps
}: SubmissionsTabProps) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((status) => (
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
          ))}
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-sm font-bold text-ink transition hover:border-clay hover:text-clay disabled:opacity-60"
        >
          <FiRefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="grid gap-4">
        {submissions.map((submission) => (
          <SubmissionCard
            key={submission.id}
            submission={submission}
            {...cardProps}
          />
        ))}
      </div>

      {!isLoading && submissions.length === 0 ? (
        <p className="rounded-md border border-ink/10 bg-paper/75 p-5 text-sm font-bold text-ink/60">
          No submissions in this view.
        </p>
      ) : null}
    </section>
  );
}
