import { expect, type Locator, type Page } from '@playwright/test';
import { decodeQrLocator } from '../utils/qr';

export type QrTypeLabel = 'URL' | 'Text' | 'Wi-Fi' | 'Email' | 'Phone' | 'SMS';

export interface WifiInput {
  ssid: string;
  password?: string;
  encryption?: 'WPA' | 'WEP' | 'nopass';
  hidden?: boolean;
}

export interface EmailInput {
  address?: string;
  subject?: string;
  body?: string;
}

export interface SmsInput {
  phone?: string;
  message?: string;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export class CreatePage {
  readonly qrCode: Locator;
  readonly qrSvg: Locator;
  readonly emptyState: Locator;
  readonly overflowMessage: Locator;
  readonly downloadButton: Locator;
  readonly eclSlider: Locator;
  readonly eclInput: Locator;

  constructor(readonly page: Page) {
    this.qrCode = page.getByTestId('qr-code');
    this.qrSvg = this.qrCode.locator('svg');
    this.emptyState = page.getByText('Enter content to generate QR code');
    this.overflowMessage = page.getByText(/Content is too long to encode as a QR code/);
    this.downloadButton = page.getByRole('button', { name: /Download PNG/ });
    this.eclSlider = page.getByLabel('Error correction level');
    this.eclInput = page.getByLabel('Error correction percentage');
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
    await expect(this.page.getByRole('heading', { name: 'QRCrafter' })).toBeVisible();
  }

  /** Type buttons are named "<emoji> <label>" (e.g. "📶 Wi-Fi"). */
  typeButton(label: QrTypeLabel): Locator {
    return this.page.getByRole('button', { name: new RegExp(`\\s${escapeRegExp(label)}$`) });
  }

  async selectType(label: QrTypeLabel): Promise<void> {
    await this.typeButton(label).click();
    await expect(this.typeButton(label)).toHaveAttribute('aria-pressed', 'true');
  }

  async fillSimple(value: string): Promise<void> {
    await this.page.locator('#qr-input').fill(value);
  }

  async fillWifi({ ssid, password, encryption, hidden }: WifiInput): Promise<void> {
    await this.page.locator('#ssid').fill(ssid);
    if (password !== undefined) await this.page.locator('#password').fill(password);
    if (encryption) await this.page.locator('#encryption').selectOption(encryption);
    if (hidden !== undefined) await this.page.locator('#hidden').setChecked(hidden);
  }

  async fillEmail({ address, subject, body }: EmailInput): Promise<void> {
    if (address !== undefined) await this.page.locator('#email-address').fill(address);
    if (subject !== undefined) await this.page.locator('#email-subject').fill(subject);
    if (body !== undefined) await this.page.locator('#email-body').fill(body);
  }

  async fillPhone(digits: string): Promise<void> {
    await this.page.locator('#phone-number').fill(digits);
  }

  async fillSms({ phone, message }: SmsInput): Promise<void> {
    if (phone !== undefined) await this.page.locator('#sms-phone').fill(phone);
    if (message !== undefined) await this.page.locator('#sms-message').fill(message);
  }

  /** The country dropdown button (closed or open) for the Phone or SMS form. */
  countryButton(): Locator {
    return this.page.locator('button[aria-haspopup="listbox"]');
  }

  countrySearch(): Locator {
    return this.page.getByPlaceholder('Search (e.g. Hungary or +36)');
  }

  async pickCountry(query: string, how: 'enter' | 'click'): Promise<void> {
    await this.countryButton().click();
    await this.countrySearch().fill(query);
    if (how === 'enter') {
      await this.countrySearch().press('Enter');
    } else {
      await this.page.getByRole('option').first().click();
    }
  }

  async setEclPercent(value: string | number): Promise<void> {
    await this.eclInput.fill(String(value));
    await this.eclInput.press('Enter');
  }

  async setEclSlider(value: number): Promise<void> {
    await this.eclSlider.fill(String(value));
  }

  styleToggle(): Locator {
    return this.page.getByRole('button', { name: /^Style/ });
  }

  /** Idempotent: opens the style editor if it is collapsed. */
  async openStyle(): Promise<void> {
    if ((await this.styleToggle().textContent())?.includes('▼')) {
      await this.styleToggle().click();
    }
    await expect(this.page.getByText('Customize Style')).toBeVisible();
  }

  hexInput(which: 'fg' | 'bg'): Locator {
    return this.page.getByLabel('Hex color value').nth(which === 'fg' ? 0 : 1);
  }

  async setFgHex(hex: string): Promise<void> {
    await this.openStyle();
    await this.hexInput('fg').fill(hex);
    await this.hexInput('fg').press('Enter');
  }

  async setBgHex(hex: string): Promise<void> {
    await this.openStyle();
    await this.hexInput('bg').fill(hex);
    await this.hexInput('bg').press('Enter');
  }

  /** Colour preset swatch. Every preset exists twice: foreground list first, then background. */
  preset(which: 'fg' | 'bg', hex: string): Locator {
    return this.page
      .getByRole('button', { name: `Select color ${hex}` })
      .nth(which === 'fg' ? 0 : 1);
  }

  sizeSlider(): Locator {
    return this.page.locator('#qr-size-slider');
  }

  sizeText(): Locator {
    return this.page.getByLabel('QR size in pixels');
  }

  /** Read the rendered QR the way a scanner would. */
  async decodeRenderedQr(): Promise<string> {
    await expect(this.qrSvg).toBeVisible();
    return decodeQrLocator(this.qrCode);
  }
}
