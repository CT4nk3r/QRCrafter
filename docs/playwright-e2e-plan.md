# Playwright E2E Test Suite — Implementation Plan

**Audience:** the agent implementing this plan (it should be able to work from this file alone).
**Scope:** the Next.js web app in `web/`, which is also the frontend the Tauri desktop shell wraps. Mobile (React Native) is out of scope.
**Goal:** a deterministic, fast (< 60 s locally), CI-gated Playwright suite that covers every user-facing flow on the single page (`web/src/app/page.tsx`): Create mode (6 QR types, error correction, style, download) and Decode mode (file, clipboard, URL).

Read `AGENTS.md` before starting. Its code style (Prettier, named exports, explicit return types on helpers, no `any`, no `@ts-ignore`) applies to test code too.

---

## 0. Ground rules for the implementer

1. **Do not change app behavior.** The only app-source edits allowed are the test hooks listed in §3 (`aria-label` / `data-testid` attributes). Make them in a separate commit.
2. **The oracle is the decoded QR, not the DOM.** Every Create-mode test that claims "the QR encodes X" must prove it by decoding the rendered QR image (§4.2). Don't assert on internal state.
3. **No fixed sleeps** (`waitForTimeout`). Use web-first assertions (`expect(locator).toHaveText(...)`, `expect.poll`).
4. **No external network.** Every test runs offline. Use `page.route` for anything that would leave `localhost`.
5. **Never skip, `fixme`, or loosen a test just to get green.** If a test reveals a real app bug, stop and report it (what fails, a minimal reproduction, and a suggested fix). Only if no one answers, mark that one test `test.fixme(...)` with a comment explaining the bug, and list it in the final summary.
6. If a fact in this plan turns out wrong once you check it (a selector, a library version, an expected string), trust the code, adjust, and note the change in the final summary.

---

## 1. Facts about the app the tests depend on

