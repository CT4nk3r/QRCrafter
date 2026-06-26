/**
 * Conformance tests for the shared QR encoders.
 *
 * These cover the pure business logic in `shared/` that must produce identical
 * output across mobile, web, and desktop. Output strings are asserted against
 * the de-facto QR payload conventions scanners expect (WIFI:, mailto:, smsto:,
 * tel:), not just snapshotted, so regressions in escaping are caught.
 */

import {
  encodeWifi,
  encodeEmail,
  encodeSms,
  encodePhone,
} from '../shared/encoders';
import {percentageToECL, eclToPercentage, ECL_OPTIONS} from '../shared/qr';

describe('encodeWifi', () => {
  it('encodes a basic WPA network', () => {
    expect(
      encodeWifi({
        ssid: 'MyNetwork',
        password: 'secret123',
        encryption: 'WPA',
        hidden: false,
      }),
    ).toBe('WIFI:T:WPA;S:MyNetwork;P:secret123;H:false;;');
  });

  it('marks hidden networks with H:true', () => {
    expect(
      encodeWifi({
        ssid: 'Hidden',
        password: 'pw',
        encryption: 'WPA',
        hidden: true,
      }),
    ).toBe('WIFI:T:WPA;S:Hidden;P:pw;H:true;;');
  });

  it('supports open (nopass) networks', () => {
    expect(
      encodeWifi({
        ssid: 'FreeWifi',
        password: '',
        encryption: 'nopass',
        hidden: false,
      }),
    ).toBe('WIFI:T:nopass;S:FreeWifi;P:;H:false;;');
  });

  it('supports WEP', () => {
    expect(
      encodeWifi({
        ssid: 'OldNet',
        password: 'abcde',
        encryption: 'WEP',
        hidden: false,
      }),
    ).toBe('WIFI:T:WEP;S:OldNet;P:abcde;H:false;;');
  });

  it('escapes reserved characters in the SSID', () => {
    // semicolon and comma are field/record separators in the WIFI: scheme
    expect(
      encodeWifi({
        ssid: 'Test;SSID,2',
        password: '',
        encryption: 'nopass',
        hidden: false,
      }),
    ).toBe(String.raw`WIFI:T:nopass;S:Test\;SSID\,2;P:;H:false;;`);
  });

  it('escapes reserved characters in the password', () => {
    expect(
      encodeWifi({
        ssid: 'Net',
        password: 'p@ss:word"x',
        encryption: 'WPA',
        hidden: false,
      }),
    ).toBe(String.raw`WIFI:T:WPA;S:Net;P:p@ss\:word\"x;H:false;;`);
  });

  it('escapes backslashes before other characters (no double-escaping)', () => {
    // A single backslash must become exactly one escaped backslash, and a
    // following semicolon must still be escaped once.
    expect(
      encodeWifi({
        ssid: String.raw`a\b;c`,
        password: '',
        encryption: 'nopass',
        hidden: false,
      }),
    ).toBe(String.raw`WIFI:T:nopass;S:a\\b\;c;P:;H:false;;`);
  });
});

describe('encodeEmail', () => {
  it('encodes an address with no subject or body', () => {
    expect(
      encodeEmail({address: 'user@example.com', subject: '', body: ''}),
    ).toBe('mailto:user@example.com');
  });

  it('appends an encoded subject', () => {
    expect(
      encodeEmail({
        address: 'user@example.com',
        subject: 'Hello World',
        body: '',
      }),
    ).toBe('mailto:user@example.com?subject=Hello%20World');
  });

  it('appends an encoded body', () => {
    expect(
      encodeEmail({
        address: 'user@example.com',
        subject: '',
        body: 'Line one',
      }),
    ).toBe('mailto:user@example.com?body=Line%20one');
  });

  it('appends both subject and body joined by &', () => {
    expect(
      encodeEmail({
        address: 'user@example.com',
        subject: 'Hi',
        body: 'Body',
      }),
    ).toBe('mailto:user@example.com?subject=Hi&body=Body');
  });

  it('percent-encodes characters that would break the query string', () => {
    expect(
      encodeEmail({
        address: 'user@example.com',
        subject: 'A&B=C',
        body: '50% off?',
      }),
    ).toBe('mailto:user@example.com?subject=A%26B%3DC&body=50%25%20off%3F');
  });
});

describe('encodeSms', () => {
  it('encodes a phone and message in smsto: form', () => {
    expect(encodeSms({phone: '+15551234567', message: 'Hi there'})).toBe(
      'smsto:+15551234567:Hi there',
    );
  });

  it('keeps a trailing colon when the message is empty', () => {
    expect(encodeSms({phone: '+15551234567', message: ''})).toBe(
      'smsto:+15551234567:',
    );
  });

  // NOTE: encodeSms does not currently escape colons in the message, so a
  // message containing ':' produces an ambiguous payload. This test documents
  // that known limitation rather than asserting it is desirable.
  it('does not escape colons in the message (documented limitation)', () => {
    expect(encodeSms({phone: '+1555', message: 'a:b'})).toBe('smsto:+1555:a:b');
  });
});

describe('encodePhone', () => {
  it('encodes a phone number in tel: form', () => {
    expect(encodePhone('+15551234567')).toBe('tel:+15551234567');
  });
});

describe('error-correction level helpers', () => {
  it('maps a percentage up to the nearest supported ECL', () => {
    expect(percentageToECL(0)).toBe('L');
    expect(percentageToECL(7)).toBe('L');
    expect(percentageToECL(8)).toBe('M');
    expect(percentageToECL(15)).toBe('M');
    expect(percentageToECL(25)).toBe('Q');
    expect(percentageToECL(30)).toBe('H');
    expect(percentageToECL(100)).toBe('H');
  });

  it('maps an ECL back to its percentage', () => {
    expect(eclToPercentage('L')).toBe(7);
    expect(eclToPercentage('M')).toBe(15);
    expect(eclToPercentage('Q')).toBe(25);
    expect(eclToPercentage('H')).toBe(30);
  });

  it('round-trips every supported ECL option', () => {
    for (const option of ECL_OPTIONS) {
      expect(percentageToECL(option.percentage)).toBe(option.value);
      expect(eclToPercentage(option.value)).toBe(option.percentage);
    }
  });
});
