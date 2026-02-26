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
  Row,
  Column,
} from "@react-email/components";
import { BRAND, MUTED, formatCurrency, formatEmailDate } from "./shared";

interface BookingConfirmationProps {
  guestFirstName: string;
  confirmationCode: string;
  propertyName: string;
  propertyAddress?: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  roomTypeName: string;
  totalCents: number;
  currency: string;
  amountPaidCents: number;
  paymentType: "deposit" | "full_payment";
  checkInTime?: string;
}

export default function BookingConfirmation({
  guestFirstName,
  confirmationCode,
  propertyName,
  propertyAddress,
  checkIn,
  checkOut,
  nights,
  roomTypeName,
  totalCents,
  currency,
  amountPaidCents,
  paymentType,
  checkInTime,
}: BookingConfirmationProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Your booking is confirmed — {confirmationCode} · {propertyName}
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
          {/* Header */}
          <Section style={{ backgroundColor: BRAND, padding: "32px 40px" }}>
            <Heading
              style={{ color: "#ffffff", fontSize: "20px", margin: 0 }}
            >
              {propertyName}
            </Heading>
          </Section>

          {/* Body */}
          <Section style={{ padding: "40px" }}>
            <Heading
              as="h2"
              style={{ color: BRAND, fontSize: "22px", marginTop: 0 }}
            >
              Booking Confirmed!
            </Heading>
            <Text style={{ color: MUTED, fontSize: "15px" }}>
              Hi {guestFirstName}, your reservation is confirmed. We look
              forward to welcoming you.
            </Text>

            {/* Confirmation code */}
            <Section
              style={{
                backgroundColor: "#f5f5f4",
                borderRadius: "6px",
                padding: "16px 24px",
                margin: "24px 0",
                textAlign: "center" as const,
              }}
            >
              <Text
                style={{ color: MUTED, fontSize: "12px", margin: "0 0 4px" }}
              >
                CONFIRMATION CODE
              </Text>
              <Text
                style={{
                  color: BRAND,
                  fontSize: "28px",
                  fontWeight: "bold",
                  letterSpacing: "4px",
                  margin: 0,
                }}
              >
                {confirmationCode}
              </Text>
            </Section>

            <Hr style={{ borderColor: "#e7e5e4", margin: "24px 0" }} />

            {/* Stay details */}
            <Heading
              as="h3"
              style={{ color: BRAND, fontSize: "14px", marginBottom: "12px" }}
            >
              STAY DETAILS
            </Heading>
            <Row>
              <Column>
                <Text
                  style={{ color: MUTED, fontSize: "12px", margin: "0 0 2px" }}
                >
                  CHECK-IN
                </Text>
                <Text style={{ color: BRAND, fontSize: "14px", margin: 0 }}>
                  {formatEmailDate(checkIn)}
                </Text>
                {checkInTime && (
                  <Text style={{ color: MUTED, fontSize: "12px", margin: 0 }}>
                    from {checkInTime}
                  </Text>
                )}
              </Column>
              <Column>
                <Text
                  style={{ color: MUTED, fontSize: "12px", margin: "0 0 2px" }}
                >
                  CHECK-OUT
                </Text>
                <Text style={{ color: BRAND, fontSize: "14px", margin: 0 }}>
                  {formatEmailDate(checkOut)}
                </Text>
              </Column>
            </Row>
            <Text style={{ color: BRAND, fontSize: "14px", margin: "16px 0 0" }}>
              <strong>Room:</strong> {roomTypeName}
            </Text>
            <Text style={{ color: BRAND, fontSize: "14px", margin: "4px 0 0" }}>
              <strong>Duration:</strong> {nights} night{nights !== 1 ? "s" : ""}
            </Text>

            <Hr style={{ borderColor: "#e7e5e4", margin: "24px 0" }} />

            {/* Payment */}
            <Heading
              as="h3"
              style={{ color: BRAND, fontSize: "14px", marginBottom: "12px" }}
            >
              PAYMENT SUMMARY
            </Heading>
            <Row>
              <Column>
                <Text style={{ color: BRAND, fontSize: "14px", margin: 0 }}>
                  Total stay
                </Text>
              </Column>
              <Column style={{ textAlign: "right" as const }}>
                <Text style={{ color: BRAND, fontSize: "14px", margin: 0 }}>
                  {formatCurrency(totalCents, currency)}
                </Text>
              </Column>
            </Row>
            <Row>
              <Column>
                <Text style={{ color: MUTED, fontSize: "14px", margin: 0 }}>
                  {paymentType === "deposit" ? "Deposit paid" : "Amount paid"}
                </Text>
              </Column>
              <Column style={{ textAlign: "right" as const }}>
                <Text style={{ color: MUTED, fontSize: "14px", margin: 0 }}>
                  {formatCurrency(amountPaidCents, currency)}
                </Text>
              </Column>
            </Row>
            {paymentType === "deposit" && (
              <Text
                style={{ color: MUTED, fontSize: "12px", marginTop: "8px" }}
              >
                The remaining balance of{" "}
                {formatCurrency(totalCents - amountPaidCents, currency)} will be
                collected at check-in.
              </Text>
            )}
          </Section>

          {/* Footer */}
          {propertyAddress && (
            <Section
              style={{
                backgroundColor: "#f5f5f4",
                padding: "24px 40px",
                borderTop: "1px solid #e7e5e4",
              }}
            >
              <Text
                style={{ color: MUTED, fontSize: "12px", margin: "0 0 4px" }}
              >
                PROPERTY ADDRESS
              </Text>
              <Text style={{ color: BRAND, fontSize: "13px", margin: 0 }}>
                {propertyAddress}
              </Text>
            </Section>
          )}
        </Container>
      </Body>
    </Html>
  );
}
