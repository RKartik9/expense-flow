import { NextResponse } from "next/server";
import { addDays, addWeeks, addMonths, addQuarters, addYears } from "date-fns";
import { verifyCron } from "@/lib/cron";
import { connectDB } from "@/lib/db";
import { RecurringExpense } from "@/lib/models/recurring-expense";
import { Expense } from "@/lib/models/expense";

function advance(date: Date, frequency: string): Date {
  switch (frequency) {
    case "daily":
      return addDays(date, 1);
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
  const due = await RecurringExpense.find({
    active: true,
    deletedAt: null,
    nextRunAt: { $lte: now },
  }).limit(500);

  let created = 0;
  for (const recurring of due) {
    let nextRunAt = recurring.nextRunAt;
    // Catch up if multiple periods were missed
    while (nextRunAt <= now) {
      await Expense.create({
        userId: recurring.userId,
        title: recurring.title,
        amount: recurring.amount,
        currency: recurring.currency,
        type: "expense",
        categoryId: recurring.categoryId,
        date: nextRunAt,
        paymentMethod: recurring.paymentMethod,
        tags: ["recurring"],
        recurringExpenseId: recurring._id,
      });
      created++;
      nextRunAt = advance(nextRunAt, recurring.frequency);
    }
    recurring.lastRunAt = now;
    recurring.nextRunAt = nextRunAt;
    await recurring.save();
  }

  return NextResponse.json({ ok: true, processed: due.length, created });
}
