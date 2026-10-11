import { test, expect } from './fixtures/test';

test.describe('Phone', () => {
  test.beforeEach(async ({ create }) => {
    await create.goto();
    await create.selectType('Phone');
  });

  test('non-digits are stripped and the default +1 prefix is used', async ({ page, create }) => {
    await page.locator('#phone-number').pressSequentially('555-123 4567');
    await expect(page.locator('#phone-number')).toHaveValue('5551234567');
    expect(await create.decodeRenderedQr()).toBe('tel:+15551234567');
  });

  test('letters are stripped', async ({ page, create }) => {
    await page.locator('#phone-number').pressSequentially('abc123');
    await expect(page.locator('#phone-number')).toHaveValue('123');
    expect(await create.decodeRenderedQr()).toBe('tel:+1123');
  });
});

test.describe('SMS', () => {
  test.beforeEach(async ({ create }) => {
    await create.goto();
    await create.selectType('SMS');
  });

  test('phone and message', async ({ create }) => {
    await create.fillSms({ phone: '5551234567', message: 'Hi there' });
    expect(await create.decodeRenderedQr()).toBe('smsto:+15551234567:Hi there');
  });

  test('phone only', async ({ create }) => {
    await create.fillSms({ phone: '5551234567' });
    expect(await create.decodeRenderedQr()).toBe('smsto:+15551234567:');
  });

  test('message only shows the empty state', async ({ create }) => {
    await create.fillSms({ message: 'Hello' });
    await expect(create.emptyState).toBeVisible();
  });
});
