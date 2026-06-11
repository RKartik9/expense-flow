import { Button, Text } from "@react-email/components";
import { BaseLayout, styles } from "./base-layout";

export function BudgetAlertEmail({
  name,
  categoryName,
  budgetAmount,
  spentAmount,
  appUrl,
}: {
  name: string;
  categoryName: string;
  budgetAmount: string;
  spentAmount: string;
  appUrl: string;
}) {
  return (
    <BaseLayout
      preview={`You've exceeded your ${categoryName} budget`}
      heading="Budget exceeded"
    >
      <Text style={styles.text}>Hi {name},</Text>
      <Text style={styles.text}>
        You&apos;ve spent <strong>{spentAmount}</strong> on <strong>{categoryName}</strong> this
        month, exceeding your budget of <strong>{budgetAmount}</strong>.
      </Text>
      <Button href={`${appUrl}/budgets`} style={styles.button}>
        Review budgets
      </Button>
    </BaseLayout>
  );
}
