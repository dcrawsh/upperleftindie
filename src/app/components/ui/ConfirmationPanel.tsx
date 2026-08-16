import type { ReactNode } from "react";
import { FaCheckCircle } from "react-icons/fa";

/**
 * Confirmation Panel — Figma component 16:29 / frame 28:213.
 *
 * Success is a state, not a sentence appended under the button: it says what
 * happens next, recaps what was sent and what was consented to, and offers the
 * next useful action.
 */
export default function ConfirmationPanel({
  badge,
  title,
  description,
  recapTitle,
  recap,
  actions,
  footnote,
}: {
  badge: string;
  title: ReactNode;
  description: ReactNode;
  recapTitle?: string;
  recap?: Array<{ label: string; value: ReactNode }>;
  actions?: ReactNode;
  footnote?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-card border-2 border-success bg-surface p-6 md:p-10">
      <p className="flex items-center gap-2 type-label-m text-success">
        <FaCheckCircle size={20} aria-hidden="true" />
        {badge}
      </p>
      <h2 className="type-display-l text-primary">{title}</h2>
      <p className="max-w-measure type-body-l text-secondary">{description}</p>

      {recap && recap.length > 0 ? (
        <div className="flex flex-col gap-2.5 rounded-field bg-sunken px-5 py-5">
          {recapTitle ? (
            <p className="type-label-m text-tertiary">{recapTitle}</p>
          ) : null}
          <dl className="flex flex-col gap-2.5">
            {recap.map((row) => (
              <div key={row.label} className="flex flex-col gap-1 sm:flex-row sm:gap-4">
                <dt className="type-body-s font-semibold text-primary sm:w-32 sm:shrink-0">
                  {row.label}
                </dt>
                <dd className="min-w-0 type-body-s text-secondary">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      {actions ? <div className="flex flex-col gap-3 pt-2 sm:flex-row">{actions}</div> : null}
      {footnote ? <p className="type-body-s text-tertiary">{footnote}</p> : null}
    </div>
  );
}
