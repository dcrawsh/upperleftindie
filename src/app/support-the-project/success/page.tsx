import type { Metadata } from "next";
import SiteContainer from "../../components/SiteContainer";
import ConfirmationPanel from "../../components/ui/ConfirmationPanel";
import { ButtonLink } from "../../components/ui/Button";

export const metadata: Metadata = {
  title: "Thanks for Supporting the Project",
  description: "Thank you for supporting Upper Left Indie.",
  alternates: {
    canonical: "/support-the-project/success",
  },
};

export default function SupportSuccessPage() {
  return (
    <section className="py-16 md:py-20">
      <SiteContainer size="medium">
        <ConfirmationPanel
          badge="Payment complete"
          title="Thanks for chipping in."
          description="Your tip goes to the running costs of the project: hosting, the domain, the playlist tooling, and the hours spent listening. It is what keeps submissions free for every artist who sends one."
          recapTitle="What happens next"
          recap={[
            {
              label: "Receipt",
              value: "Stripe emails it to you directly — this site never sees your card details.",
            },
            {
              label: "One-time",
              value: "Nothing recurring was set up, and nothing is stored here.",
            },
            {
              label: "The bigger ask",
              value:
                "If you want to support the music itself, buy something from an artist on their own Bandcamp. That money reaches them, not this project.",
            },
          ]}
          actions={
            <>
              <ButtonLink href="/artists" emphasis="primary" size="md">
                Browse the artists
              </ButtonLink>
              <ButtonLink href="/" emphasis="secondary" size="md">
                Back to the playlist
              </ButtonLink>
            </>
          }
        />
      </SiteContainer>
    </section>
  );
}
