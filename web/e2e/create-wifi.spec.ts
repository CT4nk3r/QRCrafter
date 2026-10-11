import { test, expect } from './fixtures/test';

test.describe('Wi-Fi', () => {
  test.beforeEach(async ({ create }) => {
    await create.goto();
    await create.selectType('Wi-Fi');
  });

  test('SSID only', async ({ create }) => {
    await create.fillWifi({ ssid: 'Home' });
    expect(await create.decodeRenderedQr()).toBe('WIFI:T:WPA;S:Home;P:;H:false;;');
  });

  test('full config', async ({ create }) => {
    await create.fillWifi({ ssid: 'Cafe Net', password: 'p@ss', encryption: 'WEP', hidden: true });
    expect(await create.decodeRenderedQr()).toBe('WIFI:T:WEP;S:Cafe Net;P:p@ss;H:true;;');
  });

  // BUG (reported): non-ASCII is written as one Latin-1 byte per character instead of UTF-8,
  // so scanners read garbage. Expected to fail until the encoding is fixed.
  test('non-ASCII SSID is encoded as UTF-8', async ({ create }) => {
    test.fail(true, 'App encodes non-ASCII QR content as Latin-1/truncated code units, not UTF-8');
    await create.fillWifi({ ssid: 'Café Net', password: 'p@ss', encryption: 'WEP', hidden: true });
    expect(await create.decodeRenderedQr()).toBe('WIFI:T:WEP;S:Café Net;P:p@ss;H:true;;');
  });

  test('special characters are backslash-escaped', async ({ create }) => {
    await create.fillWifi({ ssid: 'a;b,c"d:e\\f', password: 'x;y' });
    expect(await create.decodeRenderedQr()).toBe(
      'WIFI:T:WPA;S:a\\;b\\,c\\"d\\:e\\\\f;P:x\\;y;H:false;;',
    );
  });

  test('open network', async ({ create }) => {
    await create.fillWifi({ ssid: 'Open', encryption: 'nopass' });
    expect(await create.decodeRenderedQr()).toContain('T:nopass;');
  });

  test('password without SSID shows the empty state', async ({ create }) => {
    await create.fillWifi({ ssid: '', password: 'secret' });
    await expect(create.emptyState).toBeVisible();
  });

  test('password field is masked', async ({ page }) => {
    await expect(page.locator('#password')).toHaveAttribute('type', 'password');
  });
});
