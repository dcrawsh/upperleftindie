"use client";

import { useState } from "react";

type FormState = {
  artistName: string;
  contactName: string;
  email: string;
  location: string;
  songLink: string;
  socialLink: string;
  notes: string;
};

const initialFormState: FormState = {
  artistName: "",
  contactName: "",
  email: "",
  location: "",
  songLink: "",
  socialLink: "",
  notes: "",
};

export default function SubmissionForm() {
  const [formData, setFormData] = useState(initialFormState);
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [songLinkError, setSongLinkError] = useState("");

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    if (name === "songLink") {
      // Only allow Spotify links
      if (
        value.trim() !== "" &&
        !/^https?:\/\/(open\.)?spotify\.com\//.test(value.trim())
      ) {
        setSongLinkError("Please enter a valid Spotify link.");
      } else {
        setSongLinkError("");
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Validate Spotify link before submitting
    if (
      !/^https?:\/\/(open\.)?spotify\.com\//.test(formData.songLink.trim())
    ) {
      setSongLinkError("Please enter a valid Spotify link.");
      return;
    }
    setStatus("Sending submission...");
    setIsSubmitting(true);

    const bodyText = `Artist: ${formData.artistName}
Contact: ${formData.contactName}
Email: ${formData.email}
Location: ${formData.location}
Song link: ${formData.songLink}
Social link: ${formData.socialLink || "Not provided"}

Notes:
${formData.notes || "Not provided"}`;

    const emailForm = new FormData();
    emailForm.append("name", formData.contactName || formData.artistName);
    emailForm.append("email", formData.email);
    emailForm.append("formType", "playlist submission");
    emailForm.append("bodyText", bodyText);

    try {
      const response = await fetch("/api/sendEmail", {
        method: "POST",
        body: emailForm,
      });

      if (!response.ok) {
        throw new Error("Email request failed");
      }

      setStatus("Submission sent. Thank you.");
      setFormData(initialFormState);
    } catch (error) {
      console.error(error);
      setStatus("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-md border border-ink/10 bg-paper p-6 shadow-soft md:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-bold text-ink/70">
          Artist name
          <input
            className="w-full rounded-md border border-ink/15 bg-white px-4 py-3 text-base text-ink outline-none transition focus:border-clay"
            required
            name="artistName"
            value={formData.artistName}
            onChange={handleChange}
            placeholder="Band or artist"
          />
        </label>

        <label className="space-y-2 text-sm font-bold text-ink/70">
          Your name
          <input
            className="w-full rounded-md border border-ink/15 bg-white px-4 py-3 text-base text-ink outline-none transition focus:border-clay"
            required
            name="contactName"
            value={formData.contactName}
            onChange={handleChange}
            placeholder="Contact name"
          />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-bold text-ink/70">
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

        <label className="space-y-2 text-sm font-bold text-ink/70">
          Northwest location
          <input
            className="w-full rounded-md border border-ink/15 bg-white px-4 py-3 text-base text-ink outline-none transition focus:border-clay"
            required
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Portland, OR"
          />
        </label>
      </div>

      <label className="block space-y-2 text-sm font-bold text-ink/70">
        Spotify song or artist link
        <input
          className={`w-full rounded-md border ${songLinkError ? 'border-red-500' : 'border-ink/15'} bg-white px-4 py-3 text-base text-ink outline-none transition focus:border-clay`}
          required
          type="url"
          name="songLink"
          value={formData.songLink}
          onChange={handleChange}
          placeholder="https://open.spotify.com/track/..."
        />
        {songLinkError && (
          <span className="text-red-600 text-xs font-semibold">{songLinkError}</span>
        )}
      </label>

      <label className="block space-y-2 text-sm font-bold text-ink/70">
        Social or website
        <input
          className="w-full rounded-md border border-ink/15 bg-white px-4 py-3 text-base text-ink outline-none transition focus:border-clay"
          type="url"
          name="socialLink"
          value={formData.socialLink}
          onChange={handleChange}
          placeholder="Instagram, website, press kit"
        />
      </label>

      <label className="block space-y-2 text-sm font-bold text-ink/70">
        Why this belongs
        <textarea
          className="min-h-32 w-full rounded-md border border-ink/15 bg-white px-4 py-3 text-base text-ink outline-none transition focus:border-clay"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Tell us anything useful about the artist, scene, release, or context."
        />
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-ink px-6 py-4 text-sm font-bold uppercase tracking-[0.14em] text-paper transition hover:bg-clay disabled:cursor-not-allowed disabled:bg-ink/45"
      >
        {isSubmitting ? "Sending..." : "Submit Music"}
      </button>

      {status ? <p className="text-sm font-bold text-ink/70">{status}</p> : null}
    </form>
  );
}
