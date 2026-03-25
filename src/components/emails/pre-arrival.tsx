import { Text } from "@react-email/components";
import {
  EmailBodyText,
  EmailDetailRow,
  EmailDivider,
  EmailDocument,
  EmailPanel,
  EmailSectionHeading,
  EmailTitle,
  MUTED,
  formatEmailDate,
} from "./shared";

interface PreArrivalProps {
  guestFirstName: string;
  propertyName: string;
  propertyAddress?: string;
  propertyPhone?: string;
  checkIn: string;
  checkInTime?: string;
  roomTypeName: string;
  confirmationCode: string;
  checkInInstructions?: string;
}

export default function PreArrival({
  guestFirstName,
  propertyName,
  propertyAddress,
  propertyPhone,
  checkIn,
  checkInTime,
  roomTypeName,
  confirmationCode,
  checkInInstructions,
}: PreArrivalProps) {
  return (
    <EmailDocument
      preview={`Your check-in at ${propertyName} is tomorrow - we're ready for you!`}
      propertyName={propertyName}
    >
      <EmailTitle>See you tomorrow</EmailTitle>
      <EmailBodyText>
        Hi {guestFirstName}, your stay at {propertyName} begins tomorrow.
        Here&apos;s everything you need for a smooth arrival.
      </EmailBodyText>

      <EmailDivider />
      <EmailSectionHeading>Check-in details</EmailSectionHeading>
      <EmailPanel>
        <EmailDetailRow label="Date" value={formatEmailDate(checkIn)} />
        {checkInTime ? (
          <EmailDetailRow label="Check-in from" value={checkInTime} />
        ) : null}
        <EmailDetailRow label="Room" value={roomTypeName} />
        <EmailDetailRow label="Booking ref" value={confirmationCode} />
      </EmailPanel>

      {checkInInstructions ? (
        <>
          <EmailDivider />
          <EmailSectionHeading>Check-in instructions</EmailSectionHeading>
          <EmailPanel>
            <Text
              style={{
                color: MUTED,
                fontSize: "14px",
                lineHeight: "22px",
                margin: 0,
                whiteSpace: "pre-line",
              }}
            >
              {checkInInstructions}
            </Text>
          </EmailPanel>
        </>
      ) : null}

      {propertyAddress ? (
        <>
          <EmailDivider />
          <EmailSectionHeading>How to find us</EmailSectionHeading>
          <EmailPanel>
            <Text
              style={{
                color: MUTED,
                fontSize: "14px",
                lineHeight: "22px",
                margin: 0,
              }}
            >
              {propertyAddress}
            </Text>
            {propertyPhone ? (
              <Text
                style={{
                  color: MUTED,
                  fontSize: "13px",
                  lineHeight: "20px",
                  margin: "10px 0 0",
                }}
              >
                Tel: {propertyPhone}
              </Text>
            ) : null}
          </EmailPanel>
        </>
      ) : null}

      <EmailDivider />
      <Text
        style={{
          color: MUTED,
          fontSize: "13px",
          lineHeight: "21px",
          margin: 0,
        }}
      >
        If you have any questions before your arrival, simply reply to this
        email and we&apos;ll be happy to help.
      </Text>
    </EmailDocument>
  );
}
