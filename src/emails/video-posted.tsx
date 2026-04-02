import { Button, Section, Text } from "@react-email/components";
import * as React from "react";
import { BaseLayout, emailStyles } from "./base-layout";

interface VideoPostedEmailProps {
  videoTitle?: string;
  platform?: string;
  postUrl?: string;
}

export function VideoPostedEmail({
  videoTitle = "My Video",
  platform = "YouTube",
  postUrl = "#",
}: VideoPostedEmailProps) {
  return (
    <BaseLayout preview={`"${videoTitle}" published to ${platform}`}>
      <Text style={emailStyles.heading}>Video Published!</Text>
      <Section style={emailStyles.card}>
        <Text style={{ ...emailStyles.muted, margin: "0 0 4px" }}>
          {platform}
        </Text>
        <Text
          style={{
            ...emailStyles.text,
            fontSize: "16px",
            fontWeight: "600",
            color: "#ffffff",
            margin: "0",
          }}
        >
          {videoTitle}
        </Text>
      </Section>
      <Text style={emailStyles.text}>
        Your video has been successfully published to {platform}. It may take
        a few minutes to fully process on the platform.
      </Text>
      <Section style={{ marginBottom: "24px" }}>
        <Button href={postUrl} style={emailStyles.button}>
          View on {platform}
        </Button>
      </Section>
    </BaseLayout>
  );
}

export default VideoPostedEmail;
