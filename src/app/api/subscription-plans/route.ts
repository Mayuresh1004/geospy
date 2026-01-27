import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use admin client to fetch public plans
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data: plans, error } = await supabaseAdmin
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .order("price", { ascending: true });

    if (error) {
      console.error("Error fetching subscription plans:", error);
      return NextResponse.json(
        { error: "Failed to fetch plans" },
        { status: 500 }
      );
    }

    return NextResponse.json({ plans: plans || [] });
  } catch (error) {
    console.error("Subscription plans API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
