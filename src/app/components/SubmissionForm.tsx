"use client";

import { useState } from "react";

type FormState = {
  artistName: string;
  contactName: string;
  email: string;
  city: string;
  region: string;
  songLink: string;
  bandCampLink: string;
  socialLink: string;
  notes: string;
  artistPageConsent: boolean;
  subscribeToNewsletter: boolean;
};

const initialFormState: FormState = {
  artistName: "",
  contactName: "",
  email: "",
  city: "",
  region: "",
  songLink: "",
  bandCampLink: "",
  socialLink: "",
  notes: "",
  artistPageConsent: false,
  subscribeToNewsletter: true,
};

const playlistUrl =
  "https://open.spotify.com/playlist/3LTI227By7Wt7hGs3mz5hF?si=b0900f7372be4492";
const instagramUrl = "https://www.instagram.com/upperleftindie/";
const emailServiceTemporarilyDown = false;

const regionOptions = [
  { label: "Oregon", value: "oregon", state: "OR", country: "US" },
  { label: "Washington", value: "washington", state: "WA", country: "US" },
  { label: "Idaho", value: "idaho", state: "ID", country: "US" },
  { label: "BC", value: "bc", state: "BC", country: "CA" },
  { label: "Other region", value: "other-region" },
];

function getLocationFields(city: string, region: string) {
  const regionOption = regionOptions.find((option) => option.value === region);

  return {
    city: city.trim().toLowerCase(),
    region,
    ...(regionOption?.state ? { state: regionOption.state } : {}),
    ...(regionOption?.country ? { country: regionOption.country } : {}),
  };
}

