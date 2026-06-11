import { NextResponse } from "next/server";
import { subDays } from "date-fns";
import { verifyCron } from "@/lib/cron";
import { connectDB } from "@/lib/db";
import { Split } from "@/lib/models/split";
import { SplitParticipant } from "@/lib/models/split-participant";
import { User } from "@/lib/models/user";
import { createNotification } from "@/lib/notify";
import { sendEmail, APP_URL } from "@/lib/email";
import { PaymentReminderEmail } from "@/emails/payment-reminder";
import { formatCurrency } from "@/lib/format";

const REMIND_EVERY_DAYS = 3;

export async function GET(req: Request) {
  const unauthorized = verifyCron(req);
  if (unauthorized) return unauthorized;

  await connectDB();
  const threshold = subDays(new Date(), REMIND_EVERY_DAYS);

  const pending = await SplitParticipant.find({
    isPayer: false,
    status: { $ne: "paid" },
    deletedAt: null,
    $or: [{ lastRemindedAt: null }, { lastRemindedAt: { $lte: threshold } }],
  })
    .limit(200)
    .lean();

  const splits = await Split.find({
    _id: { $in: pending.map((p) => p.splitId) },
    status: "open",
    deletedAt: null,
  })
    .populate("payerId", "name")
    .lean();
  const splitById = new Map(splits.map((s) => [String(s._id), s]));

  const userIds = pending.flatMap((p) => (p.userId ? [p.userId] : []));
  const users = await User.find({ _id: { $in: userIds }, deletedAt: null }).lean();
  const userById = new Map(users.map((u) => [String(u._id), u]));

  let sent = 0;
  for (const participant of pending) {
    const split = splitById.get(String(participant.splitId));
    if (!split) continue;

    const linkedUser = participant.userId ? userById.get(String(participant.userId)) : null;
    if (linkedUser && linkedUser.notificationPrefs?.emailReminders === false) continue;

    const outstanding = participant.shareAmount - participant.paidAmount;
    if (outstanding <= 0.01) continue;

    const payerName = (split.payerId as { name?: string } | null)?.name ?? "your friend";

    await sendEmail({
      to: participant.email,
      subject: "You have a pending payment",
      type: "payment_reminder",
      userId: linkedUser ? String(linkedUser._id) : null,
      react: PaymentReminderEmail({
        payerName,
        splitTitle: split.title,
        outstanding: formatCurrency(outstanding, split.currency),
        splitUrl: `${APP_URL}/splits/${split._id}`,
      }),
    });

    if (linkedUser) {
      await createNotification({
        userId: String(linkedUser._id),
        type: "payment_reminder",
        title: `Reminder: ${formatCurrency(outstanding, split.currency)} pending for "${split.title}"`,
        link: `/splits/${split._id}`,
      });
    }

    await SplitParticipant.updateOne(
      { _id: participant._id },
      { $set: { lastRemindedAt: new Date() } }
    );
    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
