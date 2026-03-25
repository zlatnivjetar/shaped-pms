import { Section, Text } from "@react-email/components";
import {
  BRAND_FOREGROUND,
  EmailBodyText,
  EmailButton,
  EmailCodePanel,
  EmailDetailRow,
  EmailDivider,
  EmailDocument,
  EmailPanel,
  EmailSectionHeading,
  EmailTitle,
  MUTED,
  formatCurrency,
  formatEmailDate,
} from "./shared";

interface BookingConfirmationProps {
  guestFirstName: string;
  confirmationCode: string;
  propertyName: string;
  propertyAddress?: string;
  propertyPhone?: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  roomTypeName: string;
  totalCents: number;
  currency: string;
  amountPaidCents: number;
  paymentType: "deposit" | "full_payment";
  checkInTime?: string;
  manageUrl?: string;
}

export default function BookingConfirmation({
  guestFirstName,
  confirmationCode,
  propertyName,
  propertyAddress,
  propertyPhone,
  checkIn,
  checkOut,
  nights,
  roomTypeName,
  totalCents,
  currency,
  amountPaidCents,
  paymentType,
  checkInTime,
  manageUrl,
}: BookingConfirmationProps) {
  const balanceCents = totalCents - amountPaidCents;

  return (
    <EmailDocument
      preview={`Your booking is confirmed - ${confirmationCode} - ${propertyName}`}
      propertyName={propertyName}
      footer={
        propertyAddress || propertyPhone ? (
          <>
            {propertyAddress ? (
              <>
                <Text
                  style={{
                    color: BRAND_FOREGROUND,
                    fontSize: "12px",
                    lineHeight: "18px",
                    fontWeight: "700",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    margin: "0 0 4px",
                  }}
                >
                  Property address
                </Text>
                <Text
                  style={{
                    color: MUTED,
                    fontSize: "13px",
                    lineHeight: "20px",
                    margin: 0,
                  }}
                >
                  {propertyAddress}
                </Text>
              </>
            ) : null}
            {propertyPhone ? (
              <Text
                style={{
                  color: MUTED,
                  fontSize: "13px",
                  lineHeight: "20px",
                  margin: propertyAddress ? "8px 0 0" : 0,
                }}
              >
                Tel: {propertyPhone}
              </Text>
            ) : null}
          </>
        ) : undefined
      }
    >
      <EmailTitle>Booking confirmed</EmailTitle>
      <EmailBodyText>
        Hi {guestFirstName}, your reservation is confirmed. We look forward to
        welcoming you.
      </EmailBodyText>

      <EmailCodePanel code={confirmationCode} />

      <EmailDivider />
      <EmailSectionHeading>Stay details</EmailSectionHeading>
      <EmailPanel>
        <EmailDetailRow
          label="Check-in"
          value={formatEmailDate(checkIn)}
        />
        {checkInTime ? (
          <Text
            style={{
              color: MUTED,
              fontSize: "12px",
              lineHeight: "18px",
              margin: "4px 0 0",
            }}
          >
            Check-in from {checkInTime}
          </Text>
        ) : null}
        <EmailDetailRow label="Check-out" value={formatEmailDate(checkOut)} />
        <EmailDetailRow label="Room" value={roomTypeName} />
        <EmailDetailRow
          label="Duration"
          value={`${nights} night${nights !== 1 ? "s" : ""}`}
        />
      </EmailPanel>

      <EmailDivider />
      <EmailSectionHeading>Payment summary</EmailSectionHeading>
      <EmailPanel>
        <EmailDetailRow
          label="Total stay"
          value={formatCurrency(totalCents, currency)}
        />
        <EmailDetailRow
          label={paymentType === "deposit" ? "Deposit paid" : "Amount paid"}
          value={formatCurrency(amountPaidCents, currency)}
        />
        {paymentType === "deposit" ? (
          <Text
            style={{
              color: MUTED,
              fontSize: "12px",
              lineHeight: "18px",
              margin: "10px 0 0",
            }}
          >
            The remaining balance of {formatCurrency(balanceCents, currency)}
            will be collected at check-in.
          </Text>
        ) : null}
      </EmailPanel>

      {manageUrl ? (
        <>
          <EmailDivider />
          <EmailSectionHeading>Manage your booking</EmailSectionHeading>
          <EmailBodyText>
            Need to cancel or review your booking details? Use the link below.
          </EmailBodyText>
          <Section style={{ textAlign: "center" }}>
            <EmailButton href={manageUrl}>Manage booking</EmailButton>
          </Section>
        </>
      ) : null}
    </EmailDocument>
  );
}
