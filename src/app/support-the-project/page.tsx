import type { Metadata } from "next";
import SiteContainer from "../components/SiteContainer";
import SupportOptions from "./SupportOptions";

export const metadata: Metadata = {
  title: "Support the Project",
  description:
    "Simple ways to support Upper Left Indie and help keep Northwest artist submissions free.",
  alternates: {
    canonical: "/support-the-project",
  },
  openGraph: {
    title: "Support the Project | Upper Left Indie",
    description:
      "Simple ways to support Upper Left Indie and help keep Northwest artist submissions free.",
    url: "/support-the-project",
  },
};

export default function SupportPage() {
  return (
    <section className="py-14 md:py-20">
      <SiteContainer>
        <p className="mb-4 text-sm font-black uppercase tracking-[0.26em] text-clay">
          Tip jar
        </p>
        <div className="mb-10 max-w-3xl">
          <h1 className="text-4xl font-black leading-tight text-ink md:text-6xl">
            Support the Project
          </h1>
          <p className="mt-6 text-lg leading-8 text-ink/70">
            Upper Left Indie is independently run and community supported. If
            the playlist has helped you find a new favorite band, or if you just
            want to help keep submissions free, here are a few simple ways to
            chip in.
          </p>
        </div>

        <SupportOptions />
      </SiteContainer>
    </section>
  );
}
