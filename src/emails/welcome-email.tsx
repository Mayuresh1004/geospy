import { Html, Head, Body, Container, Section, Text, Link, Button, Hr } from "@react-email/components"

interface WelcomeEmailProps {
  name: string
  dashboardUrl: string
}

export function WelcomeEmail({ name, dashboardUrl }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Text style={heading}>Welcome to SaaS MVP!</Text>
            <Text style={paragraph}>Hi {name},</Text>
            <Text style={paragraph}>
              Thank you for signing up! We&apos;re excited to have you on board. Your account has been successfully created
              and you can now access all the features.
            </Text>
            <Text style={paragraph}>Here&apos;s what you can do next:</Text>
            <ul style={list}>
              <li>Complete your profile</li>
              <li>Explore the dashboard</li>
              <li>Create your first project</li>
              <li>Invite team members</li>
            </ul>
            <Button style={button} href={dashboardUrl}>
              Go to Dashboard
            </Button>
            <Hr style={hr} />
            <Text style={footer}>
              If you have any questions, feel free to reply to this email or visit our{" "}
              <Link href="https://example.com/help" style={link}>
                help center
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

const list = {
  fontSize: "16px",
  lineHeight: "1.4",
  color: "#484848",
  paddingLeft: "20px",
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

const link = {
  color: "#556cd6",
}
