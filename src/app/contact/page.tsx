import ContactForm from "../components/ContactForm";
import SiteContainer from "../components/SiteContainer";

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
    <section className="py-14 md:py-20">
      <SiteContainer className="grid gap-10 lg:grid-cols-[0.75fr_1fr] lg:items-start">
        <div>
          <p className="mb-4 text-sm font-black uppercase tracking-[0.26em] text-clay">
            Contact
          </p>
          <h1 className="text-4xl font-black leading-tight text-ink md:text-6xl">
            Get in touch.
          </h1>
          <p className="mt-6 text-lg leading-8 text-ink/70">
            Interested in having us do a write-up or feature for a new or
            upcoming release? Want to pitch an artist, scene story, show, or
            idea we should know about? Send it our way.
          </p>
        </div>

        <ContactForm />
      </SiteContainer>
    </section>
  );
}
