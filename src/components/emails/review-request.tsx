import { Section, Text } from "@react-email/components";
import {
  EmailBodyText,
  EmailButton,
  EmailDivider,
  EmailDocument,
  EmailPanel,
  EmailTitle,
  MUTED,
} from "./shared";

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
    <EmailDocument
      preview={`A quick reminder - share your thoughts about ${propertyName}`}
      propertyName={propertyName}
    >
      <EmailTitle>We&apos;d love your feedback</EmailTitle>
      <EmailBodyText>
        Hi {guestFirstName}, we noticed you haven&apos;t had a chance to share
        your thoughts on your recent stay at {propertyName} yet.
      </EmailBodyText>
      <EmailBodyText>
        Your honest review helps future guests and makes a real difference to
        our small property. It only takes a minute, we promise.
      </EmailBodyText>

      <EmailDivider />
      <EmailPanel centered>
        <Text
          style={{
            color: MUTED,
            fontSize: "24px",
            lineHeight: "32px",
            letterSpacing: "2px",
            margin: "0 0 16px",
          }}
        >
          5 stars
        </Text>
        <Text
          style={{
            color: MUTED,
            fontSize: "13px",
            lineHeight: "20px",
            margin: "0 0 20px",
          }}
        >
          We&apos;d love to hear what stood out most about your stay.
        </Text>
        <Section style={{ textAlign: "center" }}>
          <EmailButton href={reviewUrl}>Write a review</EmailButton>
        </Section>
      </EmailPanel>

      <EmailDivider />
      <Text
        style={{
          color: MUTED,
          fontSize: "12px",
          lineHeight: "18px",
          margin: 0,
        }}
      >
        This is a one-time reminder. If you&apos;d prefer not to receive
        further emails, please reply to this message and we&apos;ll remove you
        from our follow-up list.
      </Text>
    </EmailDocument>
  );
}
