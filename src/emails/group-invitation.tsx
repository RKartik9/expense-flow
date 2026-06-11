import { Button, Text } from "@react-email/components";
import { BaseLayout, styles } from "./base-layout";

export function GroupInvitationEmail({
  inviterName,
  groupName,
  appUrl,
}: {
  inviterName: string;
  groupName: string;
  appUrl: string;
}) {
  return (
    <BaseLayout
      preview={`${inviterName} invited you to join "${groupName}" on ExpenseFlow`}
      heading="You've been invited!"
    >
      <Text style={styles.text}>
        <strong>{inviterName}</strong> invited you to join the group{" "}
        <strong>&ldquo;{groupName}&rdquo;</strong> on ExpenseFlow to track and split shared
        expenses.
      </Text>
      <Text style={styles.text}>
        Join the group to see shared expenses, split bills, and settle up easily.
      </Text>
      <Button href={`${appUrl}/sign-up`} style={styles.button}>
        Accept invitation
      </Button>
    </BaseLayout>
  );
}
