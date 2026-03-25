import type { ReactNode } from "react";
import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Html,
  Hr,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";

export const BRAND = "#E2BD27";
export const BRAND_FOREGROUND = "#11110F";
export const MUTED = "#51504D";
export const BACKGROUND = "#FBFBF9";
export const CARD = "#FFFFFF";
export const PANEL = "#EFEEEC";
export const BORDER = "#E5E3DC";
export const SUCCESS = "#1C7C5C";
export const WARNING = "#BD8600";
export const INFO = "#2563A0";
export const CTA_BG = "#E2BD27";
export const CTA_TEXT = "#11110F";
export const FONT_FAMILY = '"Arial", "Helvetica Neue", Helvetica, sans-serif';

const pageStyles = {
  backgroundColor: BACKGROUND,
  fontFamily: FONT_FAMILY,
  margin: 0,
  padding: 0,
};

const containerStyles = {
  maxWidth: "600px",
  margin: "40px auto",
  backgroundColor: CARD,
  border: `1px solid ${BORDER}`,
  borderRadius: "12px",
  overflow: "hidden",
};

const headerStyles = {
  backgroundColor: BRAND,
  padding: "30px 40px",
};

const headerTitleStyles = {
  color: BRAND_FOREGROUND,
  fontSize: "20px",
  lineHeight: "28px",
  fontWeight: "700",
  margin: 0,
};

const contentStyles = {
  padding: "40px",
};

const titleStyles = {
  color: BRAND_FOREGROUND,
  fontSize: "24px",
  lineHeight: "32px",
  fontWeight: "700",
  margin: "0 0 12px",
};

const bodyTextStyles = {
  color: MUTED,
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 16px",
};

const sectionHeadingStyles = {
  color: BRAND_FOREGROUND,
  fontSize: "13px",
  lineHeight: "18px",
  fontWeight: "700",
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
  margin: "0 0 14px",
};

const dividerStyles = {
  borderColor: BORDER,
  margin: "24px 0",
};

const panelStyles = {
  backgroundColor: PANEL,
  border: `1px solid ${BORDER}`,
  borderRadius: "8px",
  padding: "20px",
};

const centeredPanelStyles = {
  ...panelStyles,
  textAlign: "center" as const,
};

const codeStyles = {
  color: BRAND_FOREGROUND,
  fontSize: "28px",
  lineHeight: "36px",
  fontWeight: "700",
  letterSpacing: "4px",
  margin: 0,
  fontFamily: FONT_FAMILY,
};

const codeLabelStyles = {
  color: MUTED,
  fontSize: "12px",
  lineHeight: "18px",
  fontWeight: "700",
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
  margin: "0 0 8px",
};

const detailTableStyles = {
  width: "100%",
  borderCollapse: "collapse" as const,
};

const detailCellStyles = {
  padding: "6px 0",
  verticalAlign: "top" as const,
};

const detailLabelColumnStyles = {
  ...detailCellStyles,
  width: "40%",
};

const detailValueColumnStyles = {
  ...detailCellStyles,
  width: "60%",
  textAlign: "right" as const,
};

const detailLabelStyles = {
  color: MUTED,
  fontSize: "12px",
  lineHeight: "18px",
  fontWeight: "700",
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  margin: 0,
};

const detailValueStyles = {
  color: BRAND_FOREGROUND,
  fontSize: "14px",
  lineHeight: "22px",
  fontWeight: "600",
  margin: 0,
  textAlign: "right" as const,
};

const buttonStyles = {
  backgroundColor: CTA_BG,
  color: CTA_TEXT,
  borderRadius: "8px",
  padding: "12px 24px",
  fontSize: "15px",
  lineHeight: "20px",
  fontWeight: "700",
  textDecoration: "none",
  display: "inline-block",
  border: `1px solid ${CTA_BG}`,
};

const footerStyles = {
  backgroundColor: PANEL,
  padding: "24px 40px",
  borderTop: `1px solid ${BORDER}`,
};

export function EmailDocument({
  preview,
  propertyName,
  children,
  footer,
}: {
  preview: string;
  propertyName: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={pageStyles}>
        <Container style={containerStyles}>
          <Section style={headerStyles}>
            <Heading as="h1" style={headerTitleStyles}>
              {propertyName}
            </Heading>
          </Section>
          <Section style={contentStyles}>{children}</Section>
          {footer ? <Section style={footerStyles}>{footer}</Section> : null}
        </Container>
      </Body>
    </Html>
  );
}

export function EmailTitle({ children }: { children: ReactNode }) {
  return <Heading as="h2" style={titleStyles}>{children}</Heading>;
}

export function EmailBodyText({ children }: { children: ReactNode }) {
  return <Text style={bodyTextStyles}>{children}</Text>;
}

export function EmailSectionHeading({ children }: { children: ReactNode }) {
  return <Heading as="h3" style={sectionHeadingStyles}>{children}</Heading>;
}

export function EmailDivider() {
  return <Hr style={dividerStyles} />;
}

export function EmailPanel({
  children,
  centered = false,
}: {
  children: ReactNode;
  centered?: boolean;
}) {
  return <Section style={centered ? centeredPanelStyles : panelStyles}>{children}</Section>;
}

export function EmailCodePanel({
  code,
  label = "Confirmation code",
  note,
}: {
  code: string;
  label?: string;
  note?: ReactNode;
}) {
  return (
    <EmailPanel centered>
      <Text style={codeLabelStyles}>{label}</Text>
      <Text style={codeStyles}>{code}</Text>
      {note ? <Text style={{ color: MUTED, fontSize: "12px", lineHeight: "18px", margin: "12px 0 0" }}>{note}</Text> : null}
    </EmailPanel>
  );
}

export function EmailDetailRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <Row style={detailTableStyles}>
      <Column style={detailLabelColumnStyles}>
        <Text style={detailLabelStyles}>{label}</Text>
      </Column>
      <Column style={detailValueColumnStyles}>
        <Text style={detailValueStyles}>{value}</Text>
      </Column>
    </Row>
  );
}

export function EmailButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Button href={href} style={buttonStyles}>
      {children}
    </Button>
  );
}

export function formatCurrency(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export function formatEmailDate(dateStr: string): string {
  // dateStr is YYYY-MM-DD
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
