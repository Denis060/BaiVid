import { render } from "@react-email/components";
import { createClient } from "@supabase/supabase-js";
import { getResend } from "./resend";
import { WelcomeEmail } from "@/emails/welcome";
import { CreditsLowEmail } from "@/emails/credits-low";
import { CreditsExhaustedEmail } from "@/emails/credits-exhausted";
import { CreditsToppedUpEmail } from "@/emails/credits-topped-up";
import { PaymentFailedEmail } from "@/emails/payment-failed";
import { VideoReadyEmail } from "@/emails/video-ready";
import { VideoPostedEmail } from "@/emails/video-posted";
import { VideoFailedEmail } from "@/emails/video-failed";
import { AutopilotApprovalEmail } from "@/emails/autopilot-approval";
import { AutopilotActivatedEmail } from "@/emails/autopilot-activated";
import { IdeaGeneratedEmail } from "@/emails/idea-generated";
import { WeeklySummaryEmail } from "@/emails/weekly-summary";
import { MilestoneReachedEmail } from "@/emails/milestone-reached";
import type { Database } from "@/types/supabase";

const FROM = "Baivid <noreply@baivid.com>";

// Preference keys that map to email_preferences columns
const PREF_MAP: Record<string, keyof Database["public"]["Tables"]["email_preferences"]["Row"]> = {
  video_ready: "video_ready",
  video_posted: "video_ready", // Same pref as video_ready
  video_failed: "video_ready",
  credits_low: "credits_low",
  credits_exhausted: "credits_low",
  credits_topped_up: "credits_low",
  subscription_change: "subscription_change",
  payment_failed: "subscription_change",
  weekly_digest: "weekly_digest",
  autopilot_approval: "autopilot_approval",
  autopilot_activated: "autopilot_approval",
  idea_generated: "autopilot_approval",
  milestone_reached: "weekly_digest",
};

function getServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Unified email sender that checks preferences and logs to email_logs.
 */
export async function sendEmail(
  type: string,
  userId: string,
  to: string,
  subject: string,
  html: string
): Promise<{ sent: boolean; resendId?: string }> {
  const supabase = getServiceClient();

  // Check preferences (skip for welcome emails — always send)
  if (type !== "welcome") {
    const prefKey = PREF_MAP[type];
    if (prefKey) {
      const { data: prefs } = await supabase
        .from("email_preferences")
        .select("video_ready, credits_low, subscription_change, weekly_digest, autopilot_approval, marketing")
        .eq("user_id", userId)
        .single();

      if (prefs && (prefs as Record<string, boolean>)[prefKey] === false) {
        return { sent: false };
      }
    }
  }

  try {
    const result = await getResend().emails.send({
      from: FROM,
      to,
      subject,
      html,
    });

    // Log to email_logs
    const validEmailTypes = [
      "welcome", "video_ready", "credits_low", "subscription_change",
      "weekly_digest", "autopilot_approval", "idea_generated", "video_posted",
      "video_failed", "approval_reminder", "credits_critical", "credits_exhausted",
      "credits_topped_up", "credits_monthly_refresh", "autopilot_activated",
      "autopilot_paused", "autopilot_resumed", "account_reconnect",
      "plan_upgraded", "plan_downgraded", "payment_failed", "milestone_reached",
    ];

    if (validEmailTypes.includes(type)) {
      await supabase.from("email_logs").insert({
        user_id: userId,
        type: type as Database["public"]["Enums"]["email_type"],
        subject,
        resend_id: result.data?.id || null,
        status: "sent",
      });
    }

    return { sent: true, resendId: result.data?.id };
  } catch (err) {
    console.error(`Failed to send ${type} email to ${to}:`, err);
    return { sent: false };
  }
}

// ================================
// Convenience send functions
// ================================

export async function sendWelcomeEmail(to: string, name: string, userId?: string) {
  const html = await render(WelcomeEmail({ name }));
  if (userId) {
    return sendEmail("welcome", userId, to, "Welcome to Baivid!", html);
  }
  return getResend().emails.send({ from: FROM, to, subject: "Welcome to Baivid!", html });
}

