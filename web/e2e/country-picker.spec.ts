import { test, expect } from './fixtures/test';

test.describe('country picker', () => {
  test.beforeEach(async ({ create }) => {
    await create.goto();
    await create.selectType('Phone');
  });

  test('is closed by default, opens on click with the search focused', async ({ create }) => {
    await expect(create.countryButton()).toHaveAttribute('aria-expanded', 'false');
    await create.countryButton().click();
    await expect(create.countryButton()).toHaveAttribute('aria-expanded', 'true');
    await expect(create.countrySearch()).toBeFocused();
  });

  test('search by name and Enter selects the first match', async ({ create }) => {
    await create.pickCountry('Hungary', 'enter');
    await expect(create.countryButton()).toContainText('+36 HU');
    await create.fillPhone('301234567');
    expect(await create.decodeRenderedQr()).toBe('tel:+36301234567');
  });

  test('search by calling code', async ({ page, create }) => {
    await create.countryButton().click();
    await create.countrySearch().fill('+44');
    await expect(page.getByRole('option').first()).toContainText('+44');
    await page.getByRole('option').first().click();
    await create.fillPhone('7911123456');
    expect(await create.decodeRenderedQr()).toMatch(/^tel:\+44/);
  });

  test('search by lower-case ISO code', async ({ page, create }) => {
    await create.countryButton().click();
    await create.countrySearch().fill('de');
    await expect(page.getByRole('option', { name: /\+49 DE/ })).toBeVisible();
  });

  test('no matches shows "No results" and Enter changes nothing', async ({ page, create }) => {
    await create.countryButton().click();
    await create.countrySearch().fill('zzzz');
    await expect(page.getByText('No results')).toBeVisible();
    await create.countrySearch().press('Enter');
    await expect(create.countrySearch()).toBeVisible();
    await expect(create.countryButton()).toContainText('+1 US');
  });

  test('picking a country closes the dropdown', async ({ create }) => {
    await create.pickCountry('Hungary', 'click');
    await expect(create.countrySearch()).toHaveCount(0);
    await expect(create.countryButton()).toHaveAttribute('aria-expanded', 'false');
  });

  test('the SMS picker works on its own', async ({ create }) => {
    await create.selectType('SMS');
    await create.pickCountry('Hungary', 'enter');
    await create.fillSms({ phone: '301234567' });
    expect(await create.decodeRenderedQr()).toBe('smsto:+36301234567:');
  });

  test('changing the type resets the country to US', async ({ create }) => {
    await create.pickCountry('Hungary', 'enter');
    await create.selectType('SMS');
    await create.selectType('Phone');
    await expect(create.countryButton()).toContainText('+1 US');
  });
});
