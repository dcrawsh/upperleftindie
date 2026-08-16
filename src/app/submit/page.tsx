import SubmissionForm from "../components/SubmissionForm";
import SiteContainer from "../components/SiteContainer";
import { REGION_SCOPE } from "../../lib/site";

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

const steps = [
  "I listen to everything. It is one person, so it can take a couple of weeks.",
  "If it fits, the track goes on the active playlist.",
  "If you gave permission, an artist page goes up with links to your Bandcamp.",
  "After a run on the active playlist, the song moves to the archive and stays findable.",
];

export default function SubmitPage() {
  return (
    <section className="py-12 md:py-14">
      <SiteContainer className="grid gap-10 lg:grid-cols-[440px_1fr] lg:items-start lg:gap-16">
        <div className="flex flex-col gap-5">
          <p className="type-label-m text-accent">Submissions · Free, always</p>
          <h1 className="type-display-xl text-primary">
            Send music from the upper left.
          </h1>

          <div className="flex flex-col gap-2 rounded-field border-[1.5px] border-subtle bg-surface px-5 py-4">
            <h2 className="type-heading-s text-primary">Who can submit</h2>
            <p className="type-body-s text-secondary">
              Artists based in {REGION_SCOPE}. Any genre. Self-released is welcome
              and common.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 rounded-field bg-accent-soft px-5 py-4">
            <h2 className="type-heading-s text-primary">What happens next</h2>
            <ol className="flex flex-col gap-2.5">
              {steps.map((step, index) => (
                <li key={step} className="flex gap-2.5">
                  <span
                    className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-solid type-label-s text-on-inverse"
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>
                  <span className="type-body-s text-secondary">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <p className="type-body-s text-tertiary">
            Because of volume I can’t reply to every submission — but nothing gets
            deleted unheard.
          </p>
        </div>

        <SubmissionForm />
      </SiteContainer>
    </section>
  );
}
