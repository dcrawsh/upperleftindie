import { NextRequest } from "next/server";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const name = (form.get("name") as string) ?? "Unknown";
    const email = (form.get("email") as string) ?? "";
    const formType = (form.get("formType") as string) ?? "submission";
    const bodyText = (form.get("bodyText") as string) ?? "";

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"${name}" <${process.env.EMAIL_USER}>`,
      replyTo: email,
      to: process.env.RECIPIENT_EMAIL,
      subject: `New Upper Left Indie ${formType} from ${name}`,
      text: bodyText,
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error("email error", err);
    return Response.json({ error: "email failed" }, { status: 500 });
  }
}
