import { NextResponse } from "next/server";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { verifyCron } from "@/lib/cron";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/user";
import { Expense } from "@/lib/models/expense";
import { sendEmail, APP_URL } from "@/lib/email";
import { MonthlyReportEmail } from "@/emails/monthly-report";
import { formatCurrency } from "@/lib/format";

export async function GET(req: Request) {
  const unauthorized = verifyCron(req);
  if (unauthorized) return unauthorized;

  await connectDB();
  const lastMonth = subMonths(new Date(), 1);
  const from = startOfMonth(lastMonth);
  const to = endOfMonth(lastMonth);
  const monthLabel = format(lastMonth, "MMMM yyyy");

  const users = await User.find({
    deletedAt: null,
    "notificationPrefs.monthlyReport": { $ne: false },
  })
    .limit(2000)
    .lean();

  let sent = 0;
  for (const user of users) {
    const rows = await Expense.aggregate([
      { $match: { userId: user._id, deletedAt: null, date: { $gte: from, $lte: to } } },
      {
        $group: {
          _id: { categoryId: "$categoryId", type: "$type" },
          amount: { $sum: "$amount" },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id.categoryId",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      { $sort: { amount: -1 } },
    ]);
    if (rows.length === 0) continue;

    const totalSpent = rows
      .filter((r) => r._id.type === "expense")
      .reduce((s, r) => s + r.amount, 0);
    const totalIncome = rows
      .filter((r) => r._id.type === "income")
      .reduce((s, r) => s + r.amount, 0);

    await sendEmail({
      to: user.email,
      subject: "Your monthly financial report",
      type: "monthly_report",
      userId: String(user._id),
      react: MonthlyReportEmail({
        name: user.name,
        monthLabel,
        totalSpent: formatCurrency(totalSpent, user.currency),
        totalIncome: formatCurrency(totalIncome, user.currency),
        savings: formatCurrency(totalIncome - totalSpent, user.currency),
        topCategories: rows
          .filter((r) => r._id.type === "expense")
          .slice(0, 5)
          .map((r) => ({
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
