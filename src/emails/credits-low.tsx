import { Button, Section, Text } from "@react-email/components";
import * as React from "react";
import { BaseLayout, emailStyles } from "./base-layout";

interface CreditsLowEmailProps {
  currentBalance: number;
  planCredits: number;
  planName: string;
}

export function CreditsLowEmail({
  currentBalance = 75,
  planCredits = 500,
  planName = "Starter",
}: CreditsLowEmailProps) {
  const percentage = Math.round((currentBalance / planCredits) * 100);

  return (
    <BaseLayout preview={`Your Baivid credits are running low — ${currentBalance} remaining`}>
      <Text style={emailStyles.heading}>Credits Running Low</Text>
      <Section style={emailStyles.card}>
        <Text style={emailStyles.text}>
          You have <span style={emailStyles.highlight}>{currentBalance}</span> credits
          remaining out of your {planCredits} monthly allocation on the{" "}
          <strong>{planName}</strong> plan ({percentage}% remaining).
        </Text>
      </Section>
      <Text style={emailStyles.text}>
        To keep creating videos without interruption, top up your credits or
        upgrade your plan.
      </Text>
      <Section style={{ marginBottom: "24px" }}>
        <Button
          href={`${process.env.NEXT_PUBLIC_APP_URL}/billing`}
          style={emailStyles.button}
        >
          Buy More Credits
        </Button>
      </Section>
      <Text style={emailStyles.muted}>
        You can disable these alerts in your email preferences.
      </Text>
    </BaseLayout>
  );
}

export default CreditsLowEmail;
