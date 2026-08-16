"use client";

import { useRef, useState } from "react";
import { FiAlertCircle } from "react-icons/fi";
import { Button, ButtonLink } from "./ui/Button";
import ConfirmationPanel from "./ui/ConfirmationPanel";
import {
  ConsentCheckbox,
  SelectField,
  TextField,
  TextareaField,
} from "./ui/Field";
import { genreOptions, getGenreLabel } from "../../lib/genres";
import { ACTIVE_PLAYLIST_URL, INSTAGRAM_URL, REGION_SCOPE } from "../../lib/site";

/**
 * Submission form — Figma "Submit · Desktop 1440" (24:76),
 * "Submit · Confirmation" (28:199) and "Submit · Validation error" (28:241).
 *
 * The twelve fields are grouped into Artist / Music / Permissions, validation
 * explains why a Spotify track link is required, every async outcome is
 * announced, and success is a confirmation state with a consent recap rather
 * than a paragraph under the button. The Supabase, email, artist-page queue and
 * newsletter calls are unchanged.
 */
type FormState = {
  artistName: string;
  contactName: string;
  email: string;
  city: string;
  region: string;
  genre: string;
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
  genre: "",
  songLink: "",
  bandCampLink: "",
  socialLink: "",
  notes: "",
  artistPageConsent: false,
  // Opt-in, not opt-out. The previous default was pre-checked.
  subscribeToNewsletter: false,
};

const emailServiceTemporarilyDown = false;

const spotifyTrackUrlPattern =
  /^https:\/\/open\.spotify\.com\/(?:intl-[a-z]{2}\/)?track\/[A-Za-z0-9]{22}(?:[/?#].*)?$/i;

const spotifyTrackLinkError =
  "Please enter a Spotify song link, like https://open.spotify.com/track/…";

const bandcampLinkError =
  "Please enter the artist’s Bandcamp address, like https://yourband.bandcamp.com";

// Alaska is named in the eligibility copy on every page; it was missing from
// this selector.
const regionOptions = [
  { label: "Oregon", value: "oregon", state: "OR", country: "US" },
  { label: "Washington", value: "washington", state: "WA", country: "US" },
  { label: "Idaho", value: "idaho", state: "ID", country: "US" },
  { label: "Alaska", value: "alaska", state: "AK", country: "US" },
  { label: "British Columbia", value: "bc", state: "BC", country: "CA" },
  { label: "Other region", value: "other-region" },
];

type FieldErrors = Partial<Record<keyof FormState, string>>;

type SubmittedSummary = {
  artistName: string;
  city: string;
  regionLabel: string;
  genreLabel: string;
  artistPageConsent: boolean;
  subscribeToNewsletter: boolean;
  followUps: string[];
};

function getLocationFields(city: string, region: string) {
  const regionOption = regionOptions.find((option) => option.value === region);

  return {
    city: city.trim().toLowerCase(),
    region,
    ...(regionOption?.state ? { state: regionOption.state } : {}),
    ...(regionOption?.country ? { country: regionOption.country } : {}),
  };
}

function getRegionLabel(region: string) {
  return (
    regionOptions.find((option) => option.value === region)?.label ||
    "Not provided"
  );
}

function isBandcampUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return (
      url.protocol === "https:" &&
      (url.hostname === "bandcamp.com" || url.hostname.endsWith(".bandcamp.com"))
    );
  } catch {
    return false;
  }
}

