"use client";

import type { ReactNode } from "react";

/**
 * Tag — Figma component set 14:45.
 *
 * Used for the region, genre and sort filters. Selection is carried by fill
 * AND border (never colour alone), and the control keeps a 44px height so it
 * stays a valid touch target.
 */
const base =
  "inline-flex h-11 shrink-0 items-center justify-center rounded-full border-[1.5px] px-3.5 type-label-m transition";

const selectedClasses = "border-inverse bg-inverse text-on-inverse";
const unselectedClasses =
  "border-subtle bg-surface text-secondary hover:border-accent-solid hover:text-accent";

export function Tag({
  children,
  selected = false,
  onClick,
  className = "",
}: {
  children: ReactNode;
  selected?: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`${base} ${selected ? selectedClasses : unselectedClasses} ${className}`}
    >
      {children}
    </button>
  );
}
