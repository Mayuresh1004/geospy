import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/forAuth";
import {
  stripe,
  STRIPE_PLANS,
  isStripeConfigured,
} from "@/lib/payments/stripe";
import {
  razorpay,
  RAZORPAY_PLANS,
  isRazorpayConfigured,
} from "@/lib/payments/razorpay";

const PAYMENT_PROVIDER = (process.env.PAYMENT_PROVIDER || "stripe") as
  | "stripe"
  | "razorpay";

export async function POST(request: Request) {
  try {
    if (!isStripeConfigured() && !isRazorpayConfigured()) {
      return NextResponse.json(
        {
          error:
            "Payment system not configured. Please add payment provider credentials.",
        },
        { status: 503 }
      );
    }

    const { planId } = await request.json();

    const supabase = await getSupabaseServerClient();

    let user;
    try {
      const getUserPromise = supabase.auth.getUser();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Supabase request timeout")), 5000)
      );

      const result = await Promise.race([
        getUserPromise,
        timeoutPromise,
      ]) as { data?: { user?: { id: string; email?: string } } };
      user = result?.data?.user;
    } catch {
      return NextResponse.json(
        {
          error: "Authentication service unavailable. Please try again later.",
        },
        { status: 503 }
      );
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      // Continue without profile - not critical for checkout
    } catch {
      // Continue without profile - not critical for checkout
    }

    if (PAYMENT_PROVIDER === "stripe") {
      if (!isStripeConfigured() || !stripe) {
        return NextResponse.json(
          { error: "Stripe is not configured. Please add Stripe credentials." },
          { status: 503 }
        );
      }

      const plan = STRIPE_PLANS[planId as keyof typeof STRIPE_PLANS];
      if (!plan) {
        return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
      }

      try {
        const session = await stripe.checkout.sessions.create({
          customer_email: user.email,
          line_items: [
            {
              price: plan.priceId,
              quantity: 1,
            },
          ],
          mode: "subscription",
          success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/billing?success=true`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/billing?canceled=true`,
          metadata: {
            userId: user.id,
            planId,
          },
        });

        return NextResponse.json({ url: session.url });
      } catch (stripeError) {
        console.error("[v0] Stripe error:", stripeError);
        return NextResponse.json(
          {
            error:
              "Failed to create Stripe checkout session. Please try again.",
          },
          { status: 500 }
        );
      }
    } else {
      if (!isRazorpayConfigured() || !razorpay) {
        return NextResponse.json(
          {
            error:
              "Razorpay is not configured. Please add Razorpay credentials.",
          },
          { status: 503 }
        );
      }

      const plan = RAZORPAY_PLANS[planId as keyof typeof RAZORPAY_PLANS];
      if (!plan) {
        return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
      }

      try {
        // For testing: Create a simple order instead of subscription
        const order = await razorpay.orders.create({
          amount: plan.price, // Amount in paise
          currency: "INR",
          receipt: `ord_${Date.now().toString().slice(-8)}`, // Max 40 chars, using last 8 digits of timestamp
          notes: {
            userId: user.id,
            planId,
            planName: plan.name,
            type: "test_payment",
          },
        });

        return NextResponse.json({
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          razorpayKeyId: process.env.RAZORPAY_KEY_ID,
          userId: user.id,
          success: true,
        });
      } catch (razorpayError) {
        console.error("[v0] Razorpay error:", razorpayError);
        return NextResponse.json(
          {
            error: "Failed to create Razorpay subscription. Please try again.",
          },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error("[v0] Checkout error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create checkout session",
      },
      { status: 500 }
    );
  }
}
