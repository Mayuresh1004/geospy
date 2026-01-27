import { Html, Head, Body, Container, Section, Text, Button, Hr } from "@react-email/components"

interface PasswordResetEmailProps {
  name: string
  resetUrl: string
}

export function PasswordResetEmail({ name, resetUrl }: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Text style={heading}>Reset Your Password</Text>
            <Text style={paragraph}>Hi {name},</Text>
            <Text style={paragraph}>
              We received a request to reset your password. Click the button below to create a new password:
            </Text>
            <Button style={button} href={resetUrl}>
              Reset Password
            </Button>
            <Text style={paragraph}>This link will expire in 1 hour for security reasons.</Text>
            <Text style={paragraph}>
              If you didn&apos;t request a password reset, you can safely ignore this email. Your password will not be
              changed.
            </Text>
            <Hr style={hr} />
            <Text style={footer}>
              For security reasons, this link can only be used once. If you need to reset your password again, please
              request a new reset link.
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

const button = {
  backgroundColor: "#000000",
  borderRadius: "5px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  width: "100%",
  padding: "12px",
  marginTop: "24px",
  marginBottom: "24px",
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
