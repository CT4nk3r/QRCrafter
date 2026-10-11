import { test as base } from '@playwright/test';
import { CreatePage } from '../pages/CreatePage';
import { DecodePage } from '../pages/DecodePage';

interface Fixtures {
  create: CreatePage;
  decode: DecodePage;
}

export const test = base.extend<Fixtures>({
  create: async ({ page }, use) => {
    await use(new CreatePage(page));
  },
  decode: async ({ page }, use) => {
    await use(new DecodePage(page));
  },
});

export { expect } from '@playwright/test';
