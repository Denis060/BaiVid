import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe() {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-03-25.dahlia",
      typescript: true,
    });
  }
  return _stripe;
}

// Plan definitions with credits and Stripe price IDs
export const PLANS = {
  free: {
    name: "Free",
    price: 0,
    credits: 50,
    priceId: null,
    features: [
      "50 credits/month",
      "Faceless videos only",
      "720p export",
      "Baivid watermark",
    ],
  },
  starter: {
    name: "Starter",
    price: 12,
    credits: 500,
    priceId: process.env.STRIPE_PRICE_ID_STARTER || "",
    features: [
      "500 credits/month",
      "Faceless + Avatar videos",
      "1080p export",
      "No watermark",
      "5 scheduled posts",
    ],
  },
  pro: {
    name: "Pro",
    price: 29,
    credits: 1500,
    priceId: process.env.STRIPE_PRICE_ID_PRO || "",
    features: [
      "1,500 credits/month",
      "All video types",
      "4K export",
      "Autopilot mode",
      "Unlimited scheduling",
      "Priority support",
    ],
  },
  agency: {
    name: "Agency",
    price: 79,
    credits: 5000,
    priceId: process.env.STRIPE_PRICE_ID_AGENCY || "",
    features: [
      "5,000 credits/month",
      "All video types",
      "4K export",
      "Autopilot mode",
      "Unlimited scheduling",
      "Priority support",
      "API access",
      "Team collaboration",
    ],
  },
} as const;

export const TOPUP_PACKS = [
  {
    name: "Micro",
    credits: 100,
    price: 2,
    priceId: process.env.STRIPE_PRICE_ID_TOPUP_MICRO || "",
  },
  {
    name: "Small",
    credits: 300,
    price: 5,
    priceId: process.env.STRIPE_PRICE_ID_TOPUP_SMALL || "",
  },
  {
    name: "Standard",
    credits: 800,
    price: 12,
    priceId: process.env.STRIPE_PRICE_ID_TOPUP_STANDARD || "",
  },
  {
    name: "Value",
    credits: 2000,
    price: 25,
    priceId: process.env.STRIPE_PRICE_ID_TOPUP_VALUE || "",
  },
  {
    name: "Pro",
    credits: 6000,
    price: 60,
    priceId: process.env.STRIPE_PRICE_ID_TOPUP_PRO || "",
  },
] as const;

// Map Stripe price IDs back to plan keys
export function getPlanByPriceId(
  priceId: string
): keyof typeof PLANS | null {
  for (const [key, plan] of Object.entries(PLANS)) {
    if (plan.priceId === priceId) {
      return key as keyof typeof PLANS;
    }
  }
  return null;
}

// Map Stripe price IDs to top-up pack
export function getTopupByPriceId(priceId: string) {
  return TOPUP_PACKS.find((pack) => pack.priceId === priceId) || null;
}
