import { Html, Head, Body, Container, Section, Text, Link, Hr } from "@react-email/components"

interface PaymentSuccessEmailProps {
  name: string
  amount: number
  currency: string
  planName: string
  nextBillingDate: string
}

export function PaymentSuccessEmail({ name, amount, currency, planName, nextBillingDate }: PaymentSuccessEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Text style={heading}>Payment Successful!</Text>
            <Text style={paragraph}>Hi {name},</Text>
            <Text style={paragraph}>
              Thank you for your payment. Your subscription to the {planName} plan has been confirmed.
            </Text>
            <Section style={receiptBox}>
              <Text style={receiptTitle}>Payment Details</Text>
              <Hr style={hr} />
              <table style={table}>
                <tr>
                  <td style={tableLabel}>Plan:</td>
                  <td style={tableValue}>{planName}</td>
                </tr>
                <tr>
                  <td style={tableLabel}>Amount:</td>
                  <td style={tableValue}>
                    {currency.toUpperCase()} {amount.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td style={tableLabel}>Next Billing Date:</td>
                  <td style={tableValue}>{nextBillingDate}</td>
                </tr>
              </table>
            </Section>
            <Text style={paragraph}>
              You can manage your subscription and view your billing history in your{" "}
              <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`} style={link}>
                billing dashboard
              </Link>
              .
            </Text>
            <Hr style={hr} />
            <Text style={footer}>
              If you have any questions about your payment, please contact our{" "}
              <Link href="mailto:support@example.com" style={link}>
                support team
              </Link>
              .
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
}

const box = {
  padding: "0 48px",
}

const heading = {
  fontSize: "32px",
  lineHeight: "1.3",
  fontWeight: "700",
  color: "#484848",
}

const paragraph = {
  fontSize: "16px",
  lineHeight: "1.4",
  color: "#484848",
}

const receiptBox = {
  backgroundColor: "#f6f9fc",
  borderRadius: "5px",
  padding: "24px",
  margin: "24px 0",
}

const receiptTitle = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#484848",
  margin: "0 0 12px 0",
}

const table = {
  width: "100%",
}

const tableLabel = {
  fontSize: "14px",
  color: "#8898aa",
  paddingBottom: "8px",
}

const tableValue = {
  fontSize: "14px",
  color: "#484848",
  fontWeight: "600",
  textAlign: "right" as const,
  paddingBottom: "8px",
}

const hr = {
  borderColor: "#e6ebf1",
  margin: "20px 0",
}

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
}

const link = {
  color: "#556cd6",
}
