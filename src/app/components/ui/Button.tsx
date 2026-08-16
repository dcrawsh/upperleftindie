import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

/**
 * Button — Figma component set 11:38.
 *
 * Emphasis carries the CTA hierarchy the redesign depends on (principle P4):
 * primary is the single most important action on a screen, secondary is a real
 * alternative, and quiet is deliberately subordinate so the project-support ask
 * can never compete with the artist ask.
 *
 * Size is padding + type only, not a third variant axis.
 */
export type ButtonEmphasis = "primary" | "secondary" | "quiet";
export type ButtonSize = "sm" | "md" | "lg";

const emphasisClasses: Record<ButtonEmphasis, string> = {
  primary:
    "bg-inverse text-on-inverse hover:bg-accent-hover active:bg-accent-solid",
  secondary:
    "border-[1.5px] border-strong text-primary hover:border-accent-solid hover:bg-accent-soft hover:text-accent active:bg-accent-soft active:text-accent",
  quiet:
    "text-secondary hover:bg-accent-soft hover:text-accent active:bg-accent-soft active:text-accent",
};

const sizeClasses: Record<ButtonSize, string> = {
  // min-h-11 keeps every control at a 44px touch target (requirement A10)
  // even at the compact size Figma draws inside cards.
  sm: "min-h-11 px-3.5 py-2.5 type-label-s",
  md: "min-h-11 px-6 py-3.5 type-button",
  lg: "min-h-11 px-[26px] py-4 type-button",
};

function classesFor(
  emphasis: ButtonEmphasis,
  size: ButtonSize,
  fullWidth: boolean,
  className: string
) {
  return [
    "inline-flex items-center justify-center gap-2 rounded-full text-center transition",
    "disabled:cursor-not-allowed disabled:opacity-40",
    emphasisClasses[emphasis],
    sizeClasses[size],
    fullWidth ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

type SharedProps = {
  emphasis?: ButtonEmphasis;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
};

type ButtonProps = SharedProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

export function Button({
  emphasis = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={classesFor(emphasis, size, fullWidth, className)}
      {...rest}
    >
      {children}
    </button>
  );
}

type ButtonLinkProps = SharedProps & {
  href: string;
  external?: boolean;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children" | "href">;

export function ButtonLink({
  emphasis = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  children,
  href,
  external = false,
  ...rest
}: ButtonLinkProps) {
  const classes = classesFor(emphasis, size, fullWidth, className);

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={classes}
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes} {...rest}>
      {children}
    </Link>
  );
}
