import { Button, Text } from "@react-email/components";
import { BaseLayout, styles } from "./base-layout";

export function SplitCreatedEmail({
  creatorName,
  splitTitle,
  totalAmount,
  yourShare,
  currency,
  splitUrl,
}: {
  creatorName: string;
  splitTitle: string;
  totalAmount: string;
  yourShare: string;
  currency: string;
  splitUrl: string;
}) {
  return (
    <BaseLayout
      preview={`${creatorName} added you to a split: ${splitTitle}`}
      heading="You've been added to a split"
    >
      <Text style={styles.text}>
        <strong>{creatorName}</strong> added you to the split{" "}
        <strong>&ldquo;{splitTitle}&rdquo;</strong>.
      </Text>
      <div style={styles.highlight}>
        <Text style={{ ...styles.text, margin: 0 }}>
          Total: <strong>{totalAmount}</strong> {currency}
          <br />
          Your share: <strong>{yourShare}</strong> {currency}
        </Text>
      </div>
      <Button href={splitUrl} style={styles.button}>
        View split
      </Button>
    </BaseLayout>
  );
}
