import { expect, type Locator, type Page } from '@playwright/test';

export class DecodePage {
  readonly fileInput: Locator;
  readonly urlInput: Locator;
  readonly loadButton: Locator;
  readonly pasteButton: Locator;
  readonly copyButton: Locator;
  readonly result: Locator;
  readonly success: Locator;
  readonly error: Locator;

  constructor(readonly page: Page) {
    this.fileInput = page.getByLabel('Upload image file');
    this.urlInput = page.getByLabel('Image URL');
    this.loadButton = page.getByRole('button', { name: 'Load', exact: true });
    this.pasteButton = page.getByRole('button', { name: /Paste Image/ });
    this.copyButton = page.getByRole('button', { name: /Copy to Clipboard/ });
    this.result = page.getByTestId('decoded-data');
    this.success = page.getByText('✅ QR Code Decoded Successfully!');
    this.error = page.locator('p').filter({ hasText: /^❌/ });
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
    await this.page.getByRole('tab', { name: 'decode' }).click();
    await expect(
      this.page.getByRole('heading', { name: 'Decode QR Code', exact: true }),
    ).toBeVisible();
  }

  async uploadBuffer(name: string, mimeType: string, buffer: Buffer): Promise<void> {
    await this.fileInput.setInputFiles({ name, mimeType, buffer });
  }

  async paste(): Promise<void> {
    await this.pasteButton.click();
  }

  async loadUrl(url: string): Promise<void> {
    await this.urlInput.fill(url);
    await this.loadButton.click();
  }
}
