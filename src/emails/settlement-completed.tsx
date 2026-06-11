import { Button, Text } from "@react-email/components";
import { BaseLayout, styles } from "./base-layout";

export function SettlementCompletedEmail({
  counterpartyName,
  splitTitle,
  amount,
  splitUrl,
}: {
  counterpartyName: string;
  splitTitle: string;
  amount: string;
  splitUrl: string;
}) {
  return (
    <BaseLayout preview="Settlement completed" heading="Settlement completed">
      <Text style={styles.text}>
        A payment of <strong>{amount}</strong> between you and{" "}
        <strong>{counterpartyName}</strong> for <strong>&ldquo;{splitTitle}&rdquo;</strong> has
        been recorded as completed.
      </Text>
      <Button href={splitUrl} style={styles.button}>
        View details
      </Button>
    </BaseLayout>
  );
}