| Area | Fact (source) |
|---|---|
| Build | `output: 'export'` in `web/next.config.js` → static site in `web/out/`. `next start` does **not** work, so serve `out/` statically. |
| Page | Single route `/`. Title `QRCrafter - Generate QR Codes`; `<link rel="manifest" href="/manifest.json">` (`web/src/app/layout.tsx`). |
| Mode toggle | Buttons `Create` / `Decode`. Create is the default. All Create state lives in `Home`, so it **survives** a round trip to Decode and back; local state inside child components (ECL text box, country search) resets. |
| Type selector | Buttons whose accessible names are emoji + label: `🔗 URL`, `📝 Text`, `📶 Wi-Fi`, `📧 Email`, `📞 Phone`, `💬 SMS`. Locate with `getByRole('button', { name: /URL$/ })` etc. Switching type **clears all inputs** and resets both countries to `US`; ECL and style are **not** reset. |
| Empty state | With no content: placeholder text `Enter content to generate QR code`, no `<svg>`, no Download button. |
| URL / Text | `#qr-input` (`<input type=url>` for URL, `<textarea>` for Text). Value is encoded verbatim. |
| Wi-Fi | `#ssid`, `#password`, `#encryption` (`WPA`/`WEP`/`nopass`), `#hidden` checkbox. Encodes `WIFI:T:<enc>;S:<ssid>;P:<pw>;H:<true|false>;;`; `\ ; , " :` in SSID/password are backslash-escaped. Empty SSID → empty state. |
| Email | `#email-address`, `#email-subject`, `#email-body`. Encodes `mailto:<addr>` plus `?subject=…&body=…` using `encodeURIComponent` (space → `%20`). Empty address → empty state. |
| Phone | `#phone-number`, digits only (non-digits stripped on input). Encodes `tel:+<callingCode><digits>`, default country US (`+1`). |
| SMS | `#sms-phone` (digits only), `#sms-message`. Encodes `smsto:+<callingCode><digits>:<message>`. |
| Country dropdown | Button with `aria-haspopup="listbox"` showing e.g. `🇺🇸 +1 US`. When open: a search box (placeholder `Search (e.g. Hungary or +36)`, autofocused) and `role=option` buttons. Filters by ISO code, calling code, or English name. **Enter selects the first match.** No matches → `No results`. |
| Error correction | Range (7–30) + number input + `%`. Maps to levels: ≤7→L(7), ≤15→M(15), ≤25→Q(25), else H(30); both controls snap to the level's percentage. The number input commits on blur/Enter, clamped to [7,30]; NaN → 7. Default M = 15. |
| Style editor | Collapsed by default; toggled by a button whose text starts with `Style` (`Style ▼` / `Style ▲`). Contains `Customize Style`, 2 rows of colour presets each for FG and BG (`aria-label="Select color #XXXXXX"`, `aria-pressed`), two hex inputs (`aria-label="Hex color value"`: index 0 = FG, 1 = BG), size slider `#qr-size-slider` (120–400) and a size text box (commits 120–400 on blur/Enter, otherwise reverts). |
| Hex input | Accepts with or without `#`, commits only valid `#RGB`/`#RRGGBB`, upper-cases. An invalid draft reverts to the last committed colour on blur. |
| QR render | `react-qr-code` `<svg>` with `width`/`height` = size (default 256), inside a padded div whose background is the BG colour (that padding is the quiet zone). |
| Overflow | Text too long for the level → `⚠️ Content is too long to encode as a QR code. Please shorten the text and try again.` Changing the value or level clears the error. |
| Download | `📥 Download PNG` → a browser download named `qrcode.png`, a PNG at 4× the SVG's on-screen size (1024×1024 at size 256, DPR 1). The PNG has **no quiet zone** (see §6.3). |
| Decode – file | `<input type=file accept="image/*">`. Non-image MIME → `❌ Please select an image file`. Image with no QR → `❌ No QR code found in the image`. Success → `✅ QR Code Decoded Successfully!`, data shown in a monospace `<p>`, plus a `📋 Copy to Clipboard` button. |
| Decode – paste | `📋 Paste Image` uses `navigator.clipboard.read()`. No image → `No image found in clipboard`; rejection → `Failed to access clipboard. Please make sure you have granted permission.` |
| Decode – URL | `<input type=url placeholder="https://example.com/qrcode.png">` + `Load` button. Empty → `Please enter an image URL`. Load failure → `Failed to load image from URL. Make sure the URL is correct and CORS is enabled.` The image is loaded with `crossOrigin='anonymous'`, so a fulfilled route must send `Access-Control-Allow-Origin: *`. |
| Privacy claim | The UI promises that Create mode and file/paste decoding send nothing to a server. That is testable (§5, `privacy.spec.ts`). |

---

## 2. Tooling & configuration

### 2.1 Dependencies (in `web/`, dev only)

```bash
cd web
npm install -D @playwright/test jsqr pngjs @types/pngjs serve
```

- `jsqr` is already a runtime dependency. Reuse it in Node; don't add it twice.
- **Browser version:** this container ships Chromium at `/opt/pw-browsers` (revision `chromium-1194`) with `PLAYWRIGHT_BROWSERS_PATH` set. **Never run `playwright install` here.** After installing, run `npx playwright --version` and a trivial test. If Playwright complains the browser is missing, pin `@playwright/test` to the release that bundles Chromium revision 1194 (check the `browsers.json` in the package), **or** set `launchOptions.executablePath` from an env var (`PW_CHROMIUM_PATH`) used only when it is set. In CI, `npx playwright install --with-deps chromium` is correct.
- Commit the updated `web/package-lock.json`. Use npm, not yarn or pnpm.

### 2.2 Scripts (`web/package.json`)

```json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui",
"test:e2e:report": "playwright show-report",
"typecheck:e2e": "tsc -p e2e/tsconfig.json --noEmit"
```

### 2.3 `web/playwright.config.ts`

