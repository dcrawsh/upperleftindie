import { NextRequest } from "next/server";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    const recipientEmail = process.env.RECIPIENT_EMAIL;

    if (!emailUser || !emailPass || !recipientEmail) {
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

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    const info = await transporter.sendMail({
      from: `"${name}" <${emailUser}>`,
      replyTo: email,
      to: recipientEmail,
      subject: `New Upper Left Indie ${formType} from ${name}`,
      text: bodyText,
    });

    if (!info.accepted.includes(recipientEmail)) {
      console.error("email not accepted", info);
      return Response.json({ error: "email was not accepted" }, { status: 502 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("email error", err);
    return Response.json({ error: "email failed" }, { status: 500 });
  }
}
