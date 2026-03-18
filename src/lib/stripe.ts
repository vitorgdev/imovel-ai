import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const PLANS = {
  free: {
    name: "Free",
    limit: 3,
    price: 0,
    priceId: null,
  },
  basic: {
    name: "Basic",
    limit: 20,
    price: 1990, // centavos (R$19,90)
    priceId: process.env.STRIPE_BASIC_PRICE_ID!,
  },
  pro: {
    name: "Pro",
    limit: 100,
    price: 4990, // centavos (R$49,90)
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export function getPlanByPriceId(priceId: string): PlanKey | null {
  if (priceId === PLANS.basic.priceId) return "basic";
  if (priceId === PLANS.pro.priceId) return "pro";
  return null;
}