- `testDir: './e2e'`, `fullyParallel: true`, `forbidOnly: !!process.env.CI`, `retries: process.env.CI ? 1 : 0`, `workers: process.env.CI ? 2 : undefined`.
- `reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]]`.
- `use: { baseURL: 'http://127.0.0.1:3100', trace: 'on-first-retry', screenshot: 'only-on-failure', video: 'retain-on-failure' }`.
- `webServer`:
  ```ts
  {
    command: 'npm run build && npx serve out -l 3100 --no-clipboard',
    url: 'http://127.0.0.1:3100',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  }
  ```
  (`serve` is a devDependency, so `npx` resolves it locally without network access.)
- Projects:
  - `chromium` — `devices['Desktop Chrome']`, `viewport: { width: 1280, height: 900 }`. Runs everything.
  - `mobile-chromium` — `devices['Pixel 7']`. Runs only tests tagged `@smoke` (`grep: /@smoke/`).
  - Firefox/WebKit are **not** included now (clipboard permission APIs differ; not installed here). Leave a comment showing where to add them.

### 2.4 TypeScript isolation

`next build` type-checks every file matched by `web/tsconfig.json`. To keep the Vercel/web build independent of test tooling (AGENTS.md rule 5):

- Add `"e2e"` and `"playwright.config.ts"` to `exclude` in `web/tsconfig.json`.
- Create `web/e2e/tsconfig.json` (extends `../tsconfig.json`, `include: ["./**/*.ts", "../playwright.config.ts"]`, `compilerOptions.types: ["node"]`, `noEmit: true`), and make `npm run typecheck:e2e` pass.
- `web/eslint.config.mjs` already lints `e2e/`. `npm run lint` must stay clean. Turn off `react-hooks/rules-of-hooks` for `e2e/**` only if Playwright's `use` fixture parameter trips it.

### 2.5 Keep root Jest away from Playwright specs

Root `jest.config.js` (rootDir = repo root) would pick up `web/e2e/*.spec.ts` with its default `testMatch`. Add:

```js
testPathIgnorePatterns: ['/node_modules/', '<rootDir>/web/'],
```

Then confirm that `npm test` at the root still passes with the same test count as before.

### 2.6 Ignore generated output

Add to `web/.gitignore` (create it if missing): `/test-results/`, `/playwright-report/`, `/blob-report/`, `/playwright/.cache/`.

---

## 3. Test hooks in the app (separate commit, attributes only)

Prefer role, label and text locators. Add hooks only where no stable accessible locator exists:

| File | Element | Add |
|---|---|---|
| `QrDisplay.tsx` | the padded div wrapping `<QRCode>` (`ref={containerRef}`) | `data-testid="qr-code"` |
| `ErrorCorrectionControl.tsx` | range input | `aria-label="Error correction level"` |
| `ErrorCorrectionControl.tsx` | number input | `aria-label="Error correction percentage"` |
| `QrStyleEditor.tsx` | size text input | `aria-label="QR size in pixels"` |
| `QrStyleEditor.tsx` | size range `#qr-size-slider` | none: it already has a `<label htmlFor>` named `Size` |
| `QrDecoder.tsx` | file input | `aria-label="Upload image file"` |
| `QrDecoder.tsx` | URL input | `aria-label="Image URL"` |
| `QrDecoder.tsx` | decoded-data `<p>` | `data-testid="decoded-data"` |

These are accessibility improvements too. Don't rename or restyle anything.

---

## 4. Test infrastructure (`web/e2e/`)

```
web/e2e/
├── tsconfig.json
├── fixtures/
│   └── test.ts              # extended `test` with page objects + helpers
├── pages/
│   ├── CreatePage.ts        # page object for Create mode
│   └── DecodePage.ts        # page object for Decode mode
├── utils/
│   ├── qr.ts                # decode PNG buffers / locators with jsQR
│   └── images.ts            # build fixture PNGs in memory (pngjs)
├── smoke.spec.ts
├── create-url-text.spec.ts
├── create-wifi.spec.ts
├── create-email.spec.ts
├── create-phone-sms.spec.ts
├── country-picker.spec.ts
├── error-correction.spec.ts
├── style-editor.spec.ts
├── download.spec.ts
├── decode-file.spec.ts
├── decode-clipboard.spec.ts
├── decode-url.spec.ts
├── roundtrip.spec.ts
└── privacy.spec.ts
```

