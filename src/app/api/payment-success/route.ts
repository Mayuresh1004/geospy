import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use admin client for secure operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { paymentId, orderId, planId, userId } =
      await request.json();

    if (!paymentId || !planId || !userId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Get the subscription plan
    const { data: plan, error: planError } = await supabaseAdmin
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (planError || !plan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Create a payment record
    const { error: paymentError } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: userId,
        amount: plan.price,
        currency: plan.currency,
        status: "succeeded" as const,
        payment_provider: "razorpay" as const,
        provider_payment_id: paymentId,
      });

    if (paymentError) {
      console.error("Payment record creation error:", paymentError);
      return NextResponse.json(
        { error: "Failed to record payment" },
        { status: 500 }
      );
    }

    // Check if user already has an active subscription
    const { data: existingSubscription } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (existingSubscription) {
      // Update existing subscription
      const { error: updateError } = await supabaseAdmin
        .from("subscriptions")
        .update({
          plan_id: planId,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(), // 30 days from now
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingSubscription.id);

      if (updateError) {
        console.error("Subscription update error:", updateError);
        return NextResponse.json(
          { error: "Failed to update subscription" },
          { status: 500 }
        );
      }
    } else {
      // Create new subscription
      const { error: subscriptionError } = await supabaseAdmin
        .from("subscriptions")
        .insert({
          user_id: userId,
          status: "active" as const,
          plan_id: planId,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(), // 30 days from now
          cancel_at_period_end: false,
          razorpay_subscription_id: orderId, // Using orderId as subscription reference
        });

      if (subscriptionError) {
        console.error("Subscription creation error:", subscriptionError);
        return NextResponse.json(
          { error: "Failed to create subscription" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Subscription activated successfully",
      redirectUrl: "/dashboard/billing?success=true",
    });
  } catch (error) {
    console.error("Payment success handler error:", error);
    return NextResponse.json(
      { error: "Failed to process payment success" },
      { status: 500 }
    );
  }
}
