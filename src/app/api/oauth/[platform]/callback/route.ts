import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getOAuthConfig, getClientCredentials } from "@/lib/oauth-config";
import { encrypt } from "@/lib/encryption";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const origin = process.env.NEXT_PUBLIC_APP_URL || "https://baivid.com";
  const settingsUrl = `${origin}/settings/connections`;

  if (error) {
    return NextResponse.redirect(
      `${settingsUrl}?error=${encodeURIComponent(error)}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(`${settingsUrl}?error=missing_code`);
  }

  // Verify state (CSRF protection)
  const cookieStore = await cookies();
  const storedState = cookieStore.get(`oauth_state_${platform}`)?.value;
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(`${settingsUrl}?error=invalid_state`);
  }

  // Decode state to get userId
  let userId: string;
  try {
    const stateData = JSON.parse(
      Buffer.from(state, "base64url").toString("utf-8")
    );
    userId = stateData.userId;
  } catch {
    return NextResponse.redirect(`${settingsUrl}?error=invalid_state`);
  }

  // Verify the user is still authenticated
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) {
    return NextResponse.redirect(`${settingsUrl}?error=unauthorized`);
  }

  const config = getOAuthConfig(platform);
  if (!config) {
    return NextResponse.redirect(`${settingsUrl}?error=unsupported_platform`);
  }

  const creds = getClientCredentials(config);
  if (!creds) {
    return NextResponse.redirect(`${settingsUrl}?error=not_configured`);
  }

  const redirectUri = `${origin}/api/oauth/${platform}/callback`;

  // Exchange code for tokens
  try {
    const tokenBody: Record<string, string> = {
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    };

    // Twitter PKCE
    if (platform === "twitter") {
      const codeVerifier = cookieStore.get(`oauth_verifier_${platform}`)?.value;
      if (codeVerifier) {
        tokenBody.code_verifier = codeVerifier;
      }
    }

    // Reddit uses Basic auth for token exchange
    const headers: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded",
    };

    if (platform === "reddit") {
      headers["Authorization"] = `Basic ${Buffer.from(
        `${creds.clientId}:${creds.clientSecret}`
      ).toString("base64")}`;
      delete tokenBody.client_id;
      delete tokenBody.client_secret;
    }

    const tokenRes = await fetch(config.tokenUrl, {
      method: "POST",
      headers,
      body: new URLSearchParams(tokenBody).toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error(`OAuth token exchange failed for ${platform}:`, errText);
      return NextResponse.redirect(`${settingsUrl}?error=token_exchange_failed`);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token || null;
    const expiresIn = tokenData.expires_in;

    if (!accessToken) {
      return NextResponse.redirect(`${settingsUrl}?error=no_access_token`);
    }

    // Fetch user profile from platform
    const profile = await fetchPlatformProfile(platform, accessToken);

    // Calculate token expiry
    const tokenExpiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000).toISOString()
      : null;

    // Save to connected_accounts (upsert)
    await supabase.from("connected_accounts").upsert(
      {
        user_id: userId,
        platform: platform as "youtube" | "tiktok" | "instagram" | "facebook" | "linkedin" | "pinterest" | "twitter" | "reddit" | "threads",
        platform_user_id: profile.id,
        platform_username: profile.username,
        access_token: encrypt(accessToken),
        refresh_token: refreshToken ? encrypt(refreshToken) : null,
        token_expires_at: tokenExpiresAt,
        scopes: config.scopes,
      },
      { onConflict: "user_id,platform,platform_user_id" }
    );

    // Clean up cookies
    const response = NextResponse.redirect(
      `${settingsUrl}?connected=${platform}`
    );
    response.cookies.delete(`oauth_state_${platform}`);
    response.cookies.delete(`oauth_verifier_${platform}`);
    return response;
  } catch (err) {
    console.error(`OAuth callback error for ${platform}:`, err);
    return NextResponse.redirect(`${settingsUrl}?error=callback_failed`);
  }
}

/**
 * Fetch the user's profile from the connected platform.
 */
async function fetchPlatformProfile(
  platform: string,
  accessToken: string
): Promise<{ id: string; username: string | null }> {
  try {
    switch (platform) {
      case "youtube": {
        const res = await fetch(
          "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const data = await res.json();
        const channel = data.items?.[0];
        return {
          id: channel?.id || "unknown",
          username: channel?.snippet?.title || null,
        };
      }
      case "tiktok": {
        const res = await fetch(
          "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name",
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const data = await res.json();
        return {
          id: data.data?.user?.open_id || "unknown",
          username: data.data?.user?.display_name || null,
        };
      }
      case "instagram": {
        const res = await fetch(
          `https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`
        );
        const data = await res.json();
        return { id: data.id || "unknown", username: data.username || null };
      }
      case "facebook": {
        const res = await fetch(
          `https://graph.facebook.com/me?fields=id,name&access_token=${accessToken}`
        );
        const data = await res.json();
        return { id: data.id || "unknown", username: data.name || null };
      }
      case "linkedin": {
        const res = await fetch("https://api.linkedin.com/v2/userinfo", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json();
        return { id: data.sub || "unknown", username: data.name || null };
      }
      case "pinterest": {
        const res = await fetch("https://api.pinterest.com/v5/user_account", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json();
        return { id: data.id || "unknown", username: data.username || null };
      }
      case "twitter": {
        const res = await fetch("https://api.twitter.com/2/users/me", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json();
        return {
          id: data.data?.id || "unknown",
          username: data.data?.username || null,
        };
      }
      case "reddit": {
        const res = await fetch("https://oauth.reddit.com/api/v1/me", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json();
        return { id: data.id || "unknown", username: data.name || null };
      }
      case "threads": {
        const res = await fetch(
          `https://graph.threads.net/v1.0/me?fields=id,username&access_token=${accessToken}`
        );
        const data = await res.json();
        return { id: data.id || "unknown", username: data.username || null };
      }
      default:
        return { id: "unknown", username: null };
    }
  } catch {
    return { id: "unknown", username: null };
  }
}
