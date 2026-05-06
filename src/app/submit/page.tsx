import SubmissionForm from "../components/SubmissionForm";

export const metadata = {
  title: "Submit Music | Upper Left Indie",
  description: "Submit a Northwest artist or track for Upper Left Indie consideration.",
};

export default function SubmitPage() {
  return (
    <section className="px-6 py-14 md:px-10 md:py-20">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1fr] lg:items-start">
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

        <SubmissionForm />
      </div>
    </section>
  );
}
