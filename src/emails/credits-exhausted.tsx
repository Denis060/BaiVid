import { Button, Section, Text } from "@react-email/components";
import * as React from "react";
import { BaseLayout, emailStyles } from "./base-layout";

export function CreditsExhaustedEmail() {
  return (
    <BaseLayout preview="Your Baivid credits have run out — autopilot paused">
      <Text style={emailStyles.heading}>Credits Exhausted</Text>
      <Section style={emailStyles.card}>
        <Text
          style={{
            ...emailStyles.text,
            fontSize: "32px",
            fontWeight: "700",
            color: "#ef4444",
            textAlign: "center" as const,
            margin: "0 0 8px",
          }}
        >
          0
        </Text>
        <Text
          style={{
            ...emailStyles.text,
            textAlign: "center" as const,
            margin: "0",
          }}
        >
          credits remaining
        </Text>
      </Section>
      <Text style={emailStyles.text}>
        Your credit balance has reached zero. Autopilot has been paused and
        you won&apos;t be able to create new videos until you top up or your
        plan renews.
      </Text>
      <Section style={{ marginBottom: "24px" }}>
        <Button
          href={`${process.env.NEXT_PUBLIC_APP_URL}/billing`}
          style={emailStyles.button}
        >
          Buy Credits
        </Button>
      </Section>
    </BaseLayout>
  );
}

export default CreditsExhaustedEmail;
