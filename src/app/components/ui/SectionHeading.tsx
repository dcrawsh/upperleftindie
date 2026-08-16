import type { ReactNode } from "react";

/**
 * Section header — the eyebrow / headline / standfirst pattern every page in
 * the Figma file repeats. Deliberately not a "card": it only owns type.
 */
export default function SectionHeading({
  eyebrow,
  title,
  description,
  as: Title = "h2",
  size = "section",
  action,
  className = "",
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  as?: "h1" | "h2" | "h3";
  size?: "page" | "section";
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between ${className}`}>
      <div className="flex min-w-0 flex-col gap-3">
        {eyebrow ? <p className="type-label-m text-accent">{eyebrow}</p> : null}
        <Title
          className={
            size === "page"
              ? "type-display-xl text-primary"
              : "type-display-l text-primary"
          }
        >
          {title}
        </Title>
        {description ? (
          <p className="max-w-measure type-body-l text-secondary">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
