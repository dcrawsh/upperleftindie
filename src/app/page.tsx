
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <section className="flex flex-col items-center justify-center px-6 py-16 md:px-10 md:py-24">
      <div className="flex flex-col items-center w-full max-w-3xl">
        <Image
          src="/Upperleftindie.png"
          alt="Upper Left Indie Hero"
          width={800}
          height={800}
          priority
          className="w-full max-w-xl h-auto object-contain mb-8 rounded-lg shadow-xl"
        />
        <h1 className="sr-only">Upper Left Indie</h1>
        <p className="mb-8 text-center text-2xl md:text-3xl font-semibold text-ink/90">
          A local Northwest music curator supporting underserved and under-heard
          independent artists.
        </p>
        <div className="mb-8 flex flex-col gap-3 w-full sm:flex-row sm:justify-center">
          <Link
            href="/submit"
            className="rounded-full bg-ink px-7 py-4 text-center text-sm font-bold uppercase tracking-[0.14em] text-paper transition hover:bg-clay"
          >
            Submit Music
          </Link>
          <a
            href="https://open.spotify.com/playlist/3LTI227By7Wt7hGs3mz5hF?si=b0900f7372be4492"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-ink/20 px-7 py-4 text-center text-sm font-bold uppercase tracking-[0.14em] text-ink transition hover:border-ink hover:bg-paper"
          >
            Listen on Spotify
          </a>
        </div>
        <div className="w-full flex justify-center">
          <iframe
            src="https://open.spotify.com/embed/playlist/3LTI227By7Wt7hGs3mz5hF?utm_source=generator"
            width="100%"
            height="380"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="rounded-lg shadow-lg border border-ink/10"
            title="Spotify Playlist Embed"
          ></iframe>
        </div>
        <section className="mt-10 w-full border-t border-ink/10 pt-8">
          <div className="flex flex-col gap-5 rounded-md border border-ink/10 bg-paper/75 p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <Image
                src="/bandcamp-logo.svg"
                alt="Bandcamp"
                width={127}
                height={20}
                className="h-5 w-auto"
              />
              <h2 className="text-xl font-bold text-ink">
                Support the artists you hear here
              </h2>
              <p className="max-w-xl text-sm leading-6 text-ink/65">
                Listening helps. Buying a download, record, tape, shirt, or
                weird little run of stickers helps even more.
              </p>
            </div>
            <a
              href="https://bandcamp.com/discover"
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-ink px-6 py-3 text-center text-xs font-bold uppercase tracking-[0.14em] text-paper transition hover:bg-clay"
            >
              Dig on Bandcamp
            </a>
          </div>
        </section>
      </div>
    </section>
  );
}
