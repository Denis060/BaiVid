import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import { facelessVideoFunction } from "@/inngest/faceless-video";
import { avatarVideoFunction } from "@/inngest/avatar-video";
import { audioVideoFunction } from "@/inngest/audio-video";
import { urlVideoFunction } from "@/inngest/url-video";
import {
  autopilotDailyCron,
  autopilotRunForUser,
  autopilotApprovalDecision,
} from "@/inngest/autopilot";
import { weeklySummaryFunction } from "@/inngest/weekly-summary";
import { publishScheduledPost } from "@/inngest/scheduler";
import { analyticsSnapshotCron } from "@/inngest/analytics-snapshot";
import { voiceCloneFunction } from "@/inngest/voice-clone";
import { videoRerenderFunction } from "@/inngest/video-rerender";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    facelessVideoFunction,
    avatarVideoFunction,
    audioVideoFunction,
    urlVideoFunction,
    autopilotDailyCron,
    autopilotRunForUser,
    autopilotApprovalDecision,
    weeklySummaryFunction,
    publishScheduledPost,
    analyticsSnapshotCron,
    voiceCloneFunction,
    videoRerenderFunction,
  ],
});
