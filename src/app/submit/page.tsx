import SubmissionForm from "../components/SubmissionForm";
import Link from "next/link";
import SiteContainer from "../components/SiteContainer";

export const metadata = {
  title: "Submit Northwest Music",
  description:
    "Submit music from a local Northwest independent artist for Upper Left Indie playlist consideration.",
  alternates: {
    canonical: "/submit",
  },
  openGraph: {
    title: "Submit Northwest Music | Upper Left Indie",
    description:
      "Share a local Northwest independent artist, song, or project that deserves more ears.",
    url: "/submit",
  },
};

export default function SubmitPage() {
  return (
    <section className="py-14 md:py-20">
      <SiteContainer className="grid gap-10 lg:grid-cols-[0.8fr_1fr] lg:items-start">
        <div>
          <p className="mb-4 text-sm font-black uppercase tracking-[0.26em] text-clay">
            Submissions
          </p>
          <h1 className="text-4xl font-black leading-tight text-ink md:text-6xl">
            Send music from the upper left.
          </h1>
          <p className="mt-6 text-lg leading-8 text-ink/70">
            Share an artist, track, or project that deserves more ears across Oregon,
            Washington, Idaho, Alaska, British Columbia, and the wider Northwest orbit.
          </p>
        </div>

        <div className="space-y-6">
          <SubmissionForm />

          <aside className="rounded-md border border-ink/10 bg-paper/60 p-5">
            <h2 className="text-lg font-black text-ink">
              Help keep submissions free
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink/65">
              Upper Left Indie is independently run and community supported.
              Tips help keep submissions free and help us spend more time
              supporting underheard Northwest artists.
            </p>
            <Link
              href="/support-the-project"
              className="mt-4 inline-block rounded-full border border-ink/15 px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-ink transition hover:border-clay hover:text-clay"
            >
              Support the project
            </Link>
          </aside>
        </div>
      </SiteContainer>
    </section>
  );
}
