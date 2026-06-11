import "server-only";
import { Types } from "mongoose";
import { startOfMonth, endOfMonth } from "date-fns";
import { Budget } from "@/lib/models/budget";
import { Expense } from "@/lib/models/expense";
import { Category } from "@/lib/models/category";
import { User } from "@/lib/models/user";
import { createNotification } from "@/lib/notify";
import { sendEmail, APP_URL } from "@/lib/email";
import { BudgetAlertEmail } from "@/emails/budget-alert";
import { formatCurrency } from "@/lib/format";

/** After an expense is recorded, alert the user once per month if the category budget is exceeded. */
export async function checkBudgetAlert(userId: Types.ObjectId, categoryId: string, date: Date) {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  const budget = await Budget.findOne({ userId, categoryId, month, year, deletedAt: null });
  if (!budget) return;

  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const agg = await Expense.aggregate([
    {
      $match: {
        userId,
        categoryId: new Types.ObjectId(categoryId),
        type: "expense",
        deletedAt: null,
        date: { $gte: monthStart, $lte: monthEnd },
      },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const spent = agg[0]?.total ?? 0;
  if (spent <= budget.amount) return;

  // Only alert once per budget month
  if (budget.alertSentAt && budget.alertSentAt >= monthStart) return;

  const [user, category] = await Promise.all([
    User.findById(userId).lean(),
    Category.findById(categoryId).lean(),
  ]);
  if (!user || !category) return;

  await createNotification({
    userId: String(userId),
    type: "budget_alert",
    title: `Budget exceeded for ${category.name}`,
    body: `Spent ${formatCurrency(spent, user.currency)} of ${formatCurrency(budget.amount, user.currency)}`,
    link: "/budgets",
  });

  if (user.notificationPrefs?.emailReminders !== false) {
    await sendEmail({
      to: user.email,
      subject: `Budget exceeded: ${category.name}`,
      type: "budget_alert",
      userId: String(user._id),
      react: BudgetAlertEmail({
        name: user.name,
        categoryName: category.name,
        budgetAmount: formatCurrency(budget.amount, user.currency),
        spentAmount: formatCurrency(spent, user.currency),
        appUrl: APP_URL,
      }),
    });
  }

  budget.alertSentAt = new Date();
  await budget.save();
}