Generate fixture images in memory (§4.3) so no binary files are committed. If a binary fixture turns out unavoidable, keep it under 10 KB in `e2e/fixtures/`.

### 4.1 Page objects

`CreatePage` (constructor takes `Page`):
- `goto()` → `page.goto('/')`, then wait for the `QRCrafter` heading.
- `selectType(label: 'URL' | 'Text' | 'Wi-Fi' | 'Email' | 'Phone' | 'SMS')`
- `fillSimple(value)`, `fillWifi({ ssid, password?, encryption?, hidden? })`, `fillEmail({ address, subject?, body? })`, `fillPhone(digits)`, `fillSms({ phone, message? })`
- `pickCountry(kind: 'phone' | 'sms', query: string, how: 'enter' | 'click')`
- `setEclPercent(n)` (types into the number input and presses Enter), `setEclSlider(n)` (`locator.fill(String(n))` works on range inputs in Chromium)
- `openStyle()` (idempotent: reads `Style ▲`/`Style ▼`), `setFgHex(hex)`, `setBgHex(hex)`, `clickPreset('fg' | 'bg', hex, row = 0)`, `setSize(n, via: 'slider' | 'text')`
- `qrCode` (locator `getByTestId('qr-code')`), `qrSvg`, `emptyState`, `overflowMessage`, `downloadButton`
- `decodeRenderedQr(): Promise<string>` → screenshot `qrCode` and decode it (§4.2)

`DecodePage`:
- `goto()` → Create page, then click `Decode`
- `uploadBuffer(name, mimeType, buffer)` via `setInputFiles({ name, mimeType, buffer })`
- `paste()`, `loadUrl(url)`
- `result` (`getByTestId('decoded-data')`), `success` (`✅ QR Code Decoded Successfully!`), `error` (paragraph starting with `❌`), `copyButton`

Expose both through `fixtures/test.ts`:

```ts
export const test = base.extend<{ create: CreatePage; decode: DecodePage }>({ ... });
export { expect } from '@playwright/test';
```

Spec files import `test`/`expect` **only** from `./fixtures/test`.

### 4.2 `utils/qr.ts`: the oracle

```ts
/** Decode a QR code from a PNG buffer. Throws if none is found. */
export function decodeQrPng(png: Buffer, opts?: { padding?: number }): string
/** Screenshot a locator and decode the QR inside it. */
export async function decodeQrLocator(locator: Locator): Promise<string>
```

- Use `PNG.sync.read` from `pngjs`, then `jsQR(new Uint8ClampedArray(data.buffer, data.byteOffset, data.length), width, height)`.
- `padding` (default 0) adds a white border before decoding. It exists for the raw download PNG, which has no quiet zone.
- Screenshot with `{ animations: 'disabled', scale: 'device' }`.
- Add a unit-style self-test (`roundtrip.spec.ts` → "oracle sanity") that decodes a screenshot of a known value. If the oracle is broken, every other test is meaningless.

### 4.3 `utils/images.ts`

- `blankPng(w = 200, h = 200, rgba = [255, 255, 255, 255]): Buffer` (no QR inside).
- `withBorder(png: Buffer, px: number): Buffer` (white padding; used by the oracle).
- QR-containing PNGs: **don't** hand-encode QR. Get them by screenshotting the app's own rendered QR (`create.qrCode.screenshot()`) in a `beforeAll`/helper that uses a fresh page, and cache them per worker. Name it `renderQrPng(browser, value): Promise<Buffer>`.

---

## 5. Test catalogue

Tag smoke-level tests with `@smoke` in the title. Every Create-mode "encodes" assertion uses `decodeRenderedQr()`.

