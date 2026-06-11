import { Button, Text } from "@react-email/components";
import { BaseLayout, styles } from "./base-layout";

export function SubscriptionReminderEmail({
  name,
  subscriptionName,
  amount,
  renewalDate,
  appUrl,
}: {
  name: string;
  subscriptionName: string;
  amount: string;
  renewalDate: string;
  appUrl: string;
}) {
  return (
    <BaseLayout
      preview={`${subscriptionName} renews on ${renewalDate}`}
      heading="Subscription renewal coming up"
    >
      <Text style={styles.text}>Hi {name},</Text>
      <Text style={styles.text}>
        Your <strong>{subscriptionName}</strong> subscription renews on{" "}
        <strong>{renewalDate}</strong> for <strong>{amount}</strong>.
      </Text>
      <Button href={`${appUrl}/subscriptions`} style={styles.button}>
        Manage subscriptions
      </Button>
    </BaseLayout>
  );
}
