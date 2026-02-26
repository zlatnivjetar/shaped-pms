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

interface PreArrivalProps {
  guestFirstName: string;
  propertyName: string;
  propertyAddress?: string;
  checkIn: string;
  checkInTime?: string;
  roomTypeName: string;
  confirmationCode: string;
}

export default function PreArrival({
  guestFirstName,
  propertyName,
  propertyAddress,
  checkIn,
  checkInTime,
  roomTypeName,
  confirmationCode,
}: PreArrivalProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Your check-in at {propertyName} is tomorrow — we&apos;re ready for you!
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
              See you tomorrow!
            </Heading>
            <Text style={{ color: MUTED, fontSize: "15px" }}>
              Hi {guestFirstName}, your stay at {propertyName} begins tomorrow.
              Here&apos;s everything you need for a smooth arrival.
            </Text>

            <Hr style={{ borderColor: "#e7e5e4", margin: "24px 0" }} />

            <Heading
              as="h3"
              style={{ color: BRAND, fontSize: "14px", marginBottom: "12px" }}
            >
              CHECK-IN DETAILS
            </Heading>
            <Text style={{ color: BRAND, fontSize: "14px", margin: "0 0 4px" }}>
              <strong>Date:</strong> {formatEmailDate(checkIn)}
            </Text>
            {checkInTime && (
              <Text style={{ color: BRAND, fontSize: "14px", margin: "4px 0" }}>
                <strong>Check-in from:</strong> {checkInTime}
              </Text>
            )}
            <Text style={{ color: BRAND, fontSize: "14px", margin: "4px 0" }}>
              <strong>Room:</strong> {roomTypeName}
            </Text>
            <Text style={{ color: BRAND, fontSize: "14px", margin: "4px 0" }}>
              <strong>Booking ref:</strong> {confirmationCode}
            </Text>

            {propertyAddress && (
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
                  HOW TO FIND US
                </Heading>
                <Text style={{ color: BRAND, fontSize: "14px", margin: 0 }}>
                  {propertyAddress}
                </Text>
              </>
            )}

            <Hr style={{ borderColor: "#e7e5e4", margin: "24px 0" }} />
            <Text style={{ color: MUTED, fontSize: "13px" }}>
              If you have any questions before your arrival, simply reply to
              this email and we&apos;ll be happy to help.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