### `smoke.spec.ts` (all `@smoke`)
1. Page loads: title `QRCrafter - Generate QR Codes`, heading `QRCrafter`, the manifest link exists, no console errors (collect `page.on('console')` errors and `pageerror`, then assert the list is empty).
2. Default state: Create active, URL type, empty-state placeholder, ECL number shows `15`, style editor collapsed.
3. Typing `https://example.com` renders a QR that decodes to `https://example.com`, and the Download button appears.
4. Switching to Decode shows `Decode QR Code`, the file input, `📋 Paste Image`, `Load`. Switching back restores Create.

### `create-url-text.spec.ts`
1. URL → decodes verbatim (include a query string and fragment: `https://example.com/a?b=1&c=two#frag`).
2. Text multi-line + Unicode (`Hello\nWörld 🌍 日本`) → decodes byte-for-byte equal. If jsQR's UTF-8 handling differs, compare after normalizing to NFC and note it.
3. Clearing the input brings the empty state back (no svg, no download button).
4. Switching type clears the value: type text in URL, switch to Text, then the textarea is empty and the empty state shows.
5. Create state survives a Create→Decode→Create round trip (current behaviour: `Home` owns the state).

### `create-wifi.spec.ts`
1. SSID only → `WIFI:T:WPA;S:Home;P:;H:false;;`
2. Full config: SSID `Café Net`, password `p@ss`, `WEP`, hidden → `WIFI:T:WEP;S:Café Net;P:p@ss;H:true;;`
3. Escaping: SSID `a;b,c"d:e\f`, password `x;y` → `WIFI:T:WPA;S:a\;b\,c\"d\:e\\f;P:x\;y;H:false;;` (write the expected value as a TS string literal with doubled backslashes, then double-check it).
4. `nopass` → `T:nopass`.
5. Password only, SSID empty → empty state.
6. The password field is `type=password`.

### `create-email.spec.ts`
1. Address only → `mailto:a@b.co`
2. Address + subject `Hello World` + body `Line1\nLine2&x=1` → `mailto:a@b.co?subject=Hello%20World&body=Line1%0ALine2%26x%3D1`
3. Subject without address → empty state.

### `create-phone-sms.spec.ts`
1. Phone `555-123 4567` typed → the input shows `5551234567`, decodes `tel:+15551234567`.
2. Letters are stripped (`abc123` → `123`).
3. SMS phone + message `Hi there` → `smsto:+15551234567:Hi there`.
4. SMS phone only → `smsto:+15551234567:`
5. SMS message only → empty state.

### `country-picker.spec.ts`
1. The dropdown is closed by default (`aria-expanded="false"`). Clicking opens it; the search box is focused.
2. Search `Hungary` + Enter → button shows `+36 HU`; phone `301234567` → `tel:+36301234567`.
3. Search `+44` → the first option contains `+44`. Click it → `tel:+44…`.
4. Search `de` (lower-case code) → contains the `DE` option.
5. Search `zzzz` → `No results`; Enter does nothing (still open, country unchanged).
6. The SMS picker works on its own (pick `HU` for SMS, then `smsto:+36…`).
7. Changing type resets the country to US (pick HU on Phone, switch to SMS and back, see `+1 US`).
8. Picking a country closes the dropdown.

### `error-correction.spec.ts`
1. Default slider and input both show 15.
2. Table-driven over the number input + Enter: `7→7`, `8→15`, `15→15`, `16→25`, `25→25`, `26→30`, `30→30`, `0→7`, `100→30`, `abc→7`, `''→7`. Assert both the number input and the slider value.
3. Slider `fill('20')` → both show `25`.
4. Blur commits the same way as Enter (type `26`, press Tab, see `30`).
5. Level changes the QR density: with the same text, the SVG's `viewBox` module count at H is ≥ the count at L (read the `viewBox` attribute). The QR still decodes at every level.
6. ECL survives a type switch (set 30, switch type, still 30).

