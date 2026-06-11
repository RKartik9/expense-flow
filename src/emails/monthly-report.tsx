import { Button, Text } from "@react-email/components";
import { BaseLayout, styles } from "./base-layout";
import type { SummaryCategory } from "./weekly-summary";

export function MonthlyReportEmail({
  name,
  monthLabel,
  totalSpent,
  totalIncome,
  savings,
  topCategories,
  appUrl,
}: {
  name: string;
  monthLabel: string;
  totalSpent: string;
  totalIncome: string;
  savings: string;
  topCategories: SummaryCategory[];
  appUrl: string;
}) {
  return (
    <BaseLayout preview="Your monthly financial report" heading={`Your ${monthLabel} report`}>
      <Text style={styles.text}>Hi {name},</Text>
      <div style={styles.highlight}>
        <Text style={{ ...styles.text, margin: "0 0 4px" }}>
          Spent: <strong>{totalSpent}</strong>
        </Text>
        <Text style={{ ...styles.text, margin: "0 0 4px" }}>
          Income: <strong>{totalIncome}</strong>
        </Text>
        <Text style={{ ...styles.text, margin: 0 }}>
          Savings: <strong>{savings}</strong>
        </Text>
      </div>
      {topCategories.length > 0 && (
        <div style={styles.highlight}>
          <Text style={{ ...styles.text, fontWeight: 600, margin: "0 0 8px" }}>
            Where your money went
          </Text>
          {topCategories.map((c) => (
            <Text key={c.name} style={{ ...styles.text, margin: "0 0 4px" }}>
              {c.name}: <strong>{c.amount}</strong>
            </Text>
          ))}
        </div>
      )}
      <Button href={`${appUrl}/dashboard`} style={styles.button}>
        View full report
      </Button>
    </BaseLayout>
  );
}
