import { render } from "@react-email/components";
import { getResend } from "./resend";
import { WelcomeEmail } from "@/emails/welcome";
import { CreditsLowEmail } from "@/emails/credits-low";
import { PaymentFailedEmail } from "@/emails/payment-failed";
import { VideoReadyEmail } from "@/emails/video-ready";
import { AutopilotApprovalEmail } from "@/emails/autopilot-approval";
import { AutopilotActivatedEmail } from "@/emails/autopilot-activated";

const FROM = "Baivid <noreply@baivid.com>";

export async function sendWelcomeEmail(to: string, name: string) {
  const html = await render(WelcomeEmail({ name }));
  return getResend().emails.send({
    from: FROM,
    to,
    subject: "Welcome to Baivid!",
    html,
  });
}

export async function sendCreditsLowEmail(
  to: string,
  currentBalance: number,
  planCredits: number,
  planName: string
) {
  const html = await render(
    CreditsLowEmail({ currentBalance, planCredits, planName })
  );
  return getResend().emails.send({
    from: FROM,
    to,
    subject: "Your Baivid credits are running low",
    html,
  });
}

export async function sendPaymentFailedEmail(to: string, planName: string) {
  const html = await render(PaymentFailedEmail({ planName }));
  return getResend().emails.send({
    from: FROM,
    to,
    subject: "Payment failed — please update your payment method",
    html,
  });
}

export async function sendVideoReadyEmail(
  to: string,
  videoTitle: string,
  videoType: string
) {
  const html = await render(VideoReadyEmail({ videoTitle, videoType }));
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Your video "${videoTitle}" is ready`,
    html,
  });
}

export async function sendAutopilotApprovalEmail(
  to: string,
  profileName: string,
  stage: string,
  approveUrl: string,
  rejectUrl: string
) {
  const html = await render(
    AutopilotApprovalEmail({ profileName, stage, approveUrl, rejectUrl })
  );
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Autopilot needs your approval — ${stage}`,
    html,
  });
}

export async function sendAutopilotActivatedEmail(
  to: string,
  profileName: string,
  niche: string,
  frequency: string,
  platformCount: number
) {
  const html = await render(
    AutopilotActivatedEmail({ profileName, niche, frequency, platformCount })
  );
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Autopilot "${profileName}" is now live!`,
    html,
  });
}
