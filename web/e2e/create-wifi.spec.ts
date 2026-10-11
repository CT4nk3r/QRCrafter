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

  // Regression: non-ASCII used to be written as one Latin-1 byte per character, not UTF-8
  test('non-ASCII SSID is encoded as UTF-8', async ({ create }) => {
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
