"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export type AuthResult = {
  error?: string;
  success?: string;
};

export async function login(formData: FormData): Promise<AuthResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const next = (formData.get("next") as string) || "/dashboard";

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const supabase = await createClient();
  const { error, data } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  // Check if first login — log signup bonus + send welcome email
  if (data.user) {
    const { count } = await supabase
      .from("credits_transactions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", data.user.id)
      .eq("type", "bonus");

    if (count === 0) {
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

      try {
        const { sendWelcomeEmail } = await import("@/lib/email");
        const name = data.user.user_metadata?.full_name || "there";
        await sendWelcomeEmail(data.user.email!, name, data.user.id);
      } catch (err) {
        console.error("Welcome email failed:", err);
      }
    }
  }

  redirect(next);
}

export async function signup(formData: FormData): Promise<AuthResult> {
  const fullName = formData.get("fullName") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!fullName || !email || !password) {
    return { error: "All fields are required" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: "Check your email to confirm your account" };
}

export async function signInWithGoogle(next?: string) {
  const supabase = await createClient();
  const headersList = await headers();
  const origin = headersList.get("origin") || process.env.NEXT_PUBLIC_APP_URL;

  const redirectTo = `${origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}

export async function forgotPassword(formData: FormData): Promise<AuthResult> {
  const email = formData.get("email") as string;

  if (!email) {
    return { error: "Email is required" };
  }

  const supabase = await createClient();
  const headersList = await headers();
  const origin = headersList.get("origin") || process.env.NEXT_PUBLIC_APP_URL;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: "Check your email for a password reset link" };
}

export async function resetPassword(formData: FormData): Promise<AuthResult> {
  const password = formData.get("password") as string;

  if (!password) {
    return { error: "Password is required" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}
