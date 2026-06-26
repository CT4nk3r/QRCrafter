import {
  buildQrValue,
  DEFAULT_ERROR_CORRECTION_LEVEL,
  DEFAULT_QR_STYLE,
} from '../shared/qr';
import {
  encodeEmail,
  encodePhone,
  encodeSms,
  encodeWifi,
} from '../shared/encoders';
import { Colors, PRESET_COLORS } from '../shared/theme';

describe('shared encoders', () => {
  it('escapes Wi-Fi QR fields', () => {
    expect(
      encodeWifi({
        ssid: 'Cafe;WiFi',
        password: 'p,a:s"s\\x',
        encryption: 'WPA',
        hidden: true,
      }),
    ).toBe('WIFI:T:WPA;S:Cafe\\;WiFi;P:p\\,a\\:s\\"s\\\\x;H:true;;');
  });

  it('encodes email query params', () => {
    expect(
      encodeEmail({
        address: 'hello@example.com',
        subject: 'Hello world',
        body: 'Line 1 & 2',
      }),
    ).toBe(
      'mailto:hello@example.com?subject=Hello%20world&body=Line%201%20%26%202',
    );
  });

  it('encodes SMS and phone values', () => {
    expect(encodeSms({ phone: '+15550100', message: 'hi' })).toBe(
      'smsto:+15550100:hi',
    );
    expect(encodePhone('+15550100')).toBe('tel:+15550100');
  });
});

describe('buildQrValue', () => {
  it('passes URL and text values through', () => {
    expect(
      buildQrValue({ qrType: 'url', simpleValue: 'https://example.com' }),
    ).toBe('https://example.com');
    expect(buildQrValue({ qrType: 'text', simpleValue: 'hello' })).toBe(
      'hello',
    );
  });

  it('adds country calling codes for phone and SMS values', () => {
    expect(
      buildQrValue({
        qrType: 'phone',
        simpleValue: '5550100',
        phoneCountryCallingCode: '1',
      }),
    ).toBe('tel:+15550100');

    expect(
      buildQrValue({
        qrType: 'sms',
        smsConfig: { phone: '70123456', message: 'hello' },
        smsCountryCallingCode: '36',
      }),
    ).toBe('smsto:+3670123456:hello');
  });

  it('returns empty values when required fields are missing', () => {
    expect(buildQrValue({ qrType: 'phone' })).toBe('');
    expect(
      buildQrValue({
        qrType: 'wifi',
        wifiConfig: {
          ssid: '',
          password: 'secret',
          encryption: 'WPA',
          hidden: false,
        },
      }),
    ).toBe('');
    expect(
      buildQrValue({
        qrType: 'email',
        emailConfig: { address: '', subject: 'Subject', body: 'Body' },
      }),
    ).toBe('');
  });

  it('builds structured Wi-Fi and email values', () => {
    expect(
      buildQrValue({
        qrType: 'wifi',
        wifiConfig: {
          ssid: 'Guest',
          password: 'secret',
          encryption: 'WPA',
          hidden: false,
        },
      }),
    ).toBe('WIFI:T:WPA;S:Guest;P:secret;H:false;;');

    expect(
      buildQrValue({
        qrType: 'email',
        emailConfig: {
          address: 'hello@example.com',
          subject: 'Hi',
          body: '',
        },
      }),
    ).toBe('mailto:hello@example.com?subject=Hi');
  });
});

describe('shared defaults and theme tokens', () => {
  it('keeps QR defaults centralized', () => {
    expect(DEFAULT_ERROR_CORRECTION_LEVEL).toBe('M');
    expect(DEFAULT_QR_STYLE).toEqual({
      fgColor: '#000000',
      bgColor: '#FFFFFF',
      size: 256,
    });
  });

  it('exports shared theme tokens', () => {
    expect(Colors.light.primary).toBe('#2563EB');
    expect(Colors.dark.background).toBe('#0F172A');
    expect(PRESET_COLORS).toContain('#2563EB');
  });
});
