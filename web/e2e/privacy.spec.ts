import { test, expect } from './fixtures/test';
import { renderQrPng } from './utils/images';

const FAKE_URL = 'https://fixtures.qrcrafter.test/qr.png';

function isLocal(url: string, baseURL: string): boolean {
  return url.startsWith(baseURL) || url.startsWith('data:') || url.startsWith('blob:');
}

test.describe('privacy: nothing leaves localhost', () => {
  test('create flow, style, download and file decode make no external requests', async ({
    page, browser, baseURL, create, decode,
  }) => {
    const png = await renderQrPng(browser, baseURL!, 'privacy-check');
    const seen: string[] = [];
    page.on('request', req => seen.push(req.url()));

    await create.goto();
    await create.fillSimple('https://example.com/secret?token=abc');
    await create.selectType('Wi-Fi');
    await create.fillWifi({ ssid: 'Private', password: 'hunter2' });
    await create.selectType('SMS');
    await create.fillSms({ phone: '5551234567', message: 'private message' });
    await create.setFgHex('#2563EB');
    await create.setEclPercent(30);
    await create.openStyle();
    await create.sizeSlider().fill('300');
    const [download] = await Promise.all([page.waitForEvent('download'), create.downloadButton.click()]);
    await download.path();

    await decode.goto();
    await decode.uploadBuffer('qr.png', 'image/png', png);
    await expect(decode.result).toHaveText('privacy-check');

    const external = seen.filter(url => !isLocal(url, baseURL!));
    expect(external, 'requests that left localhost').toEqual([]);
    // The typed secrets must not appear in any URL either
    expect(seen.some(url => /hunter2|private|secret/.test(url))).toBe(false);
  });

  test('Load from URL contacts only the host the user entered', async ({ page, browser, baseURL, decode }) => {
    const png = await renderQrPng(browser, baseURL!, 'url-privacy');
    await page.route(FAKE_URL, route =>
      route.fulfill({ status: 200, contentType: 'image/png', headers: { 'Access-Control-Allow-Origin': '*' }, body: png }),
    );
    await decode.goto();
    const seen: string[] = [];
    page.on('request', req => seen.push(req.url()));
    await decode.loadUrl(FAKE_URL);
    await expect(decode.result).toHaveText('url-privacy');

    const external = seen.filter(url => !isLocal(url, baseURL!));
    expect(external).toEqual([FAKE_URL]);
  });
});