export default function SubmissionForm() {
  const [formData, setFormData] = useState(initialFormState);
  const [status, setStatus] = useState("");
  const [showPlaylistNudge, setShowPlaylistNudge] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [songLinkError, setSongLinkError] = useState("");

  const getErrorMessage = async (response: Response, fallback: string) => {
    try {
      const result = (await response.json()) as { error?: string };
      return result.error || fallback;
    } catch {
      return fallback;
    }
  };

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = event.target;
    const nextValue =
      event.target instanceof HTMLInputElement && event.target.type === "checkbox"
        ? event.target.checked
        : value;

    setFormData((current) => ({ ...current, [name]: nextValue }));
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

    if (emailServiceTemporarilyDown) {
      setStatus(
        "Email submissions are temporarily down. Please send your track through Instagram for now."
      );
      return;
    }

    // Validate Spotify link before submitting
    if (
      !/^https?:\/\/(open\.)?spotify\.com\//.test(formData.songLink.trim())
    ) {
      setSongLinkError("Please enter a valid Spotify link.");
      return;
    }
    setStatus("Sending submission...");
    setShowPlaylistNudge(false);
    setIsSubmitting(true);

    const bodyText = `Artist: ${formData.artistName}
Contact: ${formData.contactName}
Email: ${formData.email}
City: ${formData.city}
Region: ${
      regionOptions.find((option) => option.value === formData.region)?.label ||
      "Not provided"
    }
Song link: ${formData.songLink}
Bandcamp link: ${formData.bandCampLink || "Not provided"}
Social link: ${formData.socialLink || "Not provided"}
Artist page permission: ${formData.artistPageConsent ? "Yes" : "No"}

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
        throw new Error(
          await getErrorMessage(response, "Email request failed")
        );
      }

      let newsletterSubscribed = true;

      if (formData.subscribeToNewsletter) {
        const locationFields = getLocationFields(formData.city, formData.region);

        try {
          const subscribeResponse = await fetch("/api/newsletter/subscribe", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: formData.email,
              groups: [
                "MAILERLITE_NEWSLETTER_GROUP_ID",
                "MAILERLITE_ARTIST_GROUP_ID",
              ],
              fields: {
                ...locationFields,
                ...(formData.bandCampLink.trim()
                  ? { band_camp: formData.bandCampLink.trim() }
                  : {}),
                source_form: "submission-form",
                role: "artist",
              },
            }),
          });

          newsletterSubscribed = subscribeResponse.ok;

          if (!subscribeResponse.ok) {
            console.error(
              await getErrorMessage(subscribeResponse, "Newsletter signup failed")
            );
          }
        } catch (error) {
          newsletterSubscribed = false;
          console.error(error);
        }
      }

      setStatus(
        newsletterSubscribed
          ? "Submission sent. We’re excited to give your track a listen and will get to it as soon as we can. Please allow up to two weeks."
          : "Submission sent. We’re excited to give your track a listen and will get to it as soon as we can. Please allow up to two weeks. Newsletter signup could not be completed."
      );
      setShowPlaylistNudge(true);
      setFormData(initialFormState);
    } catch (error) {
      console.error(error);
      setShowPlaylistNudge(false);
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
      {emailServiceTemporarilyDown ? (
        <div className="rounded-md border border-clay/25 bg-clay/10 p-4 text-sm leading-6 text-ink/75">
          <p className="font-bold text-ink">
            Email submissions are temporarily down.
          </p>
          <p className="mt-1">
            Please submit your music through Instagram while we get the email
            service back online.
          </p>
          <a
            href={instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex rounded-full bg-ink px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-paper transition hover:bg-clay"
          >
            Submit on Instagram
          </a>
        </div>
      ) : null}

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
          City / scene
          <input
            className="w-full rounded-md border border-ink/15 bg-white px-4 py-3 text-base text-ink outline-none transition focus:border-clay"
            required
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="Portland"
          />
        </label>

        <label className="space-y-2 text-sm font-bold text-ink/70">
          Region
          <select
            className="w-full rounded-md border border-ink/15 bg-white px-4 py-3 text-base text-ink outline-none transition focus:border-clay"
            required
            name="region"
            value={formData.region}
            onChange={handleChange}
          >
            <option value="" disabled>
              Select region
            </option>
            {regionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
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
        Bandcamp link
        <input
          className="w-full rounded-md border border-ink/15 bg-white px-4 py-3 text-base text-ink outline-none transition focus:border-clay"
          type="url"
          name="bandCampLink"
          value={formData.bandCampLink}
          onChange={handleChange}
          placeholder="https://yourband.bandcamp.com"
        />
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

      <label className="flex items-start gap-3 rounded-md border border-ink/10 bg-white/70 p-4 text-sm text-ink/70">
        <input
          className="mt-1 h-4 w-4 rounded border-ink/20 accent-clay"
          type="checkbox"
          name="artistPageConsent"
          checked={formData.artistPageConsent}
          onChange={handleChange}
        />
        <span>
          <span className="block font-bold">
            I’m okay with Upper Left Indie featuring this artist on the site.
          </span>
          <span className="mt-1 block text-xs text-ink/55">
            This may include public Bandcamp details, images, music links, and
            related social or website links.
          </span>
        </span>
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
            New playlist adds, local artist features, and submission updates. No
            spam. Unsubscribe anytime.
          </span>
        </span>
      </label>

      <button
        type="submit"
        disabled={isSubmitting || emailServiceTemporarilyDown}
        className="w-full rounded-full bg-ink px-6 py-4 text-sm font-bold uppercase tracking-[0.14em] text-paper transition hover:bg-clay disabled:cursor-not-allowed disabled:bg-ink/45"
      >
        {emailServiceTemporarilyDown
          ? "Submit on Instagram for Now"
          : isSubmitting
            ? "Sending..."
            : "Submit Music"}
      </button>

      {status ? <p className="text-sm font-bold text-ink/70">{status}</p> : null}
      {showPlaylistNudge ? (
        <p className="text-sm text-ink/65">
          If you have a minute, please save the playlist on Spotify. It helps the
          artists you hear here travel a little farther.{" "}
          <a
            href={playlistUrl}
            target="_blank"
            rel="noreferrer"
            className="font-bold text-ink underline decoration-clay underline-offset-4"
          >
            Save Upper Left Indie
          </a>
        </p>
      ) : null}
    </form>
  );
}
