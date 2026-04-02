import { Button, Section, Text } from "@react-email/components";
import * as React from "react";
import { BaseLayout, emailStyles } from "./base-layout";

interface MilestoneReachedEmailProps {
  milestone?: string;
  metricValue?: string;
  message?: string;
}

export function MilestoneReachedEmail({
  milestone = "1,000 Views",
  metricValue = "1,000",
  message = "Your videos have been viewed over 1,000 times!",
}: MilestoneReachedEmailProps) {
  return (
    <BaseLayout preview={`Milestone reached: ${milestone}`}>
      <Text style={emailStyles.heading}>Milestone Reached!</Text>
      <Section
        style={{
          ...emailStyles.card,
          textAlign: "center" as const,
          padding: "32px 24px",
        }}
      >
        <Text
          style={{
            fontSize: "48px",
            margin: "0 0 8px",
          }}
        >
          🎉
        </Text>
        <Text
          style={{
            fontSize: "28px",
            fontWeight: "700",
            color: "#0d9960",
            margin: "0 0 8px",
          }}
        >
          {metricValue}
        </Text>
        <Text
          style={{
            fontSize: "16px",
            fontWeight: "600",
            color: "#ffffff",
            margin: "0 0 4px",
          }}
        >
          {milestone}
        </Text>
        <Text style={{ ...emailStyles.muted, margin: "0" }}>{message}</Text>
      </Section>
      <Text style={emailStyles.text}>
        Keep up the great work! Your content is resonating with your audience.
      </Text>
      <Section style={{ marginBottom: "24px" }}>
        <Button
          href={`${process.env.NEXT_PUBLIC_APP_URL}/analytics`}
          style={emailStyles.button}
        >
          View Analytics
        </Button>
      </Section>
    </BaseLayout>
  );
}

export default MilestoneReachedEmail;
