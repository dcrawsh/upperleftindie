/**
 * Tier keys map to Stripe price IDs in `api/support/checkout` and must not
 * change. The titles do change: "Support the Playlist" collided with the
 * header's music links, and "Support the Project" was the same name as the page
 * it sat on, so neither told a visitor what it did.
 */
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
    title: "Buy me a coffee",
    amount: "$3",
    description: "A small thank you. No obligation attached.",
  },
  {
    key: "support-playlist",
    title: "Keep the playlist running",
    amount: "$5",
    description:
      "Covers the site, the playlist, and the hours spent digging up underheard bands.",
  },
  {
    key: "keep-submissions-free",
    title: "Keep submissions free",
    amount: "$10",
    description:
      "Means no artist ever has to pay to be heard here, and helps expand the playlists to other platforms.",
  },
  {
    key: "support-upper-left-indie",
    title: "Fund the next feature",
    amount: "$20",
    description:
      "Artist features, photography and writing — the work that takes real time.",
  },
];
