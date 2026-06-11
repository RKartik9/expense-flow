import { NextResponse } from "next/server";
import { subDays } from "date-fns";
import { verifyCron } from "@/lib/cron";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/user";
import { Expense } from "@/lib/models/expense";
import { sendEmail, APP_URL } from "@/lib/email";
import { WeeklySummaryEmail } from "@/emails/weekly-summary";
import { formatCurrency } from "@/lib/format";

export async function GET(req: Request) {
  const unauthorized = verifyCron(req);
  if (unauthorized) return unauthorized;

  await connectDB();
  const from = subDays(new Date(), 7);

  const users = await User.find({
    deletedAt: null,
    "notificationPrefs.weeklySummary": { $ne: false },
  })
    .limit(2000)
    .lean();

  let sent = 0;
  for (const user of users) {
    const rows = await Expense.aggregate([
      { $match: { userId: user._id, type: "expense", deletedAt: null, date: { $gte: from } } },
      { $group: { _id: "$categoryId", amount: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "category" } },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      { $sort: { amount: -1 } },
    ]);
    if (rows.length === 0) continue;

    const totalSpent = rows.reduce((s, r) => s + r.amount, 0);
    const expenseCount = rows.reduce((s, r) => s + r.count, 0);

    await sendEmail({
      to: user.email,
      subject: "Your weekly expense summary",
      type: "weekly_summary",
      userId: String(user._id),
      react: WeeklySummaryEmail({
        name: user.name,
        totalSpent: formatCurrency(totalSpent, user.currency),
        expenseCount,
        topCategories: rows.slice(0, 5).map((r) => ({
          name: r.category?.name ?? "Other",
          amount: formatCurrency(r.amount, user.currency),
        })),
        appUrl: APP_URL,
      }),
    });
    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
