/**
 * One genre taxonomy for the whole product.
 *
 * The submission form has always offered this list; the artist directory used
 * to compete with it by falling back to scraped tags and then to regex
 * inference over bio text. The scraper writes these same labels, so the list
 * now serves both surfaces.
 */
export const genreOptions = [
  { label: "Alternative", value: "alternative" },
  { label: "Ambient", value: "ambient" },
  { label: "Americana", value: "americana" },
  { label: "Country / Alt-Country", value: "country-alt-country" },
  { label: "Electronic", value: "electronic" },
  { label: "Emo", value: "emo" },
  { label: "Experimental", value: "experimental" },
  { label: "Folk", value: "folk" },
  { label: "Garage Rock", value: "garage-rock" },
  { label: "Hardcore", value: "hardcore" },
  { label: "Hip-hop / Rap", value: "hip-hop-rap" },
  { label: "Indie Folk", value: "indie-folk" },
  { label: "Indie Pop", value: "indie-pop" },
  { label: "Indie Rock", value: "indie-rock" },
  { label: "Jazz", value: "jazz" },
  { label: "Metal", value: "metal" },
  { label: "New Wave / Synthpop", value: "new-wave-synthpop" },
  { label: "Noise", value: "noise" },
  { label: "Pop", value: "pop" },
  { label: "Post-Rock", value: "post-rock" },
  { label: "Post-punk", value: "post-punk" },
  { label: "Psych / Psychedelic", value: "psych-psychedelic" },
  { label: "Punk", value: "punk" },
  { label: "R&B / Soul", value: "r-and-b-soul" },
  { label: "Rock", value: "rock" },
  { label: "Shoegaze / Dream Pop", value: "shoegaze-dream-pop" },
  { label: "Singer-songwriter", value: "singer-songwriter" },
  { label: "World / Global", value: "world-global" },
  { label: "Other", value: "other" },
] as const;

export function getGenreLabel(value: string) {
  return (
    genreOptions.find((option) => option.value === value)?.label || "Not provided"
  );
}
