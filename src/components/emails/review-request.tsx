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
import { BRAND, MUTED } from "./shared";

interface ReviewRequestProps {
  guestFirstName: string;
  propertyName: string;
  reviewUrl: string;
}

export default function ReviewRequest({
  guestFirstName,
  propertyName,
  reviewUrl,
}: ReviewRequestProps) {
  return (
    <Html>
      <Head />
      <Preview>
        A quick reminder — share your thoughts about {propertyName}
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
              We&apos;d love your feedback
            </Heading>
            <Text style={{ color: MUTED, fontSize: "15px" }}>
              Hi {guestFirstName}, we noticed you haven&apos;t had a chance to
              share your thoughts on your recent stay at {propertyName} yet.
            </Text>
            <Text style={{ color: MUTED, fontSize: "15px" }}>
              Your honest review helps future guests and makes a real difference
              to our small property. It only takes a minute — we promise!
            </Text>

            <Hr style={{ borderColor: "#e7e5e4", margin: "24px 0" }} />

            {/* Star rating teaser */}
            <Section style={{ textAlign: "center" as const, margin: "16px 0" }}>
              <Text
                style={{ fontSize: "32px", margin: "0 0 16px", letterSpacing: "4px" }}
              >
                ★★★★★
              </Text>
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
                Write a Review
              </Button>
            </Section>

            <Hr style={{ borderColor: "#e7e5e4", margin: "24px 0" }} />
            <Text style={{ color: MUTED, fontSize: "12px" }}>
              This is a one-time reminder. If you&apos;d prefer not to receive
              further emails, please reply to this message and we&apos;ll remove
              you from our follow-up list.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
