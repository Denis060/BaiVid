import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { inngest } from "@/lib/inngest";
import type { Database } from "@/types/supabase";

function getServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return new NextResponse(renderPage("Invalid Link", "No rejection token provided."), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  const supabase = getServiceClient();

  const { data: approval } = await supabase
    .from("autopilot_approvals")
    .select("id, run_id, user_id, status, expires_at")
    .eq("token", token)
    .single();

  if (!approval) {
    return new NextResponse(renderPage("Not Found", "This rejection link is invalid."), {
      status: 404,
      headers: { "Content-Type": "text/html" },
    });
  }

  if (approval.status !== "pending") {
    return new NextResponse(renderPage("Already Decided", `This request was already ${approval.status}.`), {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
  }

  if (approval.expires_at && new Date(approval.expires_at) < new Date()) {
    return new NextResponse(renderPage("Expired", "This link has expired."), {
      status: 410,
      headers: { "Content-Type": "text/html" },
    });
  }

  await supabase
    .from("autopilot_approvals")
    .update({ status: "rejected", decided_at: new Date().toISOString() })
    .eq("id", approval.id);

  await inngest.send({
    name: "autopilot/approval-decision",
    data: {
      runId: approval.run_id,
      decision: "rejected",
      userId: approval.user_id,
    },
  });

  return new NextResponse(
    renderPage("Rejected", "The autopilot content has been rejected. A new idea will be generated on the next run."),
    { status: 200, headers: { "Content-Type": "text/html" } }
  );
}

function renderPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Baivid Autopilot</title>
  <style>
    body { font-family: Inter, system-ui, sans-serif; background: #0f0f0f; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .card { background: #1a1a1a; border-radius: 16px; padding: 48px; max-width: 420px; text-align: center; }
    h1 { font-size: 24px; margin: 0 0 12px; }
    p { color: #999; font-size: 14px; line-height: 1.6; margin: 0 0 24px; }
    a { display: inline-block; background: #0a7c4e; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; }
    a:hover { background: #0d9960; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://baivid.com"}/autopilot">Go to Dashboard</a>
  </div>
</body>
</html>`;
}
