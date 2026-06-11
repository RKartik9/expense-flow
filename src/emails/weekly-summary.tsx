import { Button, Text } from "@react-email/components";
import { BaseLayout, styles } from "./base-layout";

export interface SummaryCategory {
  name: string;
  amount: string;
}

export function WeeklySummaryEmail({
  name,
  totalSpent,
  expenseCount,
  topCategories,
  appUrl,
}: {
  name: string;
  totalSpent: string;
  expenseCount: number;
  topCategories: SummaryCategory[];
  appUrl: string;
}) {
  return (
    <BaseLayout preview="Your weekly expense summary" heading="Your weekly expense summary">
      <Text style={styles.text}>Hi {name},</Text>
      <Text style={styles.text}>
        You spent <strong>{totalSpent}</strong> across <strong>{expenseCount}</strong> expense
        {expenseCount === 1 ? "" : "s"} this week.
      </Text>
      {topCategories.length > 0 && (
        <div style={styles.highlight}>
          <Text style={{ ...styles.text, fontWeight: 600, margin: "0 0 8px" }}>Top categories</Text>
          {topCategories.map((c) => (
            <Text key={c.name} style={{ ...styles.text, margin: "0 0 4px" }}>
              {c.name}: <strong>{c.amount}</strong>
            </Text>
          ))}
        </div>
      )}
      <Button href={`${appUrl}/dashboard`} style={styles.button}>
        View dashboard
      </Button>
    </BaseLayout>
  );
}
