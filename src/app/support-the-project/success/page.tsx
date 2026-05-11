import Link from "next/link";
import type { Metadata } from "next";
import SiteContainer from "../../components/SiteContainer";

export const metadata: Metadata = {
  title: "Thanks for Supporting the Project",
  description: "Thank you for supporting Upper Left Indie.",
  alternates: {
    canonical: "/support-the-project/success",
  },
};

export default function SupportSuccessPage() {
  return (
    <section className="py-20 md:py-28">
      <SiteContainer>
        <div className="mx-auto max-w-3xl rounded-md border border-ink/10 bg-paper/80 p-8 shadow-soft md:p-10">
          <p className="mb-4 text-sm font-black uppercase tracking-[0.26em] text-clay">
            Thank you
          </p>
          <h1 className="text-4xl font-black leading-tight text-ink md:text-5xl">
            Thanks for supporting Upper Left Indie.
          </h1>
          <p className="mt-5 text-lg leading-8 text-ink/70">
            Your support helps keep submissions free and gives a little more room
            for playlist digging, artist features, writing, photography, and local
            Northwest music projects.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="rounded-full bg-ink px-6 py-3 text-center text-xs font-bold uppercase tracking-[0.14em] text-paper transition hover:bg-clay"
            >
              Back home
            </Link>
            <Link
              href="/submit"
              className="rounded-full border border-ink/15 px-6 py-3 text-center text-xs font-bold uppercase tracking-[0.14em] text-ink transition hover:border-clay hover:text-clay"
            >
              Submit music
            </Link>
          </div>
        </div>
      </SiteContainer>
    </section>
  );
}
