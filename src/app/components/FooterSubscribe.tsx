"use client";

import { useState } from "react";

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
    <div className="w-full sm:max-w-sm">
      <div className="mb-3 space-y-1">
        <h2 className="text-base font-bold text-ink">
          Join the Upper Left Indie list
        </h2>
        <p className="text-sm text-ink/60">
          New playlist adds, local artist features, and submission updates.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="footer-email">
          Email
        </label>
        <input
          id="footer-email"
          className="min-w-0 flex-1 rounded-md border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none transition placeholder:text-ink/40 focus:border-clay"
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-ink px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-paper transition hover:bg-clay disabled:cursor-not-allowed disabled:bg-ink/45"
        >
          {isSubmitting ? "Joining" : "Join"}
        </button>
      </form>
      <p className="mt-2 text-xs text-ink/50">No spam. Unsubscribe anytime.</p>
      {status ? (
        <p className="mt-2 text-xs font-bold text-ink/70" aria-live="polite">
          {status}
        </p>
      ) : null}
    </div>
  );
}
