import { Button, Section, Text } from "@react-email/components";
import * as React from "react";
import { BaseLayout, emailStyles } from "./base-layout";

interface AutopilotApprovalEmailProps {
  profileName?: string;
  stage?: string;
  approveUrl?: string;
  rejectUrl?: string;
}

export function AutopilotApprovalEmail({
  profileName = "Tech Channel",
  stage = "script",
  approveUrl = "#",
  rejectUrl = "#",
}: AutopilotApprovalEmailProps) {
  return (
    <BaseLayout preview={`Autopilot needs your approval — ${stage} for "${profileName}"`}>
      <Text style={emailStyles.heading}>Approval Required</Text>
      <Section style={emailStyles.card}>
        <Text style={{ ...emailStyles.muted, margin: "0 0 4px" }}>
          Autopilot Profile
        </Text>
        <Text
          style={{
            ...emailStyles.text,
            fontSize: "16px",
            fontWeight: "600",
            color: "#ffffff",
            margin: "0 0 12px",
          }}
        >
          {profileName}
        </Text>
        <Text style={emailStyles.text}>
          The <span style={emailStyles.highlight}>{stage}</span> stage is
          ready for your review. Please approve or reject to continue the
          pipeline.
        </Text>
      </Section>
      <Section style={{ marginBottom: "16px" }}>
        <Button href={approveUrl} style={emailStyles.button}>
          Approve
        </Button>
      </Section>
      <Section style={{ marginBottom: "24px" }}>
        <Button
          href={rejectUrl}
          style={{
            ...emailStyles.button,
            backgroundColor: "transparent",
            border: "1px solid #333333",
            color: "#cccccc",
          }}
        >
          Reject
        </Button>
      </Section>
      <Text style={emailStyles.muted}>
        You can also review this in your Baivid dashboard.
      </Text>
    </BaseLayout>
  );
}

export default AutopilotApprovalEmail;
