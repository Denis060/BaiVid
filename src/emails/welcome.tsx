import { Button, Section, Text } from "@react-email/components";
import * as React from "react";
import { BaseLayout, emailStyles } from "./base-layout";

interface WelcomeEmailProps {
  name?: string;
}

export function WelcomeEmail({ name = "there" }: WelcomeEmailProps) {
  return (
    <BaseLayout preview="Welcome to Baivid — your AI video creation platform">
      <Text style={emailStyles.heading}>Welcome to Baivid!</Text>
      <Text style={emailStyles.text}>
        Hey {name}, thanks for signing up! You&apos;ve got{" "}
        <span style={emailStyles.highlight}>50 free credits</span> to start
        creating AI-powered videos.
      </Text>
      <Section style={emailStyles.card}>
        <Text style={{ ...emailStyles.text, margin: "0 0 8px" }}>
          Here&apos;s what you can do:
        </Text>
        <Text style={{ ...emailStyles.text, margin: "0 0 4px" }}>
          &#x2022; Generate faceless videos with AI voiceover
        </Text>
        <Text style={{ ...emailStyles.text, margin: "0 0 4px" }}>
          &#x2022; Create avatar talking-head videos
        </Text>
        <Text style={{ ...emailStyles.text, margin: "0 0 4px" }}>
          &#x2022; Schedule and publish to social platforms
        </Text>
        <Text style={{ ...emailStyles.text, margin: "0" }}>
          &#x2022; Use Autopilot for hands-free content
        </Text>
      </Section>
      <Section style={{ marginBottom: "24px" }}>
        <Button
          href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`}
          style={emailStyles.button}
        >
          Go to Dashboard
        </Button>
      </Section>
    </BaseLayout>
  );
}

export default WelcomeEmail;
