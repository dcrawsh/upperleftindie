export type SubmissionStatus = "pending" | "added" | "rejected" | "archived";

export type Submission = {
  id: string;
  created_at: string;
  status: SubmissionStatus;
  artist_name: string;
  contact_name: string;
  email: string;
  city: string;
  region: string;
  genre: string;
  song_link: string | null;
  track_title?: string | null;
  bandcamp_link?: string | null;
  social_link?: string | null;
  notes?: string | null;
  active_playlist_added_at?: string | null;
  replied_at?: string | null;
  reply_subject?: string | null;
  audio_storage_path?: string | null;
  audio_original_filename?: string | null;
  audio_size_bytes?: number | null;
  audio_upload_status?: "uploaded" | "published" | "removed" | null;
  audio_expires_at?: string | null;
  audio_deleted_at?: string | null;
  radio_rights_accepted_at?: string | null;
  radio_published_at?: string | null;
};

export type PlaylistTrack = {
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

export type TrackRating = 1 | 2 | 3 | 4 | 5;

export type AiReplyFeedbackTag =
  | "insightful-specific"
  | "right-tone"
  | "concise"
  | "ready-to-send"
  | "too-generic"
  | "repeats-submission"
  | "invented-details"
  | "missed-detail"
  | "wrong-tone"
  | "too-promotional"
  | "too-long"
  | "awkward-wording";

export type ActivePlaylistTrack = PlaylistTrack & { rating: TrackRating };

export type Tab = "submissions" | "mail" | "playlist" | "archive";

export type MailboxAddress = {
  name: string;
  address: string;
};

export type MailboxMessageSummary = {
  uid: number;
  subject: string;
  from: MailboxAddress | null;
  date: string;
  unread: boolean;
  answered: boolean;
  hasAttachments: boolean;
};

export type MailboxMessage = MailboxMessageSummary & {
  replyTo: MailboxAddress | null;
  to: MailboxAddress[];
  text: string;
  attachments: Array<{
    filename: string;
    contentType: string;
    size: number;
  }>;
  isTruncated: boolean;
};

export type ReplyDraft = {
  isOpen: boolean;
  subject: string;
  message: string;
  aiDraftId?: string;
  aiRating?: -1 | 0 | 1;
  aiFeedbackTags?: AiReplyFeedbackTag[];
  /** Playlist rating applied when the acceptance is sent; 3 stars when unset. */
  trackRating?: TrackRating;
};

export type PreviewState = {
  previewUrl: string;
  isMissing: boolean;
};

export type StoredAdminSession = {
  token: string;
  expiresAt: number;
};

/** Authenticated fetch injected into the tab components and hooks. */
export type AdminFetch = <T>(path: string, init?: RequestInit) => Promise<T>;
