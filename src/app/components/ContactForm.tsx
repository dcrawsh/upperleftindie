"use client";

import { useState } from "react";
import { Button } from "./ui/Button";
import { ConsentCheckbox, TextField, TextareaField } from "./ui/Field";

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
    setStatus("Sending your message…");
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
          "Message sent. Thanks for reaching out. You were not added to the mailing list — you can join any time from the footer."
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
      className="flex flex-col gap-5 rounded-card border-[1.5px] border-subtle bg-surface p-6 md:p-8"
    >
      <TextField
        id="contact-name"
        name="name"
        label="Name"
        required
        value={formData.name}
        onChange={handleChange}
        placeholder="Your name"
        autoComplete="name"
      />

      <TextField
        id="contact-email"
        name="email"
        type="email"
        label="Email"
        required
        value={formData.email}
        onChange={handleChange}
        placeholder="you@example.com"
        autoComplete="email"
      />

      <TextField
        id="contact-subject"
        name="subject"
        label="Subject"
        optional
        value={formData.subject}
        onChange={handleChange}
        placeholder="What is this about?"
      />

      <TextareaField
        id="contact-message"
        name="message"
        label="Message"
        required
        value={formData.message}
        onChange={handleChange}
        placeholder="Write your message"
        rows={7}
      />

      <ConsentCheckbox
        id="contact-subscribeToNewsletter"
        name="subscribeToNewsletter"
        checked={formData.subscribeToNewsletter}
        onChange={handleChange}
        title="Also send me Upper Left Indie updates."
        description="Playlist adds, artist features, local music notes, and submission updates. No spam, unsubscribe any time. Unchecked by default."
      />

      <Button
        type="submit"
        emphasis="primary"
        size="lg"
        fullWidth
        disabled={isSubmitting}
      >
        {isSubmitting ? "Sending…" : "Send message"}
      </Button>

      <p
        className="type-body-s font-medium text-primary empty:hidden"
        role="status"
        aria-live="polite"
      >
        {status}
      </p>
    </form>
  );
}
