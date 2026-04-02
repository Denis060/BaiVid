import { Button, Section, Text } from "@react-email/components";
import * as React from "react";
import { BaseLayout, emailStyles } from "./base-layout";

interface IdeaGeneratedEmailProps {
  ideaTitle?: string;
  viralityScore?: number;
  niche?: string;
}

export function IdeaGeneratedEmail({
  ideaTitle = "10 AI Tools for Creators",
  viralityScore = 85,
  niche = "technology",
}: IdeaGeneratedEmailProps) {
  return (
    <BaseLayout preview={`New video idea: "${ideaTitle}" (Score: ${viralityScore})`}>
      <Text style={emailStyles.heading}>New Video Idea</Text>
      <Section style={emailStyles.card}>
        <Text style={{ ...emailStyles.muted, margin: "0 0 4px" }}>
          {niche} &middot; Virality Score
        </Text>
        <Text
          style={{
            ...emailStyles.text,
            fontSize: "18px",
            fontWeight: "600",
            color: "#ffffff",
            margin: "0 0 8px",
          }}
        >
          {ideaTitle}
        </Text>
        <Text style={emailStyles.text}>
          Virality Score:{" "}
          <span style={{ ...emailStyles.highlight, fontSize: "18px" }}>
            {viralityScore}/100
          </span>
        </Text>
      </Section>
      <Text style={emailStyles.text}>
        Autopilot generated this trending idea for your channel. Review it
        or let it proceed to scripting.
      </Text>
      <Section style={{ marginBottom: "24px" }}>
        <Button
          href={`${process.env.NEXT_PUBLIC_APP_URL}/ideas`}
          style={emailStyles.button}
        >
          View Idea
        </Button>
      </Section>
    </BaseLayout>
  );
}

export default IdeaGeneratedEmail;
