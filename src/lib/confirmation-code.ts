const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I for readability

export function generateConfirmationCode(): string {
  let code = "";
  const bytes = new Uint8Array(5);
  crypto.getRandomValues(bytes);
  for (const byte of bytes) {
    code += CHARS[byte % CHARS.length];
  }
  return `SHP-${code}`;
}
