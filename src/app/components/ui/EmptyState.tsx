import type { ReactNode } from "react";

/**
 * Empty State — Figma component 16:24.
 *
 * Fills the gap the audit found on /artists, where a filter that matched
 * nothing rendered a blank page with no explanation and no way back.
 */
export default function EmptyState({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border-[1.5px] border-dashed border-subtle bg-sunken px-6 py-12 text-center sm:px-8">
      <p className="type-heading-m text-primary">{title}</p>
      {description ? (
        <p className="max-w-measure type-body-m text-secondary">{description}</p>
      ) : null}
      {action}
    </div>
  );
}
