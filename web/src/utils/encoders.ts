import { WifiConfig } from '../types/qr';

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
