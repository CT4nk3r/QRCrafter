import { WifiConfig, EmailConfig, SmsConfig } from '../types/qr';

/**
 * Encode a Wi-Fi network configuration into a QR-compatible string.
 * Format: WIFI:T:<encryption>;S:<ssid>;P:<password>;H:<hidden>;;
 */
export function encodeWifi(config: WifiConfig): string {
  const escape = (s: string) =>
    s
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/"/g, '\\"')
      .replace(/:/g, '\\:');

  return `WIFI:T:${config.encryption};S:${escape(config.ssid)};P:${escape(
    config.password
  )};H:${config.hidden ? 'true' : 'false'};;`;
}

/**
 * Encode an email into a mailto: URI.
 */
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

/**
 * Encode an SMS into an smsto: URI.
 */
export function encodeSms(config: SmsConfig): string {
  return `smsto:${config.phone}:${config.message}`;
}

/**
 * Encode a phone number into a tel: URI.
 */
export function encodePhone(phone: string): string {
  return `tel:${phone}`;
}