export async function sendCreditsLowEmail(
  to: string, currentBalance: number, planCredits: number, planName: string, userId?: string
) {
  const html = await render(CreditsLowEmail({ currentBalance, planCredits, planName }));
  if (userId) {
    return sendEmail("credits_low", userId, to, "Your Baivid credits are running low", html);
  }
  return getResend().emails.send({ from: FROM, to, subject: "Your Baivid credits are running low", html });
}

export async function sendCreditsExhaustedEmail(to: string, userId: string) {
  const html = await render(CreditsExhaustedEmail());
  return sendEmail("credits_exhausted", userId, to, "Your Baivid credits have run out", html);
}

export async function sendCreditsToppedUpEmail(
  to: string, userId: string, creditsAdded: number, newBalance: number, source: string
) {
  const html = await render(CreditsToppedUpEmail({ creditsAdded, newBalance, source }));
  return sendEmail("credits_topped_up", userId, to, `${creditsAdded} credits added to your account`, html);
}

export async function sendPaymentFailedEmail(to: string, planName: string, userId?: string) {
  const html = await render(PaymentFailedEmail({ planName }));
  const subject = "Payment failed — please update your payment method";
  if (userId) {
    return sendEmail("payment_failed", userId, to, subject, html);
  }
  return getResend().emails.send({ from: FROM, to, subject, html });
}

export async function sendVideoReadyEmail(to: string, videoTitle: string, videoType: string, userId?: string) {
  const html = await render(VideoReadyEmail({ videoTitle, videoType }));
  const subject = `Your video "${videoTitle}" is ready`;
  if (userId) {
    return sendEmail("video_ready", userId, to, subject, html);
  }
  return getResend().emails.send({ from: FROM, to, subject, html });
}

export async function sendVideoPostedEmail(
  to: string, userId: string, videoTitle: string, platform: string, postUrl: string
) {
  const html = await render(VideoPostedEmail({ videoTitle, platform, postUrl }));
  return sendEmail("video_posted", userId, to, `"${videoTitle}" published to ${platform}`, html);
}

export async function sendVideoFailedEmail(to: string, userId: string, videoTitle: string, errorMessage: string) {
  const html = await render(VideoFailedEmail({ videoTitle, errorMessage }));
  return sendEmail("video_failed", userId, to, `Video failed: "${videoTitle}"`, html);
}

export async function sendIdeaGeneratedEmail(
  to: string, userId: string, ideaTitle: string, viralityScore: number, niche: string
) {
  const html = await render(IdeaGeneratedEmail({ ideaTitle, viralityScore, niche }));
  return sendEmail("idea_generated", userId, to, `New video idea: "${ideaTitle}"`, html);
}

export async function sendAutopilotApprovalEmail(
  to: string, profileName: string, stage: string, approveUrl: string, rejectUrl: string, userId?: string
) {
  const html = await render(AutopilotApprovalEmail({ profileName, stage, approveUrl, rejectUrl }));
  const subject = `Autopilot needs your approval — ${stage}`;
  if (userId) {
    return sendEmail("autopilot_approval", userId, to, subject, html);
  }
  return getResend().emails.send({ from: FROM, to, subject, html });
}

export async function sendAutopilotActivatedEmail(
  to: string, profileName: string, niche: string, frequency: string, platformCount: number, userId?: string
) {
  const html = await render(AutopilotActivatedEmail({ profileName, niche, frequency, platformCount }));
  const subject = `Autopilot "${profileName}" is now live!`;
  if (userId) {
    return sendEmail("autopilot_activated", userId, to, subject, html);
  }
  return getResend().emails.send({ from: FROM, to, subject, html });
}

export async function sendWeeklySummaryEmail(
  to: string,
  userId: string,
  data: {
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    videosCreated: number;
    topVideoTitle?: string;
    topVideoViews?: number;
    platformStats: { platform: string; views: number; likes: number; newFollowers: number }[];
    weekStart: string;
    weekEnd: string;
  }
) {
  const html = await render(WeeklySummaryEmail(data));
  return sendEmail(
    "weekly_digest",
    userId,
    to,
    `Weekly summary: ${data.totalViews.toLocaleString()} views`,
    html
  );
}

export async function sendMilestoneReachedEmail(
  to: string, userId: string, milestone: string, metricValue: string, message: string
) {
  const html = await render(MilestoneReachedEmail({ milestone, metricValue, message }));
  return sendEmail("milestone_reached", userId, to, `Milestone reached: ${milestone}`, html);
}
