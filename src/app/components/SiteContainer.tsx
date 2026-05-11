import type { ReactNode } from "react";

type SiteContainerSize = "site" | "medium" | "narrow";

type SiteContainerProps = {
  children: ReactNode;
  className?: string;
  size?: SiteContainerSize;
};

const sizeClasses: Record<SiteContainerSize, string> = {
  site: "max-w-6xl",
  medium: "max-w-4xl",
  narrow: "max-w-3xl",
};

export default function SiteContainer({
  children,
  className = "",
  size = "site",
}: SiteContainerProps) {
  return (
    <div
      className={`mx-auto w-full ${sizeClasses[size]} px-4 sm:px-6 lg:px-8 ${className}`}
    >
      {children}
    </div>
  );
}
