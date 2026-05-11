import Link from "next/link";

export const metadata = {
  title: "Northwest Music Notes",
  description:
    "Notes, interviews, and discoveries from Upper Left Indie, a local Northwest independent music curator.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "Northwest Music Notes | Upper Left Indie",
    description:
      "Local Northwest music notes, interviews, and discoveries from Upper Left Indie.",
    url: "/blog",
  },
};

export default function BlogPage() {
  return (
    <section className="px-6 py-20 md:px-10 md:py-28">
      <div className="mx-auto max-w-4xl">
        <p className="mb-4 text-sm font-black uppercase tracking-[0.26em] text-clay">
          Blog
        </p>
        <h1 className="text-5xl font-black leading-tight text-ink md:text-7xl">
          Coming soon.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-ink/70">
          Notes, interviews, and Northwest music discoveries are on the way.
        </p>
        <div className="mt-14 border-t border-ink/10 pt-6">
          <p className="max-w-2xl text-sm leading-6 text-ink/60">
            Upper Left Indie is independently run and community supported. Tips
            help keep submissions free and help us spend more time supporting
            underheard Northwest artists.{" "}
            <Link
              href="/support-the-project"
              className="font-bold text-ink underline decoration-clay underline-offset-4"
            >
              Support the project
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
} 
