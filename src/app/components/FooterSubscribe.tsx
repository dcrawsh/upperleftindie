"use client";

import { useState } from "react";

/**
 * Newsletter signup — Figma footer newsletter block (21:87).
 *
 * Real MailerLite behaviour is preserved, including the "already subscribed"
 * response, and every outcome is announced through a live region.
 */
export default function FooterSubscribe() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          groups: ["MAILERLITE_NEWSLETTER_GROUP_ID"],
          fields: {
            source_form: "footer",
            role: "listener",
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Newsletter request failed");
      }

      const result = (await response.json()) as { alreadySubscribed?: boolean };

      setEmail("");
      setStatus(
        result.alreadySubscribed
          ? "You’re already on the list."
          : "Thanks — you’re on the list."
      );
    } catch (error) {
      console.error(error);
      setStatus("Something went wrong. Try again in a minute.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full md:max-w-[400px]">
      <h2 className="type-heading-s text-on-inverse">Join the list</h2>
      <p className="mt-2 type-body-s text-on-inverse/85">
        New playlist adds, local artist features, and submission updates.
      </p>
      <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="footer-email">
          Email address
        </label>
        <input
          id="footer-email"
          className="min-w-0 flex-1 rounded-field border-[1.5px] border-subtle bg-page px-4 py-3.5 type-body-m text-primary placeholder:text-tertiary"
          required
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
        />
        {/*
          Figma fills this button with accent/solid, but on-inverse text on that
          fill measures 4.45:1 — below AA, and the same pairing the audit flagged
          on the old header CTA. The design system's own rule is that
          accent/solid never carries small text, so the button uses the page
          colour, matching every other button drawn on an inverse surface.
        */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="min-h-11 shrink-0 rounded-field bg-page px-6 type-button text-primary transition hover:bg-accent-soft hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Joining…" : "Join"}
        </button>
      </form>
      <p className="mt-2 type-body-s text-on-inverse/85">
        No spam. Unsubscribe anytime.
      </p>
      <p className="mt-2 type-body-s font-medium text-on-inverse" role="status" aria-live="polite">
        {status}
      </p>
    </div>
  );
}
