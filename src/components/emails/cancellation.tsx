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
} from "@react-email/components";
import { BRAND, MUTED, formatEmailDate } from "./shared";

interface CancellationProps {
  guestFirstName: string;
  confirmationCode: string;
  propertyName: string;
  checkIn: string;
  checkOut: string;
  cancellationReason?: string;
  refundNote?: string;
}

export default function Cancellation({
  guestFirstName,
  confirmationCode,
  propertyName,
  checkIn,
  checkOut,
  cancellationReason,
  refundNote,
}: CancellationProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Your booking {confirmationCode} at {propertyName} has been cancelled
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
              Booking Cancelled
            </Heading>
            <Text style={{ color: MUTED, fontSize: "15px" }}>
              Hi {guestFirstName}, your reservation at {propertyName} has been
              cancelled. We&apos;re sorry to see you go.
            </Text>

            <Hr style={{ borderColor: "#e7e5e4", margin: "24px 0" }} />

            <Heading
              as="h3"
              style={{ color: BRAND, fontSize: "14px", marginBottom: "12px" }}
            >
              CANCELLED BOOKING DETAILS
            </Heading>
            <Text style={{ color: BRAND, fontSize: "14px", margin: "0 0 4px" }}>
              <strong>Confirmation code:</strong> {confirmationCode}
            </Text>
            <Text style={{ color: BRAND, fontSize: "14px", margin: "4px 0" }}>
              <strong>Original check-in:</strong> {formatEmailDate(checkIn)}
            </Text>
            <Text style={{ color: BRAND, fontSize: "14px", margin: "4px 0" }}>
              <strong>Original check-out:</strong> {formatEmailDate(checkOut)}
            </Text>

            {cancellationReason && (
              <Text style={{ color: MUTED, fontSize: "14px", margin: "12px 0 0" }}>
                <strong>Reason:</strong> {cancellationReason}
              </Text>
            )}

            {refundNote && (
              <>
                <Hr style={{ borderColor: "#e7e5e4", margin: "24px 0" }} />
                <Heading
                  as="h3"
                  style={{
                    color: BRAND,
                    fontSize: "14px",
                    marginBottom: "12px",
                  }}
                >
                  REFUND INFORMATION
                </Heading>
                <Text style={{ color: MUTED, fontSize: "14px", margin: 0 }}>
                  {refundNote}
                </Text>
                <Text style={{ color: MUTED, fontSize: "12px", marginTop: "8px" }}>
                  Refunds typically appear on your statement within 5–10
                  business days depending on your bank.
                </Text>
              </>
            )}

            <Hr style={{ borderColor: "#e7e5e4", margin: "24px 0" }} />
            <Text style={{ color: MUTED, fontSize: "13px" }}>
              If you have any questions about this cancellation, please reply to
              this email and we&apos;ll be happy to help.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
