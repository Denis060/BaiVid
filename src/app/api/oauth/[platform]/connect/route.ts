import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOAuthConfig, getClientCredentials } from "@/lib/oauth-config";
import { randomUUID, createHash } from "crypto";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;

  // Verify user is authenticated
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/auth/login?next=/settings/connections`
    );
  }

  const config = getOAuthConfig(platform);
  if (!config) {
    return NextResponse.json(
      { error: `Unsupported platform: ${platform}` },
      { status: 400 }
    );
  }

  const creds = getClientCredentials(config);
  if (!creds) {
    return NextResponse.json(
      { error: `OAuth not configured for ${platform}. Missing client credentials.` },
      { status: 500 }
    );
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL || "https://baivid.com";
  const redirectUri = `${origin}/api/oauth/${platform}/callback`;

  // Generate state token (includes user ID for security)
  const state = Buffer.from(
    JSON.stringify({ userId: user.id, nonce: randomUUID() })
  ).toString("base64url");

  // Build authorization URL
  const authParams = new URLSearchParams({
    client_id: creds.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: config.scopes.join(" "),
    state,
    ...config.extraAuthParams,
  });

  // Twitter PKCE: generate code_verifier and code_challenge
  if (platform === "twitter") {
    const codeVerifier = randomUUID() + randomUUID();
    const codeChallenge = createHash("sha256")
      .update(codeVerifier)
      .digest("base64url");

    authParams.set("code_challenge", codeChallenge);
    authParams.set("code_challenge_method", "S256");

    // Store code_verifier in a cookie for the callback
    const response = NextResponse.redirect(
      `${config.authUrl}?${authParams.toString()}`
    );
    response.cookies.set(`oauth_verifier_${platform}`, codeVerifier, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });
    response.cookies.set(`oauth_state_${platform}`, state, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });
    return response;
  }

  // Store state in cookie for CSRF verification
  const response = NextResponse.redirect(
    `${config.authUrl}?${authParams.toString()}`
  );
  response.cookies.set(`oauth_state_${platform}`, state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return response;
}
