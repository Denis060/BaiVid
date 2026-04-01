import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface BaseLayoutProps {
  preview: string;
  children: React.ReactNode;
}

export function BaseLayout({ preview, children }: BaseLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img
              src={`${process.env.NEXT_PUBLIC_APP_URL}/icon.png`}
              width="40"
              height="40"
              alt="Baivid"
              style={logo}
            />
            <Text style={brandName}>Baivid</Text>
          </Section>
          {children}
          <Hr style={hr} />
          <Text style={footer}>
            &copy; {new Date().getFullYear()} Baivid. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#0f0f0f",
  fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const container = {
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "560px",
};

const header = {
  display: "flex" as const,
  alignItems: "center" as const,
  gap: "8px",
  marginBottom: "32px",
};

const logo = {
  borderRadius: "8px",
};

const brandName = {
  fontSize: "20px",
  fontWeight: "700" as const,
  color: "#ffffff",
  margin: "0",
  paddingLeft: "8px",
};

const hr = {
  borderColor: "#2a2a2a",
  margin: "32px 0 16px",
};

const footer = {
  color: "#666666",
  fontSize: "12px",
};

// Shared styles for email templates
export const emailStyles = {
  heading: {
    fontSize: "24px",
    fontWeight: "700" as const,
    color: "#ffffff",
    margin: "0 0 16px",
  },
  text: {
    fontSize: "14px",
    lineHeight: "24px",
    color: "#cccccc",
    margin: "0 0 16px",
  },
  button: {
    backgroundColor: "#0a7c4e",
    borderRadius: "8px",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "600" as const,
    textDecoration: "none" as const,
    textAlign: "center" as const,
    display: "inline-block" as const,
    padding: "12px 24px",
  },
  card: {
    backgroundColor: "#1a1a1a",
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "16px",
  },
  highlight: {
    color: "#0d9960",
    fontWeight: "600" as const,
  },
  muted: {
    color: "#888888",
    fontSize: "13px",
  },
};
