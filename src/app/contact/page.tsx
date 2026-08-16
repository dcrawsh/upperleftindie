import ContactForm from "../components/ContactForm";
import SiteContainer from "../components/SiteContainer";
import { ButtonLink } from "../components/ui/Button";

export const metadata = {
  title: "Contact",
  description:
    "Contact Upper Left Indie about features, write-ups, upcoming releases, and local music ideas.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact | Upper Left Indie",
    description:
      "Contact Upper Left Indie about features, write-ups, upcoming releases, and local music ideas.",
    url: "/contact",
  },
};

export default function ContactPage() {
  return (
    <section className="py-12 md:py-14">
      <SiteContainer className="grid gap-10 lg:grid-cols-[440px_1fr] lg:items-start lg:gap-16">
        <div className="flex flex-col gap-5">
          <p className="type-label-m text-accent">Contact</p>
          <h1 className="type-display-xl text-primary">Get in touch.</h1>
          <p className="type-body-l text-secondary">
            Pitching an artist, a scene story, a show, or a correction? Send it
            this way.
          </p>
          <div className="flex flex-col gap-2 rounded-field bg-accent-soft px-5 py-4">
            <h2 className="type-heading-s text-primary">
              Submitting your own music?
            </h2>
            <p className="type-body-s text-secondary">
              Use the submission form instead — it captures the links and
              permissions needed to consider a track for the playlist.
            </p>
            <div className="pt-1">
              <ButtonLink href="/submit" emphasis="secondary" size="md">
                Submit music
              </ButtonLink>
            </div>
          </div>
        </div>

        <ContactForm />
      </SiteContainer>
    </section>
  );
}
