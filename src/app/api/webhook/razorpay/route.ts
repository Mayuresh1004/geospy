import { NextResponse } from "next/server";
import { headers } from "next/headers";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("x-razorpay-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest("hex");

  if (signature !== expectedSignature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const event = JSON.parse(body);

    switch (event.event) {
      case "subscription.activated": {
        const subscription = event.payload.subscription.entity;
        const userId = subscription.notes?.userId;
        const planId = subscription.notes?.planId;

        if (!userId || !planId) {
          throw new Error("Missing metadata");
        }

        await supabaseAdmin.from("subscriptions").insert({
          user_id: userId,
          status: "active" as const,
          plan_id: planId,
          razorpay_subscription_id: subscription.id,
          current_period_start: new Date(
            subscription.start_at * 1000
          ).toISOString(),
          current_period_end: new Date(
            subscription.end_at * 1000
          ).toISOString(),
        });

        break;
      }

      case "payment.captured": {
        const payment = event.payload.payment.entity;
        const subscriptionId = payment.subscription_id;

        const { data: subscription } = await supabaseAdmin
          .from("subscriptions")
          .select("*")
          .eq("razorpay_subscription_id", subscriptionId)
          .maybeSingle();

        if (subscription) {
          await supabaseAdmin.from("payments").insert({
            user_id: subscription.user_id,
            amount: payment.amount / 100,
            currency: payment.currency,
            status: "succeeded" as const,
            payment_provider: "razorpay" as const,
            provider_payment_id: payment.id,
          });
        }

        break;
      }

      case "subscription.cancelled": {
        const subscription = event.payload.subscription.entity;

        await supabaseAdmin
          .from("subscriptions")
          .update({ status: "canceled" as const })
          .eq("razorpay_subscription_id", subscription.id);

        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[v0] Razorpay webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
