import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { getStripe, getPlanByPriceId, getTopupByPriceId, PLANS } from "@/lib/stripe";
import { sendPaymentFailedEmail } from "@/lib/email";
import type { Database } from "@/types/supabase";
import type Stripe from "stripe";

// Use service role client for webhook operations (bypasses RLS)
function getServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    );
  }

  const supabase = getServiceClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        await handleCheckoutCompleted(supabase, event.data.object as Stripe.Checkout.Session);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        await handleSubscriptionUpsert(supabase, event.data.object as Stripe.Subscription);
        break;
      }
      case "customer.subscription.deleted": {
        await handleSubscriptionDeleted(supabase, event.data.object as Stripe.Subscription);
        break;
      }
      case "invoice.payment_succeeded": {
        await handlePaymentSucceeded(supabase, event.data.object as Stripe.Invoice);
        break;
      }
      case "invoice.payment_failed": {
        await handlePaymentFailed(supabase, event.data.object as Stripe.Invoice);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error(`Webhook handler error for ${event.type}:`, err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}

// --- Handler Functions ---

async function handleCheckoutCompleted(
  supabase: ReturnType<typeof getServiceClient>,
  session: Stripe.Checkout.Session
) {
  const userId = session.metadata?.supabase_user_id;
  if (!userId) return;

  // Handle one-time payments (top-up packs)
  if (session.mode === "payment") {
    const stripe = getStripe();
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
    const priceId = lineItems.data[0]?.price?.id;
    if (!priceId) return;

    const topup = getTopupByPriceId(priceId);
    if (!topup) return;

    // Get current balance
    const { data: user } = await supabase
      .from("users")
      .select("credits_balance")
      .eq("id", userId)
      .single();

    if (!user) return;

    const newBalance = user.credits_balance + topup.credits;

    // Update credits
    await supabase
      .from("users")
      .update({ credits_balance: newBalance })
      .eq("id", userId);

    // Log transaction
    await supabase.from("credits_transactions").insert({
      user_id: userId,
      amount: topup.credits,
      type: "purchase",
      description: `${topup.name} — ${topup.credits} credits`,
      reference_id: session.id,
      balance_after: newBalance,
    });
  }
}

async function handleSubscriptionUpsert(
  supabase: ReturnType<typeof getServiceClient>,
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string;

  // Find user by stripe_customer_id
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!user) return;

  const firstItem = subscription.items.data[0];
  const priceId = firstItem?.price?.id;
  if (!priceId) return;

  const planKey = getPlanByPriceId(priceId);
  if (!planKey) return;

  // Upsert subscription record
  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("stripe_subscription_id", subscription.id)
    .single();

  const subData = {
    user_id: user.id,
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    plan: planKey,
    status: subscription.status,
    current_period_start: new Date(firstItem.current_period_start * 1000).toISOString(),
    current_period_end: new Date(firstItem.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
  };

  if (existingSub) {
    await supabase
      .from("subscriptions")
      .update(subData)
      .eq("id", existingSub.id);
  } else {
    await supabase.from("subscriptions").insert(subData);
  }

  // Update user plan
  await supabase
    .from("users")
    .update({ plan: planKey })
    .eq("id", user.id);
}

async function handleSubscriptionDeleted(
  supabase: ReturnType<typeof getServiceClient>,
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string;

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!user) return;

  // Mark subscription as canceled
  await supabase
    .from("subscriptions")
    .update({ status: "canceled", cancel_at_period_end: false })
    .eq("stripe_subscription_id", subscription.id);

  // Downgrade to free
  await supabase
    .from("users")
    .update({ plan: "free" })
    .eq("id", user.id);
}

async function handlePaymentSucceeded(
  supabase: ReturnType<typeof getServiceClient>,
  invoice: Stripe.Invoice
) {
  // Only handle subscription invoices (not one-time)
  const isSubscriptionInvoice =
    invoice.billing_reason === "subscription_cycle" ||
    invoice.billing_reason === "subscription_create" ||
    invoice.billing_reason === "subscription_update";
  if (!isSubscriptionInvoice) return;

  const customerId = invoice.customer as string;
  const { data: user } = await supabase
    .from("users")
    .select("id, plan, credits_balance")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!user) return;

  // Get the plan's credit allocation
  const plan = PLANS[user.plan as keyof typeof PLANS];
  if (!plan) return;

  // Refresh credits to plan amount
  await supabase
    .from("users")
    .update({ credits_balance: plan.credits })
    .eq("id", user.id);

  // Log credit refresh
  await supabase.from("credits_transactions").insert({
    user_id: user.id,
    amount: plan.credits,
    type: "subscription",
    description: `Monthly credit refresh — ${plan.name} plan`,
    reference_id: invoice.id,
    balance_after: plan.credits,
  });
}

async function handlePaymentFailed(
  supabase: ReturnType<typeof getServiceClient>,
  invoice: Stripe.Invoice
) {
  const customerId = invoice.customer as string;
  const { data: user } = await supabase
    .from("users")
    .select("id, email, plan")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!user) return;

  const planNames: Record<string, string> = {
    free: "Free",
    starter: "Starter",
    pro: "Pro",
    agency: "Agency",
  };

  // Send payment failed email using React Email template
  try {
    const result = await sendPaymentFailedEmail(
      user.email,
      planNames[user.plan] || "Unknown"
    );

    await supabase.from("email_logs").insert({
      user_id: user.id,
      type: "payment_failed",
      subject: "Payment failed — please update your payment method",
      resend_id: result.data?.id || null,
      status: "sent",
    });
  } catch (err) {
    console.error("Failed to send payment failed email:", err);
  }
}
