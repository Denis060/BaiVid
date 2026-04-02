/**
 * Platform publisher router — dispatches to the correct publisher.
 */

import type { PublishInput, PublishResult, PlatformKey } from "./types";
import { publishToYouTube } from "./youtube";
import { publishToTikTok } from "./tiktok";
import { publishToInstagram } from "./instagram";
import { publishToFacebook } from "./facebook";
import { publishToLinkedIn } from "./linkedin";
import { publishToPinterest } from "./pinterest";
import { publishToTwitter } from "./twitter";
import { publishToReddit } from "./reddit";
import { publishToThreads } from "./threads";

export async function publishToplatform(
  platform: PlatformKey,
  input: PublishInput
): Promise<PublishResult> {
  switch (platform) {
    case "youtube":
      return publishToYouTube(input);
    case "tiktok":
      return publishToTikTok(input);
    case "instagram":
      return publishToInstagram(input);
    case "facebook":
      return publishToFacebook(input);
    case "linkedin":
      return publishToLinkedIn(input);
    case "pinterest":
      return publishToPinterest(input);
    case "twitter":
      return publishToTwitter(input);
    case "reddit":
      return publishToReddit(input);
    case "threads":
      return publishToThreads(input);
    default:
      return { success: false, error: `Unsupported platform: ${platform}` };
  }
}

export { type PublishInput, type PublishResult, type PlatformKey, PLATFORM_CONFIG } from "./types";
