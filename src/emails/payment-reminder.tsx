import { Button, Text } from "@react-email/components";
import { BaseLayout, styles } from "./base-layout";

export function PaymentReminderEmail({
  payerName,
  splitTitle,
  outstanding,
  splitUrl,
}: {
  payerName: string;
  splitTitle: string;
  outstanding: string;
  splitUrl: string;
}) {
  return (
    <BaseLayout preview="You have a pending payment" heading="You have a pending payment">
      <Text style={styles.text}>
        Friendly reminder — you still owe <strong>{outstanding}</strong> to{" "}
        <strong>{payerName}</strong> for <strong>&ldquo;{splitTitle}&rdquo;</strong>.
      </Text>
      <Text style={styles.text}>Settle your balance to keep things square.</Text>
      <Button href={splitUrl} style={styles.button}>
        Settle up
      </Button>
    </BaseLayout>
  );
}
