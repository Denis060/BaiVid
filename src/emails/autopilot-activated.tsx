import { Button, Section, Text } from "@react-email/components";
import * as React from "react";
import { BaseLayout, emailStyles } from "./base-layout";

interface AutopilotActivatedEmailProps {
  profileName?: string;
  niche?: string;
  frequency?: string;
  platformCount?: number;
}

export function AutopilotActivatedEmail({
  profileName = "My Autopilot",
  niche = "technology",
  frequency = "daily",
  platformCount = 2,
}: AutopilotActivatedEmailProps) {
  return (
    <BaseLayout preview={`Autopilot "${profileName}" is now live!`}>
      <Text style={emailStyles.heading}>Autopilot is Live!</Text>
      <Section style={emailStyles.card}>
        <Text style={{ ...emailStyles.text, margin: "0 0 8px" }}>
          Your autopilot profile <span style={emailStyles.highlight}>{profileName}</span> is
          now active and will start creating content automatically.
        </Text>
        <Text style={{ ...emailStyles.text, margin: "0 0 4px" }}>
          &#x2022; Niche: <strong>{niche}</strong>
        </Text>
        <Text style={{ ...emailStyles.text, margin: "0 0 4px" }}>
          &#x2022; Frequency: <strong>{frequency}</strong>
        </Text>
        <Text style={{ ...emailStyles.text, margin: "0" }}>
          &#x2022; Publishing to <strong>{platformCount}</strong> platform{platformCount !== 1 ? "s" : ""}
        </Text>
      </Section>
      <Text style={emailStyles.text}>
        You can pause, edit, or monitor your autopilot anytime from the dashboard.
      </Text>
      <Section style={{ marginBottom: "24px" }}>
        <Button
          href={`${process.env.NEXT_PUBLIC_APP_URL}/autopilot`}
          style={emailStyles.button}
        >
          View Autopilot Dashboard
        </Button>
      </Section>
    </BaseLayout>
  );
}

export default AutopilotActivatedEmail;
