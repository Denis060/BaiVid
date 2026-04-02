import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      // Check if this is a first-time login (no signup bonus logged yet)
      const { count } = await supabase
        .from("credits_transactions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", data.user.id)
        .eq("type", "bonus");

      if (count === 0) {
        // Log the signup bonus transaction
        const { data: userProfile } = await supabase
          .from("users")
          .select("credits_balance")
          .eq("id", data.user.id)
          .single();

        await supabase.from("credits_transactions").insert({
          user_id: data.user.id,
          amount: 50,
          type: "bonus",
          description: "Welcome bonus — 50 free credits",
          balance_after: userProfile?.credits_balance || 50,
        });

        // Send welcome email (fire and forget)
        try {
          const { sendWelcomeEmail } = await import("@/lib/email");
          const name =
            data.user.user_metadata?.full_name ||
            data.user.user_metadata?.name ||
            "there";
          await sendWelcomeEmail(data.user.email!, name, data.user.id);
        } catch (err) {
          console.error("Welcome email failed:", err);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
