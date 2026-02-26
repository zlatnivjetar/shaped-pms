import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Hr,
  Section,
  Preview,
  Button,
} from "@react-email/components";
import { BRAND, MUTED, formatEmailDate } from "./shared";

interface PostStayProps {
  guestFirstName: string;
  propertyName: string;
  checkOut: string;
  reviewUrl: string;
  confirmationCode: string;
}

export default function PostStay({
  guestFirstName,
  propertyName,
  checkOut,
  reviewUrl,
  confirmationCode,
}: PostStayProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Thank you for staying at {propertyName} — share your experience
      </Preview>
      <Body style={{ backgroundColor: "#f5f5f4", fontFamily: "sans-serif" }}>
        <Container
          style={{
            maxWidth: "600px",
            margin: "40px auto",
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          <Section style={{ backgroundColor: BRAND, padding: "32px 40px" }}>
            <Heading
              style={{ color: "#ffffff", fontSize: "20px", margin: 0 }}
            >
              {propertyName}
            </Heading>
          </Section>

          <Section style={{ padding: "40px" }}>
            <Heading
              as="h2"
              style={{ color: BRAND, fontSize: "22px", marginTop: 0 }}
            >
              Thank you for your stay!
            </Heading>
            <Text style={{ color: MUTED, fontSize: "15px" }}>
              Hi {guestFirstName}, we hope you had a wonderful time at{" "}
              {propertyName}. It was a pleasure having you with us
              {checkOut ? ` through ${formatEmailDate(checkOut)}` : ""}.
            </Text>
            <Text style={{ color: MUTED, fontSize: "15px" }}>
              Your booking reference was <strong>{confirmationCode}</strong>.
            </Text>

            <Hr style={{ borderColor: "#e7e5e4", margin: "24px 0" }} />

            <Text style={{ color: BRAND, fontSize: "15px", fontWeight: "500" }}>
              How was your experience?
            </Text>
            <Text style={{ color: MUTED, fontSize: "14px" }}>
              Your feedback means the world to us and helps future guests make
              informed decisions. It only takes a minute!
            </Text>

            <Section style={{ textAlign: "center" as const, margin: "32px 0" }}>
              <Button
                href={reviewUrl}
                style={{
                  backgroundColor: BRAND,
                  color: "#ffffff",
                  padding: "14px 32px",
                  borderRadius: "6px",
                  fontSize: "15px",
                  fontWeight: "600",
                  textDecoration: "none",
                  display: "inline-block",
                }}
              >
                Leave a Review
              </Button>
            </Section>

            <Text style={{ color: MUTED, fontSize: "12px" }}>
              This link expires in 30 days. If you have any issues, simply
              reply to this email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
