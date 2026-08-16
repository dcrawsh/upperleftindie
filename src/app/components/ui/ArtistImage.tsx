import Image from "next/image";
import { getArtistInitials } from "../../../lib/artists";

/**
 * ArtistImage — Figma component set 46:310.
 *
 * One media slot with two behaviours: a real image, or an initials fallback for
 * the artists with no scraped artwork. Both variants are the same fixed 1:1
 * square with the same radius, clipping and centring, so swapping between them
 * never shifts card content. The slot must never hug its contents — an earlier
 * revision of the Figma component did, and collapsed the fallback into a narrow
 * text-sized pill.
 */
export default function ArtistImage({
  name,
  src,
  size = 72,
  className = "",
}: {
  name: string;
  src?: string;
  size?: number;
  className?: string;
}) {
  const box = { width: size, height: size };

  return (
    <div
      style={box}
      className={`relative shrink-0 grow-0 overflow-hidden rounded-field bg-inverse ${className}`}
    >
      {src ? (
        <Image
          src={src}
          alt=""
          width={size * 2}
          height={size * 2}
          className="h-full w-full object-cover"
        />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center text-center type-heading-m text-on-inverse"
          aria-hidden="true"
        >
          {getArtistInitials(name)}
        </span>
      )}
    </div>
  );
}
