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
    <EmailDocument
      preview={`Your booking ${confirmationCode} at ${propertyName} has been cancelled`}
      propertyName={propertyName}
    >
      <EmailTitle>Booking cancelled</EmailTitle>
      <EmailBodyText>
        Hi {guestFirstName}, your reservation at {propertyName} has been
        cancelled. We&apos;re sorry to see you go.
      </EmailBodyText>

      <EmailDivider />
      <EmailSectionHeading>Cancelled booking details</EmailSectionHeading>
      <EmailPanel>
        <EmailDetailRow label="Confirmation code" value={confirmationCode} />
        <EmailDetailRow
          label="Original check-in"
          value={formatEmailDate(checkIn)}
        />
        <EmailDetailRow
          label="Original check-out"
          value={formatEmailDate(checkOut)}
        />
        {cancellationReason ? (
          <EmailDetailRow label="Reason" value={cancellationReason} />
        ) : null}
      </EmailPanel>

      {refundNote ? (
        <>
          <EmailDivider />
          <EmailSectionHeading>Refund information</EmailSectionHeading>
          <EmailPanel>
            <Text
              style={{
                color: MUTED,
                fontSize: "14px",
                lineHeight: "22px",
                margin: 0,
              }}
            >
              {refundNote}
            </Text>
            <Text
              style={{
                color: MUTED,
                fontSize: "12px",
                lineHeight: "18px",
                margin: "10px 0 0",
              }}
            >
              Refunds typically appear on your statement within 5-10 business
              days depending on your bank.
            </Text>
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
        If you have any questions about this cancellation, please reply to this
        email and we&apos;ll be happy to help.
      </Text>
    </EmailDocument>
  );
}
