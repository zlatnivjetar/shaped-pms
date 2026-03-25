import { Section, Text } from "@react-email/components";
import {
  EmailBodyText,
  EmailButton,
  EmailDivider,
  EmailDocument,
  EmailPanel,
  EmailTitle,
  MUTED,
  formatEmailDate,
} from "./shared";

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
    <EmailDocument
      preview={`Thank you for staying at ${propertyName} - share your experience`}
      propertyName={propertyName}
    >
      <EmailTitle>Thank you for your stay</EmailTitle>
      <EmailBodyText>
        Hi {guestFirstName}, we hope you had a wonderful time at {propertyName}
        . It was a pleasure having you with us
        {checkOut ? ` through ${formatEmailDate(checkOut)}` : ""}.
      </EmailBodyText>

      <EmailPanel>
        <Text
          style={{
            color: MUTED,
            fontSize: "12px",
            lineHeight: "18px",
            fontWeight: "700",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            margin: "0 0 4px",
          }}
        >
          Booking reference
        </Text>
        <Text
          style={{
            color: MUTED,
            fontSize: "15px",
            lineHeight: "24px",
            margin: 0,
          }}
        >
          Your booking reference was <strong>{confirmationCode}</strong>.
        </Text>
      </EmailPanel>

      <EmailDivider />
      <EmailBodyText>
        Your feedback means the world to us and helps future guests make
        informed decisions. It only takes a minute.
      </EmailBodyText>

      <Section style={{ textAlign: "center" }}>
        <EmailButton href={reviewUrl}>Leave a review</EmailButton>
      </Section>

      <EmailDivider />
      <Text
        style={{
          color: MUTED,
          fontSize: "12px",
          lineHeight: "18px",
          margin: 0,
        }}
      >
        This link expires in 30 days. If you have any issues, simply reply to
        this email.
      </Text>
    </EmailDocument>
  );
}
