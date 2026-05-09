"use client";

import { useState } from "react";

type ContactFormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
  subscribeToNewsletter: boolean;
};

const initialFormState: ContactFormState = {
  name: "",
  email: "",
  subject: "",
  message: "",
  subscribeToNewsletter: false,
};

export default function ContactForm() {
  const [formData, setFormData] = useState(initialFormState);
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    const nextValue =
      event.target instanceof HTMLInputElement && event.target.type === "checkbox"
        ? event.target.checked
        : value;

    setFormData((current) => ({ ...current, [name]: nextValue }));
  };

  const getErrorMessage = async (response: Response) => {
    try {
      const result = (await response.json()) as { error?: string };
      return result.error || "Message request failed";
    } catch {
      return "Message request failed";
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("Sending message...");
    setIsSubmitting(true);

    const bodyText = `Name: ${formData.name}
Email: ${formData.email}
Subject: ${formData.subject || "Not provided"}

Message:
${formData.message}`;

    const emailForm = new FormData();
    emailForm.append("name", formData.name);
    emailForm.append("email", formData.email);
    emailForm.append("formType", "contact message");
    emailForm.append("bodyText", bodyText);

    try {
      const response = await fetch("/api/sendEmail", {
        method: "POST",
        body: emailForm,
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      let newsletterSubscribed = true;

      if (formData.subscribeToNewsletter) {
        try {
          const subscribeResponse = await fetch("/api/newsletter/subscribe", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: formData.email,
              groups: ["MAILERLITE_NEWSLETTER_GROUP_ID"],
              fields: {
                source_form: "contact-form",
                role: "listener",
              },
            }),
          });

          newsletterSubscribed = subscribeResponse.ok;

          if (!subscribeResponse.ok) {
            console.error("Newsletter signup failed");
          }
        } catch (error) {
          newsletterSubscribed = false;
          console.error(error);
        }
      }

      setStatus("Message sent. Thanks for reaching out.");
      if (!newsletterSubscribed) {
        setStatus(
          "Message sent. Thanks for reaching out. Newsletter signup could not be completed."
        );
      }
      setFormData(initialFormState);
    } catch (error) {
      console.error(error);
      setStatus(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-md border border-ink/10 bg-paper p-6 shadow-soft md:p-8"
    >
      <label className="block space-y-2 text-sm font-bold text-ink/70">
        Name
        <input
          className="w-full rounded-md border border-ink/15 bg-white px-4 py-3 text-base text-ink outline-none transition focus:border-clay"
          required
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Your name"
        />
      </label>

      <label className="block space-y-2 text-sm font-bold text-ink/70">
        Email
        <input
          className="w-full rounded-md border border-ink/15 bg-white px-4 py-3 text-base text-ink outline-none transition focus:border-clay"
          required
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="you@example.com"
        />
      </label>

      <label className="block space-y-2 text-sm font-bold text-ink/70">
        Subject
        <input
          className="w-full rounded-md border border-ink/15 bg-white px-4 py-3 text-base text-ink outline-none transition focus:border-clay"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          placeholder="What is this about?"
        />
      </label>

      <label className="block space-y-2 text-sm font-bold text-ink/70">
        Message
        <textarea
          className="min-h-40 w-full rounded-md border border-ink/15 bg-white px-4 py-3 text-base text-ink outline-none transition focus:border-clay"
          required
          name="message"
          value={formData.message}
          onChange={handleChange}
          placeholder="Write your message"
        />
      </label>

      <label className="flex items-start gap-3 rounded-md border border-ink/10 bg-white/70 p-4 text-sm text-ink/70">
        <input
          className="mt-1 h-4 w-4 rounded border-ink/20 accent-clay"
          type="checkbox"
          name="subscribeToNewsletter"
          checked={formData.subscribeToNewsletter}
          onChange={handleChange}
        />
        <span>
          <span className="block font-bold">
            Also send me Upper Left Indie updates.
          </span>
          <span className="mt-1 block text-xs text-ink/55">
            Playlist adds, artist features, local music notes, and submission
            updates. No spam. Unsubscribe anytime.
          </span>
        </span>
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-ink px-6 py-4 text-sm font-bold uppercase tracking-[0.14em] text-paper transition hover:bg-clay disabled:cursor-not-allowed disabled:bg-ink/45"
      >
        {isSubmitting ? "Sending..." : "Send Message"}
      </button>

      {status ? (
        <p className="text-sm font-bold text-ink/70" aria-live="polite">
          {status}
        </p>
      ) : null}
    </form>
  );
}
