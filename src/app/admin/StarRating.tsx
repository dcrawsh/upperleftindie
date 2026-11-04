"use client";

import { FiStar } from "react-icons/fi";
import type { TrackRating } from "./types";

const ratings: TrackRating[] = [1, 2, 3];

function starLabel(rating: TrackRating) {
  return `${rating} ${rating === 1 ? "star" : "stars"}`;
}

/** The 1-3 star curator rating used on the playlist and the acceptance draft. */
export function StarRating({
  value,
  label,
  disabled = false,
  onChange,
}: {
  value: TrackRating;
  label: string;
  disabled?: boolean;
  onChange: (rating: TrackRating) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex items-center gap-0.5">
      {ratings.map((rating) => {
        const isFilled = rating <= value;

        return (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            disabled={disabled}
            aria-pressed={rating === value}
            aria-label={starLabel(rating)}
            title={starLabel(rating)}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition hover:text-gold disabled:cursor-not-allowed disabled:opacity-50 ${
              isFilled ? "text-gold" : "text-ink/25"
            }`}
          >
            <FiStar size={18} className={isFilled ? "fill-current" : ""} />
          </button>
        );
      })}
    </div>
  );
}
