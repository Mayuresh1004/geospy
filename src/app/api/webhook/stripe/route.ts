import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/payments/stripe";
import type Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { sendPaymentSuccessEmail } from "@/lib/email/send";
import { format } from "date-fns";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event;

  try {
    if (!stripe) {
      throw new Error("Stripe not configured");
    }
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error("[v0] Webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const planId = session.metadata?.planId;

        if (!userId || !planId) {
          throw new Error("Missing metadata");
        }

        await supabaseAdmin.from("subscriptions").insert({
          user_id: userId,
          status: "active",
          plan_id: planId,
          stripe_subscription_id: session.subscription as string,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
        });

        await supabaseAdmin.from("payments").insert({
          user_id: userId,
          amount: (session.amount_total || 0) / 100,
          currency: session.currency || "usd",
          status: "succeeded",
          payment_provider: "stripe",
          provider_payment_id: session.payment_intent as string,
        });

        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (profile && session.customer_email) {
          await sendPaymentSuccessEmail(
            session.customer_email,
            profile.full_name || "User",
            (session.amount_total || 0) / 100,
            session.currency || "usd",
            planId,
            format(
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              "MMMM dd, yyyy"
            )
          );
        }

        break;
      }

      case "invoice.payment_succeeded": {
        const invoice: Stripe.Invoice = event.data.object;
        const subscriptionId = invoice.id as string;

        const { data: subscription } = await supabaseAdmin
          .from("subscriptions")
          .select("*")
          .eq("stripe_subscription_id", subscriptionId)
          .single();

        if (subscription) {
          await supabaseAdmin
            .from("subscriptions")
            .update({
              status: "active",
              current_period_start: new Date(
                invoice.period_start * 1000
              ).toISOString(),
              current_period_end: new Date(
                invoice.period_end * 1000
              ).toISOString(),
            })
            .eq("stripe_subscription_id", subscriptionId);

          await supabaseAdmin.from("payments").insert({
            user_id: subscription.user_id,
            amount: (invoice.amount_paid || 0) / 100,
            currency: invoice.currency || "usd",
            status: "succeeded",
            payment_provider: "stripe",
            provider_payment_id: invoice.id as string,
          });

          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("*")
            .eq("id", subscription.user_id)
            .single();

          if (profile && invoice.customer_email) {
            await sendPaymentSuccessEmail(
              invoice.customer_email,
              profile.full_name || "User",
              (invoice.amount_paid || 0) / 100,
              invoice.currency || "usd",
              subscription.plan_id,
              format(new Date(invoice.period_end * 1000), "MMMM dd, yyyy")
            );
          }
        }

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;

        await supabaseAdmin
          .from("subscriptions")
          .update({ status: "canceled" })
          .eq("stripe_subscription_id", subscription.id);

        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[v0] Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
