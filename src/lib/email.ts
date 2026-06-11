import "server-only";
import { Resend } from "resend";
import type { ReactElement } from "react";
import { EmailLog, type EMAIL_TYPES } from "@/lib/models/email-log";

const FROM = process.env.EMAIL_FROM ?? "ExpenseFlow <noreply@expenseflow.app>";

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function sendEmail(input: {
  to: string;
  subject: string;
  type: (typeof EMAIL_TYPES)[number];
  react: ReactElement;
  userId?: string | null;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY not set, skipping "${input.subject}" to ${input.to}`);
    return;
  }

  const resend = new Resend(apiKey);
  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: input.to,
      subject: input.subject,
      react: input.react,
    });
    await EmailLog.create({
      toEmail: input.to,
      userId: input.userId ?? null,
      type: input.type,
      subject: input.subject,
      status: error ? "failed" : "sent",
      providerId: data?.id,
      error: error?.message,
    });
  } catch (err) {
    await EmailLog.create({
      toEmail: input.to,
      userId: input.userId ?? null,
      type: input.type,
      subject: input.subject,
      status: "failed",
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
