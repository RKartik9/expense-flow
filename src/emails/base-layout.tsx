import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export const styles = {
  body: { backgroundColor: "#f4f4f5", fontFamily: "Helvetica, Arial, sans-serif", margin: 0 },
  container: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    margin: "32px auto",
    padding: "32px",
    maxWidth: "480px",
  },
  brand: { color: "#6366f1", fontSize: "18px", fontWeight: 700 as const, margin: "0 0 24px" },
  h1: { color: "#18181b", fontSize: "22px", fontWeight: 700 as const, margin: "0 0 16px" },
  text: { color: "#3f3f46", fontSize: "14px", lineHeight: "22px", margin: "0 0 12px" },
  muted: { color: "#a1a1aa", fontSize: "12px", lineHeight: "18px", margin: "16px 0 0" },
  button: {
    backgroundColor: "#6366f1",
    borderRadius: "8px",
    color: "#ffffff",
    display: "inline-block",
    fontSize: "14px",
    fontWeight: 600 as const,
    padding: "12px 24px",
    textDecoration: "none",
  },
  hr: { borderColor: "#e4e4e7", margin: "24px 0" },
  highlight: {
    backgroundColor: "#f4f4f5",
    borderRadius: "8px",
    padding: "16px",
    margin: "16px 0",
  },
};

export function BaseLayout({
  preview,
  heading,
  children,
}: {
  preview: string;
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Text style={styles.brand}>ExpenseFlow</Text>
          <Heading style={styles.h1}>{heading}</Heading>
          <Section>{children}</Section>
          <Hr style={styles.hr} />
          <Text style={styles.muted}>
            You are receiving this email because you have an ExpenseFlow account or were invited
            by a member. Manage your email preferences in Settings.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