### `style-editor.spec.ts`
1. Toggle: `Style ▼` → click → `Customize Style` visible, button `Style ▲` → click → hidden.
2. FG preset click → its `aria-pressed="true"`, the others `false`; the SVG's dark-module `fill` equals that colour (react-qr-code puts `fill` on `<path>`s; check what it really renders).
3. BG preset → the `qr-code` container's computed `background-color` matches (compare as `rgb(...)`).
4. Hex input `ff0000` (no `#`) + Enter → shows `#FF0000`, FG applied.
5. Invalid hex `#12` + blur → reverts to the previous colour, QR unchanged.
6. 3-digit hex `#0F0` accepted → `#0F0` shown upper-cased.
7. Size slider `fill('300')` → svg `width`/`height` = `300`; the text box shows `300`.
8. Size text `150` + Enter → svg 150. Values `119`, `401`, `abc` + blur → revert to the previous size.
9. The QR still **decodes** after a dark-FG/light-BG change (e.g. `#2563EB` on `#FFFFFF`). Don't test low-contrast combinations for decodability.
10. Style survives a type switch.

### `download.spec.ts`
1. `Promise.all([page.waitForEvent('download'), create.downloadButton.click()])` → `suggestedFilename()` = `qrcode.png`.
2. The saved file starts with the PNG magic bytes and is 1024×1024 at size 256 / DPR 1 (read with `pngjs`). Size 300 → 1200×1200.
3. The downloaded PNG decodes to the input value with `decodeQrPng(buf, { padding: 32 })`.
4. **Investigate without padding:** try `decodeQrPng(buf)` with padding 0. If it fails, that's a real UX finding (the exported PNG has no quiet zone, so many scanners can't read it): report it per §0.5 rather than changing the assertion. Keep test 3 green either way.
5. The PNG background honours the custom BG colour: sample the corner pixel after setting BG `#FFFF00`.

### `decode-file.spec.ts`
1. Upload a QR PNG (from `renderQrPng(browser, 'decode-me-123')`) → success banner + `decoded-data` = `decode-me-123`.
2. JPEG input works too: convert in-page via canvas `toDataURL('image/jpeg', 0.95)` in a helper, or skip JPEG if conversion makes the test flaky (note it).
3. Blank PNG → `❌ No QR code found in the image`; no success banner.
4. `notes.txt`, `text/plain` → `❌ Please select an image file`.
5. A corrupt "PNG" (`image/png`, random bytes) → `❌ Failed to load image`.
6. A second upload replaces the first result (decode A, then B, shows B only).
7. A successful decode after an error clears the error.
8. Copy button: grant `['clipboard-read', 'clipboard-write']` on the context, click `📋 Copy to Clipboard`, then `page.evaluate(() => navigator.clipboard.readText())` equals the data.

### `decode-clipboard.spec.ts`
Real clipboard image round trips in headless Chromium are fragile, so **stub `navigator.clipboard.read`** with `page.addInitScript` (or `page.evaluate` before clicking):
1. Stub returns a `ClipboardItem` holding a QR PNG blob (pass the bytes as a base64 string into the page) → success with the expected data.
2. Stub returns an item with only `text/plain` → `No image found in clipboard`.
3. Stub rejects with `NotAllowedError` → `Failed to access clipboard. Please make sure you have granted permission.`
4. Optional, non-blocking: one real-clipboard test with granted permissions that writes an image via `navigator.clipboard.write` and then pastes. Tag it `@real-clipboard`. If it flakes even once locally, delete it rather than retrying it.

### `decode-url.spec.ts`
All URLs point at a fake origin, `https://fixtures.qrcrafter.test/...`, fulfilled with `page.route`:
1. Route returns a QR PNG with `Access-Control-Allow-Origin: *` → success with the expected data.
2. Empty input + Load → `Please enter an image URL`. Whitespace-only input also counts as empty.
3. `route.abort()` → the CORS/failed-to-load message.
4. A 200 response **without** an ACAO header → the failed-to-load message (pins the CORS requirement).
5. Route returns a blank PNG → `No QR code found in the image`.
6. Assert the request went to exactly the URL entered (`page.waitForRequest`).

