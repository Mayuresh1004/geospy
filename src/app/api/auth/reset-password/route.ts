import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/forAuth";
import { sendPasswordResetEmail } from "@/lib/email/send";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabase = await getSupabaseServerClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", email)
      .single();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (profile) {
      await sendPasswordResetEmail(
        email,
        profile.full_name || "User",
        `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[v0] Password reset error:", error);
    return NextResponse.json(
      { error: "Failed to send reset email" },
      { status: 500 }
    );
  }
}
