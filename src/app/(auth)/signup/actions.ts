"use server";

import { getSupabaseServerClient } from "@/lib/supabase/forAuth";
import { redirect } from "next/navigation";
import { sendWelcomeEmail } from "@/lib/email/send";

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;

  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo:
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    await sendWelcomeEmail(email, fullName || "User");
  }

  redirect("/dashboard");
}
