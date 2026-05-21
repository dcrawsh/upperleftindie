import { NextRequest } from "next/server";
import {
  createEmailTransporter,
  EmailServiceError,
  getEmailConfig,
} from "../../../lib/email";
import {
  getSpotifyTrackFromUrl,
  getSpotifyTrackSummary,
} from "../../../lib/spotify";

export const runtime = "nodejs";

const playlistUrl =
  "https://open.spotify.com/playlist/3LTI227By7Wt7hGs3mz5hF";

function shouldSendSubmissionAutoReply(formType: string, email: string) {
  return Boolean(email) && formType.toLowerCase().includes("playlist submission");
}

async function getSubmittedTrackName(songLink: string) {
  try {
    const track = getSpotifyTrackFromUrl(songLink);

    if (!track) return "";

    const summary = await getSpotifyTrackSummary(track.id);

    return summary.name;
  } catch (error) {
    console.error("submission track lookup failed", error);
    return "";
  }
}

function getSubmissionAutoReplyText(name: string, trackName: string) {
  const greetingName = name.trim() || "there";
  const trackReference = trackName ? `"${trackName}"` : "your track";

  return `Hey ${greetingName},

Thanks for sending music to Upper Left Indie. I got your submission, and I'm excited to listen to ${trackReference} for playlist consideration.

Because of submission volume, I may not be able to respond to every submission individually, but I appreciate you sharing your work.

If you want to help the project grow, saving and sharing the playlist makes a real difference. It helps more Northwest independent artists get heard.

Listen/save here:
${playlistUrl}

Either way, thanks for being part of the Northwest music community.

Upper Left Indie`;
}

export async function POST(req: NextRequest) {
  try {
    const emailConfig = getEmailConfig();
    const recipientEmail = emailConfig.recipientEmail;

    if (!recipientEmail) {
      return Response.json(
        { error: "Email service is not configured" },
        { status: 500 }
      );
    }

    const form = await req.formData();
    const name = (form.get("name") as string) ?? "Unknown";
    const email = (form.get("email") as string) ?? "";
    const formType = (form.get("formType") as string) ?? "submission";
    const bodyText = (form.get("bodyText") as string) ?? "";
    const songLink = (form.get("songLink") as string) ?? "";

    const transporter = createEmailTransporter(emailConfig);

    const info = await transporter.sendMail({
      from: `"${name}" <${emailConfig.user}>`,
      replyTo: email,
      to: recipientEmail,
      subject: `New Upper Left Indie ${formType} from ${name}`,
      text: bodyText,
    });

    if (!info.accepted.includes(recipientEmail)) {
      console.error("email not accepted", info);
      return Response.json({ error: "email was not accepted" }, { status: 502 });
    }

    let autoReplySent = false;

    if (shouldSendSubmissionAutoReply(formType, email)) {
      try {
        const submittedTrackName = await getSubmittedTrackName(songLink);
        const autoReply = await transporter.sendMail({
          from: `"Upper Left Indie" <${emailConfig.user}>`,
          replyTo: recipientEmail,
          to: email,
          subject: "Thanks for submitting to Upper Left Indie",
          text: getSubmissionAutoReplyText(name, submittedTrackName),
        });

        autoReplySent = autoReply.accepted.includes(email);

        if (!autoReplySent) {
          console.error("submission auto-reply not accepted", autoReply);
        }
      } catch (error) {
        console.error("submission auto-reply failed", error);
      }
    }

    return Response.json({ success: true, autoReplySent });
  } catch (err) {
    console.error("email error", err);
    if (err instanceof EmailServiceError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    return Response.json({ error: "email failed" }, { status: 500 });
  }
}
