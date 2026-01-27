import Stripe from "stripe"

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-12-15.clover",
      typescript: true,
    })
  : null

export const STRIPE_PLANS = {
  starter: {
    priceId: process.env.STRIPE_STARTER_PRICE_ID || "price_starter",
    name: "Starter",
    price: 1900,
  },
  pro: {
    priceId: process.env.STRIPE_PRO_PRICE_ID || "price_pro",
    name: "Pro",
    price: 4900,
  },
}

export const isStripeConfigured = () => {
  return !!process.env.STRIPE_SECRET_KEY
}
