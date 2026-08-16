import type { ReactNode } from "react";

/**
 * Page container. Widths and gutters come from the Figma `Layout` variable
 * modes: 358/16 at mobile 390, 786/24 at tablet 834, 1200/32 at desktop 1440.
 */
type SiteContainerSize = "site" | "medium" | "narrow";

type SiteContainerProps = {
  children: ReactNode;
  className?: string;
  size?: SiteContainerSize;
};

const sizeClasses: Record<SiteContainerSize, string> = {
  site: "max-w-content",
  medium: "max-w-4xl",
  narrow: "max-w-3xl",
};

export default function SiteContainer({
  children,
  className = "",
  size = "site",
}: SiteContainerProps) {
  // The gutter sits outside the max width so the content box is exactly
  // `layout/max-content` at each mode: 358 at 390, 786 at 834, 1200 at 1440.
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className={`mx-auto w-full ${sizeClasses[size]} ${className}`}>
        {children}
      </div>
    </div>
  );
}