### `roundtrip.spec.ts`
1. Oracle sanity (§4.2).
2. For each type (URL, Text, Wi-Fi, Email, Phone, SMS) with representative values: Create → screenshot the QR → Decode tab → upload the screenshot → `decoded-data` equals the payload the oracle decoded. This proves the app's own decoder reads the app's own output.
3. Download → upload the downloaded PNG **as-is** into Decode. If this fails because there is no quiet zone (see `download.spec.ts` #4), report it per §0.5.

### `privacy.spec.ts`
1. Record every request (`page.on('request')`) during: load, a full Create flow across all types, style changes, download, and a file decode. Assert every request URL's origin is `http://127.0.0.1:3100` (or `data:`/`blob:`). This guards the "no data sent to any server" promise.
2. Decode via URL makes exactly one request to the user-supplied host (with the route from `decode-url`), and nothing else leaves localhost.

### Out of scope for this iteration (list in the final summary as follow-ups)
- Visual regression snapshots (font rendering differs across OSes; add later with Linux-only baselines generated in CI).
- Dark mode beyond a smoke check. If time allows, add one `@smoke` test with `colorScheme: 'dark'` that checks the page renders and the QR still decodes.
- Tauri desktop shell (needs `tauri-driver`/WebDriver; a separate effort).
- Firefox/WebKit projects.
- Accessibility audit (`@axe-core/playwright`). Recommended as the next step.

---

## 6. CI (`.github/workflows/ci.yml`)

Add a third job, `web-e2e`, mirroring the existing `web` job:

```yaml
  web-e2e:
    name: Web E2E (Playwright)
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: web
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22.11.0
          cache: npm
          cache-dependency-path: web/package-lock.json
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run typecheck:e2e
      - run: npm run test:e2e
      - if: ${{ !cancelled() }}
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: web/playwright-report/
          retention-days: 14
```

Keep `permissions: contents: read`. Don't touch the `release.yml` workflow.

---

## 7. Execution order & commits

Work on the designated branch and commit after each step that verifies green:

1. **Tooling:** deps, `playwright.config.ts`, scripts, tsconfig isolation, `.gitignore`, root Jest ignore, and one placeholder smoke test (page title). Verify: `npm run test:e2e`, `npm run lint`, `npm run build`, `npm run typecheck:e2e` (all in `web/`), plus root `npm test`. Commit: `test(web): scaffold Playwright e2e suite`.
2. **Test hooks** (§3). Verify `npm run build` + `npm run lint`. Commit: `chore(web): add test ids and aria labels for e2e`.
3. **Infrastructure** (§4): page objects, fixtures, oracle, images, oracle sanity test. Commit.
4. **Create-mode specs** (smoke, url/text, wifi, email, phone/sms, country, ECL, style). Commit per 2–3 files.
5. **Download + Decode specs** (download, decode-file, decode-clipboard, decode-url). Commit.
6. **Roundtrip + privacy.** Commit.
7. **CI job** (§6). Commit: `ci: run Playwright e2e on web`.
8. **Stability gate:** `npx playwright test --repeat-each=5 --workers=4` must pass 100%. Fix any flake at its root cause (usually a missing web-first assertion). Don't add retries or timeouts to mask it.
9. Add an "E2E tests" section to `web/README.md` and the Test section of `AGENTS.md` (commands from §2.2, how to run one spec, where reports land).
10. Push with `git push -u origin <branch>`.

## 8. Definition of done

- [ ] All specs in §5 exist and pass on `chromium`; `@smoke` passes on `mobile-chromium`.
- [ ] `--repeat-each=5` passes with zero failures.
- [ ] Full local run < 60 s after the build (report the actual number).
- [ ] `npm run lint`, `npm run build`, `npm run typecheck:e2e` (web) and `npm test` (root) are green.
- [ ] No committed binaries over 10 KB, no `waitForTimeout`, no `test.only`, no `any`, no `@ts-ignore`.
- [ ] App source diff is limited to the §3 attributes.
- [ ] Final summary lists: test count per file, any plan deviations (§0.6), bugs found (especially the download quiet-zone question), and the §5 follow-ups.
