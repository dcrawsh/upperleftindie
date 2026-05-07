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
      </div>
    </section>
  );
} 
