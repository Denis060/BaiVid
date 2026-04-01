import { Button, Section, Text } from "@react-email/components";
import * as React from "react";
import { BaseLayout, emailStyles } from "./base-layout";

interface PaymentFailedEmailProps {
  planName?: string;
}

export function PaymentFailedEmail({
  planName = "Pro",
}: PaymentFailedEmailProps) {
  return (
    <BaseLayout preview="Payment failed — please update your payment method">
      <Text style={emailStyles.heading}>Payment Failed</Text>
      <Section style={emailStyles.card}>
        <Text style={emailStyles.text}>
          We were unable to process payment for your{" "}
          <strong>{planName}</strong> plan. Your subscription may be
          interrupted if this isn&apos;t resolved.
        </Text>
      </Section>
      <Text style={emailStyles.text}>
        Please update your payment method to continue using Baivid without
        interruption.
      </Text>
      <Section style={{ marginBottom: "24px" }}>
        <Button
          href={`${process.env.NEXT_PUBLIC_APP_URL}/billing`}
          style={emailStyles.button}
        >
          Update Payment Method
        </Button>
      </Section>
      <Text style={emailStyles.muted}>
        If you believe this is an error, please contact support.
      </Text>
    </BaseLayout>
  );
}

export default PaymentFailedEmail;
