import Link from "next/link";
import Image from "next/image";
import SiteContainer from "./components/SiteContainer";

export default function Home() {
  return (
    <section className="py-16 md:py-24">
      <SiteContainer>
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center">
          <Image
            src="/Upperleftindie.png"
            alt="Upper Left Indie Hero"
            width={800}
            height={800}
            priority
            className="mb-8 h-auto w-full max-w-xl rounded-lg object-contain shadow-xl"
          />
          <h1 className="sr-only">Upper Left Indie</h1>
          <p className="mb-8 text-center text-2xl font-semibold text-ink/90 md:text-3xl">
            A local Northwest music curator supporting underserved and under-heard
            independent artists.
          </p>
          <div className="mb-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
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
          <div className="flex w-full justify-center">
            <iframe
              src="https://open.spotify.com/embed/playlist/3LTI227By7Wt7hGs3mz5hF?utm_source=generator"
              width="100%"
              height="380"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="rounded-lg border border-ink/10 shadow-lg"
              title="Spotify Playlist Embed"
            ></iframe>
          </div>
        </div>

        <div className="mx-auto mt-10 w-full max-w-4xl space-y-8 border-t border-ink/10 pt-8">
          <section>
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
              <Link
                href="/artists"
                className="rounded-full bg-ink px-6 py-3 text-center text-xs font-bold uppercase tracking-[0.14em] text-paper transition hover:bg-clay"
              >
                Support Artists
              </Link>
            </div>
          </section>

          <section className="border-t border-ink/10 pt-8">
            <div className="flex flex-col gap-5 rounded-md border border-ink/10 bg-paper/60 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <h2 className="text-lg font-black text-ink">
                  Support the Project
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-ink/65">
                  Upper Left Indie is independently run and community supported.
                  Tips help keep submissions free and help us spend more time
                  supporting underheard Northwest artists.
                </p>
              </div>
              <Link
                href="/support-the-project"
                className="rounded-full border border-ink/15 px-6 py-3 text-center text-xs font-bold uppercase tracking-[0.14em] text-ink transition hover:border-clay hover:text-clay"
              >
                Chip in
              </Link>
            </div>
          </section>
        </div>
      </SiteContainer>
    </section>
  );
}
