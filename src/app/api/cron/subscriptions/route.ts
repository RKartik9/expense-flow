import { NextResponse } from "next/server";
import { addDays, addWeeks, addMonths, addQuarters, addYears, format, subDays } from "date-fns";
import { verifyCron } from "@/lib/cron";
import { connectDB } from "@/lib/db";
import { SubscriptionTracker } from "@/lib/models/subscription-tracker";
import { User } from "@/lib/models/user";
import { sendEmail, APP_URL } from "@/lib/email";
import { SubscriptionReminderEmail } from "@/emails/subscription-reminder";
import { formatCurrency } from "@/lib/format";

function advance(date: Date, cycle: string): Date {
  switch (cycle) {
    case "weekly":
      return addWeeks(date, 1);
    case "monthly":
      return addMonths(date, 1);
    case "quarterly":
      return addQuarters(date, 1);
    case "yearly":
      return addYears(date, 1);
    default:
      return addMonths(date, 1);
  }
}

export async function GET(req: Request) {
  const unauthorized = verifyCron(req);
  if (unauthorized) return unauthorized;

  await connectDB();
  const now = new Date();

  // Roll over past renewals to the next cycle
  const overdue = await SubscriptionTracker.find({
    active: true,
    deletedAt: null,
    nextRenewalAt: { $lt: now },
  }).limit(500);
  for (const sub of overdue) {
    let next = sub.nextRenewalAt;
    while (next < now) next = advance(next, sub.billingCycle);
    sub.nextRenewalAt = next;
    sub.lastReminderSentAt = null;
    await sub.save();
  }

  // Send reminders for renewals coming up within each sub's reminder window
  const upcoming = await SubscriptionTracker.find({
    active: true,
    deletedAt: null,
    nextRenewalAt: { $gte: now },
  })
    .limit(1000)
    .lean();

  let sent = 0;
  for (const sub of upcoming) {
    const windowStart = subDays(sub.nextRenewalAt, sub.reminderDaysBefore ?? 3);
    if (now < windowStart) continue;
    if (sub.lastReminderSentAt && sub.lastReminderSentAt >= windowStart) continue;

    const user = await User.findOne({ _id: sub.userId, deletedAt: null }).lean();
    if (!user || user.notificationPrefs?.emailReminders === false) continue;

    await sendEmail({
      to: user.email,
      subject: `${sub.name} renews on ${format(sub.nextRenewalAt, "dd MMM")}`,
      type: "subscription_reminder",
      userId: String(user._id),
      react: SubscriptionReminderEmail({
        name: user.name,
        subscriptionName: sub.name,
        amount: formatCurrency(sub.amount, sub.currency),
        renewalDate: format(sub.nextRenewalAt, "dd MMM yyyy"),
        appUrl: APP_URL,
      }),
    });

    await SubscriptionTracker.updateOne(
      { _id: sub._id },
      { $set: { lastReminderSentAt: new Date() } }
    );
    sent++;
  }

  return NextResponse.json({ ok: true, rolledOver: overdue.length, sent });
}
