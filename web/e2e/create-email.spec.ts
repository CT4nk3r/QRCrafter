import { test, expect } from './fixtures/test';

test.describe('Email', () => {
  test.beforeEach(async ({ create }) => {
    await create.goto();
    await create.selectType('Email');
  });

  test('address only', async ({ create }) => {
    await create.fillEmail({ address: 'a@b.co' });
    expect(await create.decodeRenderedQr()).toBe('mailto:a@b.co');
  });

  test('subject and body are percent-encoded', async ({ create }) => {
    await create.fillEmail({ address: 'a@b.co', subject: 'Hello World', body: 'Line1\nLine2&x=1' });
    expect(await create.decodeRenderedQr()).toBe(
      'mailto:a@b.co?subject=Hello%20World&body=Line1%0ALine2%26x%3D1',
    );
  });

  test('subject without an address shows the empty state', async ({ create }) => {
    await create.fillEmail({ subject: 'Hi' });
    await expect(create.emptyState).toBeVisible();
  });
});
