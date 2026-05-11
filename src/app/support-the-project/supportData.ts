export type SupportOptionKey =
  | "buy-a-coffee"
  | "support-playlist"
  | "keep-submissions-free"
  | "support-upper-left-indie";

export type SupportOption = {
  key: SupportOptionKey;
  title: string;
  amount: string;
  description: string;
};

export const supportOptions: SupportOption[] = [
  {
    key: "buy-a-coffee",
    title: "Buy a Coffee",
    amount: "$3",
    description: "Just a small thank you tip.",
  },
  {
    key: "support-playlist",
    title: "Support the Playlist",
    amount: "$5",
    description:
      "Helps cover the site, playlist, and time spent digging up underheard bands.",
  },
  {
    key: "keep-submissions-free",
    title: "Support Growth / Keep Submissions Free",
    amount: "$10",
    description:
      "Expand our playlists to other platforms like Tidal, Apple Music, and YouTube. Helps keep artist submissions open and free for local bands.",
  },
  {
    key: "support-upper-left-indie",
    title: "Support the Project",
    amount: "$20",
    description:
      "Helps fund artist features, merch experiments, photography, writing, and future local projects.",
  },
];