export default function SubmissionForm() {
  const [formData, setFormData] = useState(initialFormState);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<SubmittedSummary | null>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

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
      setFieldErrors((current) => ({
        ...current,
        songLink:
          value.trim() === "" || spotifyTrackUrlPattern.test(value.trim())
            ? undefined
            : spotifyTrackLinkError,
      }));
    }

    if (name === "bandCampLink") {
      setFieldErrors((current) => ({
        ...current,
        bandCampLink:
          value.trim() === "" || isBandcampUrl(value)
            ? undefined
            : bandcampLinkError,
      }));
    }
  };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};

    if (!spotifyTrackUrlPattern.test(formData.songLink.trim())) {
      errors.songLink = spotifyTrackLinkError;
    }

    if (formData.bandCampLink.trim() && !isBandcampUrl(formData.bandCampLink)) {
      errors.bandCampLink = bandcampLinkError;
    }

    if (formData.artistPageConsent && !formData.bandCampLink.trim()) {
      errors.bandCampLink =
        "A Bandcamp address is needed before an artist page can be created.";
    }

    return errors;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (emailServiceTemporarilyDown) {
      setFormError(
        "Submissions by form are paused right now. Please send your track through Instagram instead."
      );
      return;
    }

    const errors = validate();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setFormError("");
      window.requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }

    setFormError("");
    setIsSubmitting(true);

    const bodyText = `Artist: ${formData.artistName}
Contact: ${formData.contactName}
Email: ${formData.email}
City: ${formData.city}
Region: ${getRegionLabel(formData.region)}
Genre: ${getGenreLabel(formData.genre)}
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
    emailForm.append("songLink", formData.songLink);

    try {
      let submissionSaved = true;
      let emailSent = true;

      try {
        const submissionResponse = await fetch("/api/submissions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        submissionSaved = submissionResponse.ok;

        if (!submissionResponse.ok) {
          console.error(
            await getErrorMessage(submissionResponse, "Submission save failed")
          );
        }
      } catch (error) {
        submissionSaved = false;
        console.error(error);
      }

      const response = await fetch("/api/sendEmail", {
        method: "POST",
        body: emailForm,
      });

      emailSent = response.ok;

      if (!emailSent) {
        const message = await getErrorMessage(response, "Email request failed");
        console.error(message);

        if (!submissionSaved) {
          throw new Error(message);
        }
      }

      let newsletterSubscribed = true;
      let artistPageQueued = true;

      if (formData.artistPageConsent && formData.bandCampLink.trim()) {
        try {
          const queueResponse = await fetch("/api/bandcamp/queue", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              artistName: formData.artistName,
              bandcampUrl: formData.bandCampLink,
              genre: getGenreLabel(formData.genre),
              source: "submission-form",
            }),
          });

          artistPageQueued = queueResponse.ok;

          if (!queueResponse.ok) {
            console.error(
              await getErrorMessage(queueResponse, "Bandcamp queue failed")
            );
          }
        } catch (error) {
          artistPageQueued = false;
          console.error(error);
        }
      }

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
                genre: formData.genre,
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

      // Artist-facing wording. The old messages surfaced internal vocabulary
      // like "Admin queue save could not be completed."
      const followUps = [
        !submissionSaved
          ? "Your track reached me by email but not the review queue, so a reply may take longer than usual."
          : "",
        !emailSent
          ? "Your track is in the review queue, but the notification email did not go out, so a reply may take longer than usual."
          : "",
        !artistPageQueued
          ? "The artist-page request did not go through. You can send it again from the contact page."
          : "",
        !newsletterSubscribed
          ? "You were not added to the mailing list. You can join any time from the footer."
          : "",
      ].filter(Boolean);

      setSubmitted({
        artistName: formData.artistName,
        city: formData.city,
        regionLabel: getRegionLabel(formData.region),
        genreLabel: getGenreLabel(formData.genre),
        artistPageConsent: formData.artistPageConsent,
        subscribeToNewsletter: formData.subscribeToNewsletter,
        followUps,
      });
      setFormData(initialFormState);
      setFieldErrors({});
    } catch (error) {
      console.error(error);
      setFormError(
        "Something went wrong sending your track. Please try again in a minute."
      );
      window.requestAnimationFrame(() => summaryRef.current?.focus());
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    const place = [submitted.city.trim(), submitted.regionLabel]
      .filter((part) => part && part !== "Not provided")
      .join(" · ");

    return (
      <div aria-live="polite">
        <ConfirmationPanel
          badge="Submission received"
          title="Thanks — it’s in the queue."
          description="One person listens to everything that comes in. Because of volume I can’t reply to every submission, but if your track fits the playlist you’ll hear from me."
          recapTitle="What you sent, and what you agreed to"
          recap={[
            { label: "Artist", value: submitted.artistName || "Not provided" },
            { label: "From", value: place || "Not provided" },
            { label: "Genre", value: submitted.genreLabel },
            {
              label: "Artist page",
              value: submitted.artistPageConsent
                ? "Yes — you asked for this artist to be featured on the site, using public Bandcamp details."
                : "No — you did not ask for an artist page.",
            },
            {
              label: "Mailing list",
              value: submitted.subscribeToNewsletter
                ? "Yes — you joined the Upper Left Indie list. Unsubscribe any time."
                : "No — you did not join. You can join any time from the footer.",
            },
          ]}
          actions={
            <>
              <ButtonLink
                href={ACTIVE_PLAYLIST_URL}
                external
                emphasis="primary"
                size="md"
              >
                Save the playlist on Spotify
              </ButtonLink>
              <Button
                emphasis="secondary"
                size="md"
                onClick={() => setSubmitted(null)}
              >
                Submit another track
              </Button>
            </>
          }
          footnote={
            <>
              Saving the playlist genuinely helps — it is the single biggest lever
              on whether these artists get heard beyond this site.
              {submitted.followUps.length > 0 ? (
                <>
                  {" "}
                  <span className="block pt-2 font-medium text-primary">
                    {submitted.followUps.join(" ")}
                  </span>
                </>
              ) : null}
            </>
          }
        />
      </div>
    );
  }

  const errorEntries = Object.entries(fieldErrors).filter(
    ([, message]) => Boolean(message)
  ) as Array<[keyof FormState, string]>;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-8 rounded-card border-[1.5px] border-subtle bg-surface p-6 md:p-10"
    >
      <div
        ref={summaryRef}
        tabIndex={-1}
        role="alert"
        aria-live="assertive"
        className="empty:hidden"
      >
        {errorEntries.length > 0 || formError ? (
          <div className="flex flex-col gap-2 rounded-field border-2 border-error bg-surface px-5 py-4">
            <p className="flex items-center gap-2 type-body-m-medium text-error">
              <FiAlertCircle size={20} aria-hidden="true" />
              {formError
                ? "That didn’t send"
                : errorEntries.length === 1
                  ? "One thing needs fixing"
                  : `${errorEntries.length} things need fixing`}
            </p>
            {formError ? (
              <p className="type-body-s text-secondary">{formError}</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {errorEntries.map(([field, message]) => (
                  <li key={field}>
                    <a
                      href={`#submit-${field}`}
                      className="type-body-s text-secondary underline decoration-error underline-offset-4"
                    >
                      {message}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>

      {emailServiceTemporarilyDown ? (
        <div className="flex flex-col gap-3 rounded-field border-[1.5px] border-accent-solid bg-accent-soft p-5">
          <p className="type-body-m-medium text-primary">
            Submissions by form are paused right now.
          </p>
          <p className="type-body-s text-secondary">
            Please send your music through Instagram while the form is offline.
          </p>
          <div>
            <ButtonLink href={INSTAGRAM_URL} external emphasis="primary" size="md">
              Submit on Instagram
            </ButtonLink>
          </div>
        </div>
      ) : null}

      <fieldset className="flex flex-col gap-4">
        <legend className="flex flex-col gap-1 pb-2">
          <span className="block type-label-m text-accent">1 · The artist</span>
          <span className="block type-body-s text-tertiary">
            Who I’m listening to, and who I reply to.
          </span>
        </legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="submit-artistName"
            name="artistName"
            label="Artist or band name"
            required
            value={formData.artistName}
            onChange={handleChange}
            placeholder="Band or artist"
            autoComplete="organization"
          />
          <TextField
            id="submit-contactName"
            name="contactName"
            label="Your name"
            required
            value={formData.contactName}
            onChange={handleChange}
            placeholder="Contact name"
            autoComplete="name"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="submit-email"
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
            id="submit-city"
            name="city"
            label="City or scene"
            required
            value={formData.city}
            onChange={handleChange}
            placeholder="Portland"
            autoComplete="address-level2"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            id="submit-region"
            name="region"
            label="Region"
            required
            value={formData.region}
            onChange={handleChange}
            helper="Alaska is included, along with the wider Northwest orbit."
          >
            <option value="" disabled>
              Select region
            </option>
            {regionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectField>

          <SelectField
            id="submit-genre"
            name="genre"
            label="Genre"
            required
            value={formData.genre}
            onChange={handleChange}
          >
            <option value="" disabled>
              Select genre
            </option>
            {genreOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectField>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="flex flex-col gap-1 pb-2">
          <span className="block type-label-m text-accent">2 · The music</span>
          <span className="block type-body-s text-tertiary">
            One song, not a whole discography. Pick the one you would want a
            stranger to hear first.
          </span>
        </legend>

        <TextField
          id="submit-songLink"
          name="songLink"
          type="url"
          label="Spotify song link"
          required
          value={formData.songLink}
          onChange={handleChange}
          error={fieldErrors.songLink}
          placeholder="https://open.spotify.com/track/…"
          helper="A Spotify track link is what lets me add your song straight to the playlist, so it is the one link I have to have. Send the track page, not an artist, album, or playlist page."
        />

        <TextField
          id="submit-bandCampLink"
          name="bandCampLink"
          type="url"
          label="Bandcamp link"
          optional={!formData.artistPageConsent}
          required={formData.artistPageConsent}
          value={formData.bandCampLink}
          onChange={handleChange}
          error={fieldErrors.bandCampLink}
          placeholder="https://yourband.bandcamp.com"
          helper="Needed only if you want an artist page on this site. It is also where listeners are sent to buy from you."
        />

        <TextField
          id="submit-socialLink"
          name="socialLink"
          type="url"
          label="Website or socials"
          optional
          value={formData.socialLink}
          onChange={handleChange}
          placeholder="Instagram, website, press kit"
        />

        <TextareaField
          id="submit-notes"
          name="notes"
          label="Anything I should know"
          optional
          value={formData.notes}
          onChange={handleChange}
          placeholder="The scene it came out of, who played on it, where you recorded it."
        />
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="flex flex-col gap-1 pb-2">
          <span className="block type-label-m text-accent">3 · Permissions</span>
          <span className="block type-body-s text-tertiary">
            Both are optional, and neither affects whether I listen.
          </span>
        </legend>

        <ConsentCheckbox
          id="submit-artistPageConsent"
          name="artistPageConsent"
          checked={formData.artistPageConsent}
          onChange={handleChange}
          title="I’m okay with Upper Left Indie featuring this artist on the site."
          description="This may include public Bandcamp details, images, music links, and related social or website links."
        />

        <ConsentCheckbox
          id="submit-subscribeToNewsletter"
          name="subscribeToNewsletter"
          checked={formData.subscribeToNewsletter}
          onChange={handleChange}
          title="Send me Upper Left Indie updates."
          description="New playlist adds, local artist features, and submission updates. No spam, unsubscribe any time. Unchecked by default."
        />
      </fieldset>

      <div className="flex flex-col gap-2.5">
        <Button
          type="submit"
          emphasis="primary"
          size="lg"
          fullWidth
          disabled={isSubmitting || emailServiceTemporarilyDown}
        >
          {isSubmitting ? "Sending…" : "Send my track"}
        </Button>
        <p className="type-body-s text-tertiary" aria-live="polite">
          {isSubmitting
            ? "Sending your submission…"
            : "Free. No account needed. Your details are only used to reply to you."}
        </p>
      </div>
    </form>
  );
}
