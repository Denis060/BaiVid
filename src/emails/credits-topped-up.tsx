import { Button, Section, Text } from "@react-email/components";
import * as React from "react";
import { BaseLayout, emailStyles } from "./base-layout";

interface CreditsToppedUpEmailProps {
  creditsAdded?: number;
  newBalance?: number;
  source?: string;
}

export function CreditsToppedUpEmail({
  creditsAdded = 300,
  newBalance = 450,
  source = "Small Pack",
}: CreditsToppedUpEmailProps) {
  return (
    <BaseLayout preview={`${creditsAdded} credits added — balance: ${newBalance}`}>
      <Text style={emailStyles.heading}>Credits Added!</Text>
      <Section style={emailStyles.card}>
        <Text
          style={{
            ...emailStyles.text,
            fontSize: "32px",
            fontWeight: "700",
            color: "#0d9960",
            textAlign: "center" as const,
            margin: "0 0 4px",
          }}
        >
          +{creditsAdded}
        </Text>
        <Text
          style={{
            ...emailStyles.text,
            textAlign: "center" as const,
            margin: "0 0 16px",
          }}
        >
          credits from {source}
        </Text>
        <Text
          style={{
            ...emailStyles.muted,
            textAlign: "center" as const,
            margin: "0",
          }}
        >
          New balance: <strong style={{ color: "#ffffff" }}>{newBalance.toLocaleString()}</strong> credits
        </Text>
      </Section>
      <Section style={{ marginBottom: "24px" }}>
        <Button
          href={`${process.env.NEXT_PUBLIC_APP_URL}/create`}
          style={emailStyles.button}
        >
          Start Creating
        </Button>
      </Section>
    </BaseLayout>
  );
}

export default CreditsToppedUpEmail;
