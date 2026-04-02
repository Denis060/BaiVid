import { Button, Section, Text } from "@react-email/components";
import * as React from "react";
import { BaseLayout, emailStyles } from "./base-layout";

interface VideoFailedEmailProps {
  videoTitle?: string;
  errorMessage?: string;
}

export function VideoFailedEmail({
  videoTitle = "My Video",
  errorMessage = "Video generation timed out",
}: VideoFailedEmailProps) {
  return (
    <BaseLayout preview={`Video failed: "${videoTitle}"`}>
      <Text style={emailStyles.heading}>Video Generation Failed</Text>
      <Section style={emailStyles.card}>
        <Text style={{ ...emailStyles.muted, margin: "0 0 4px" }}>Video</Text>
        <Text
          style={{
            ...emailStyles.text,
            fontSize: "16px",
            fontWeight: "600",
            color: "#ffffff",
            margin: "0 0 12px",
          }}
        >
          {videoTitle}
        </Text>
        <Text style={{ ...emailStyles.text, color: "#ef4444" }}>
          Error: {errorMessage}
        </Text>
      </Section>
      <Text style={emailStyles.text}>
        Don&apos;t worry — your credits have not been deducted. You can retry
        the video from your library.
      </Text>
      <Section style={{ marginBottom: "24px" }}>
        <Button
          href={`${process.env.NEXT_PUBLIC_APP_URL}/videos`}
          style={emailStyles.button}
        >
          Retry Video
        </Button>
      </Section>
    </BaseLayout>
  );
}

export default VideoFailedEmail;
