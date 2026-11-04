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
  song_link: string;
  bandcamp_link?: string | null;
  social_link?: string | null;
  notes?: string | null;
  active_playlist_added_at?: string | null;
  replied_at?: string | null;
  reply_subject?: string | null;
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

export type TrackRating = 1 | 2 | 3;

export type ActivePlaylistTrack = PlaylistTrack & { rating: TrackRating };

export type Tab = "submissions" | "playlist" | "archive";

export type ReplyDraft = {
  isOpen: boolean;
  subject: string;
  message: string;
  aiDraftId?: string;
  aiRating?: -1 | 0 | 1;
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
