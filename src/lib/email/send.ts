import { resend, FROM_EMAIL } from "./resend"
import { WelcomeEmail } from "@/emails/welcome-email"
import { PaymentSuccessEmail } from "@/emails/payment-success-email"
import { PasswordResetEmail } from "@/emails/password-reset-email"

export async function sendWelcomeEmail(to: string, name: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Welcome to SaaS MVP!",
      react: WelcomeEmail({
        name,
        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      }),
    })

    if (error) {
      console.error("[v0] Failed to send welcome email:", error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error("[v0] Error sending welcome email:", error)
    return { success: false, error }
  }
}

export async function sendPaymentSuccessEmail(
  to: string,
  name: string,
  amount: number,
  currency: string,
  planName: string,
  nextBillingDate: string,
) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Payment Successful - SaaS MVP",
      react: PaymentSuccessEmail({
        name,
        amount,
        currency,
        planName,
        nextBillingDate,
      }),
    })

    if (error) {
      console.error("[v0] Failed to send payment success email:", error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error("[v0] Error sending payment success email:", error)
    return { success: false, error }
  }
}

export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Reset Your Password - SaaS MVP",
      react: PasswordResetEmail({
        name,
        resetUrl,
      }),
    })

    if (error) {
      console.error("[v0] Failed to send password reset email:", error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error("[v0] Error sending password reset email:", error)
    return { success: false, error }
  }
}
