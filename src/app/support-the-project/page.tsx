import type { Metadata } from "next";
import SiteContainer from "../components/SiteContainer";
import SupportOptions from "./SupportOptions";

export const metadata: Metadata = {
  title: "Support the Project",
  description:
    "Support Upper Left Indie growth and help keep artist submissions free for local bands.",
  alternates: {
    canonical: "/support-the-project",
  },
  openGraph: {
    title: "Support the Project | Upper Left Indie",
    description:
      "Support Upper Left Indie growth and help keep artist submissions free for local bands.",
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
            Upper Left Indie is independently run and community supported. Your
            support helps expand our playlists to platforms like Tidal, Apple
            Music, and YouTube, and helps keep artist submissions open and free
            for local bands.
          </p>
        </div>

        <SupportOptions />
      </SiteContainer>
    </section>
  );
}
