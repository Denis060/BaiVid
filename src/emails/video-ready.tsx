import { Button, Section, Text } from "@react-email/components";
import * as React from "react";
import { BaseLayout, emailStyles } from "./base-layout";

interface VideoReadyEmailProps {
  videoTitle?: string;
  videoType?: string;
}

export function VideoReadyEmail({
  videoTitle = "My Video",
  videoType = "faceless",
}: VideoReadyEmailProps) {
  return (
    <BaseLayout preview={`Your video "${videoTitle}" is ready to view`}>
      <Text style={emailStyles.heading}>Your Video is Ready!</Text>
      <Section style={emailStyles.card}>
        <Text style={{ ...emailStyles.muted, margin: "0 0 4px" }}>
          {videoType.charAt(0).toUpperCase() + videoType.slice(1)} Video
        </Text>
        <Text
          style={{
            ...emailStyles.text,
            fontSize: "18px",
            fontWeight: "600",
            color: "#ffffff",
            margin: "0",
          }}
        >
          {videoTitle}
        </Text>
      </Section>
      <Text style={emailStyles.text}>
        Your video has finished processing and is ready to view, download, or
        schedule for publishing.
      </Text>
      <Section style={{ marginBottom: "24px" }}>
        <Button
          href={`${process.env.NEXT_PUBLIC_APP_URL}/videos`}
          style={emailStyles.button}
        >
          View Video
        </Button>
      </Section>
    </BaseLayout>
  );
}

export default VideoReadyEmail;
