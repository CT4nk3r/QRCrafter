import {WifiConfig, EmailConfig, SmsConfig} from './qr';

export function encodeWifi(config: WifiConfig): string {
  const escape = (s: string) =>
    s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/"/g, '\\"').replace(/:/g, '\\:');

  return `WIFI:T:${config.encryption};S:${escape(config.ssid)};P:${escape(config.password)};H:${config.hidden ? 'true' : 'false'};;`;
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