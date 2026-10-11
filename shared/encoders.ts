import type { WifiConfig, EmailConfig, SmsConfig } from './qr';

export function encodeWifi(config: WifiConfig): string {
  const escape = (s: string) =>
    s
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/"/g, '\\"')
      .replace(/:/g, '\\:');

  return `WIFI:T:${config.encryption};S:${escape(config.ssid)};P:${escape(
    config.password,
  )};H:${config.hidden ? 'true' : 'false'};;`;
}

export function encodeEmail(config: EmailConfig): string {
  const params: string[] = [];
  if (config.subject) {
    params.push(`subject=${encodeURIComponent(config.subject)}`);
  }
  if (config.body) {
    params.push(`body=${encodeURIComponent(config.body)}`);
  }
  const query = params.length > 0 ? `?${params.join('&')}` : '';
  return `mailto:${config.address}${query}`;
}

export function encodeSms(config: SmsConfig): string {
  return `smsto:${config.phone}:${config.message}`;
}

export function encodePhone(phone: string): string {
  return `tel:${phone}`;
}

/**
 * Convert text to a "byte string": one character per UTF-8 byte (all char codes <= 255).
 *
 * `react-qr-code` (via `qr.js`) writes `charCodeAt(i)` as a single byte per character, so
 * non-ASCII text is truncated to Latin-1 and scanners read garbage. Feeding it UTF-8 bytes
 * makes it emit the UTF-8 that scanners expect. Not needed on mobile: `qrcode` already
 * encodes strings with TextEncoder.
 */
export function toUtf8ByteString(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let result = '';
  for (let i = 0; i < bytes.length; i++) {
    result += String.fromCharCode(bytes[i]);
  }
  return result;
}
