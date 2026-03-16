# Project Structure Template

This repository is organized as a **multi-target application** with one shared product idea and multiple delivery platforms:

- **React Native app** for Android/iOS
- **Web app** built separately, but designed to look and behave like the mobile app
- **Desktop app** built with **Tauri**, using the web app as its frontend
- **Shared business logic** reused by mobile and web
- **Vercel deployment** for the web target
- **Local release scripts** for Android and desktop artifacts

The goal of this structure is to keep **UI implementation platform-specific**, while keeping **core business rules and data encoding logic shared**.

---

## 1. Architecture at a glance

```text
root/
├─ App.tsx / index.js              # React Native entry point
├─ src/                            # Mobile UI and mobile-specific code
├─ shared/                         # Shared business logic used by all frontends
├─ web/                            # Standalone web app (Next.js)
│  ├─ src/                         # Web UI
│  └─ src-tauri/                   # Desktop shell for the web app
├─ android/                        # Native Android project
├─ ios/                            # Native iOS project
├─ scripts/                        # Local release automation
├─ assets/                         # Images and marketing assets
├─ __tests__/ and __mocks__/       # Tests and test doubles
└─ vercel.json                     # Root deployment config for the web app
```

### Core idea

Use this template when you want:

1. **one product**,
2. **multiple frontends**,
3. **shared logic at the TypeScript level**,
4. **separate build pipelines per platform**.

---

## 2. Responsibility of each top-level area

## Root

The repository root is the **mobile application workspace** and the **coordination layer** for the whole project.

Main files:

- `package.json` — React Native dependencies and root scripts
- `App.tsx` — mobile shell / tab navigation / app-level composition
- `index.js` — React Native registration entry
- `vercel.json` — tells Vercel to build and deploy the web app from the `web/` folder
- `README.md` — product-level documentation

Use the root for:

- shared repository metadata
- React Native app bootstrapping
- top-level automation and version coordination
- deployment configuration that targets the web subproject

---

## 3. Mobile app structure

The **mobile app** lives mainly in `src/` plus the native folders.

```text
src/
├─ components/    # Reusable React Native UI building blocks
├─ screens/       # Mobile screens / page-level flows
├─ theme/         # Colors and theme hooks
├─ types/         # Local type re-exports for mobile imports
└─ utils/         # Local utility re-exports for mobile imports
```

### Recommended responsibilities

- `src/components/`
  - reusable UI pieces
  - input controls
  - settings bars
  - customizers
- `src/screens/`
  - top-level screen composition
  - screen-specific state orchestration
- `src/theme/`
  - re-exports design tokens from `shared/theme.ts`
  - adds a `useTheme()` hook for dark/light mode switching
  - never defines new token values — `shared/theme.ts` is the single source of truth
- `src/types/` and `src/utils/`
  - **re-export from `shared/`** so the mobile app can use short, local imports without duplicating logic

### Native platform folders

- `android/` — Gradle-based Android project
- `ios/` — Xcode/iOS project

These should only contain **platform-native setup**:

- permissions
- signing
- native manifests / plist entries
- native build settings
- native packaging

Avoid putting business rules here.

---

## 4. Web app structure

The web app is intentionally separated into its own project under `web/`.

```text
web/
├─ package.json        # Web-specific dependencies and scripts
├─ next.config.js      # Next.js configuration
├─ tailwind.config.js  # Tailwind setup
├─ postcss.config.js   # CSS pipeline
├─ vercel.json         # Optional web-local deployment config
├─ public/             # Static assets
├─ src/
│  ├─ app/             # Next.js App Router entrypoints
│  ├─ components/      # Web UI components
│  ├─ types/           # Local re-exports to shared types
│  └─ utils/           # Local re-exports to shared utilities
└─ src-tauri/          # Desktop shell wrapping the web app
```

### Why keep web separate?

Because the web app has:

- its own dependencies
- its own bundler/runtime expectations
- its own deployment target
- its own styling system

This separation keeps the web stack clean while still allowing shared business logic.

### Important pattern

Like mobile, the web app keeps platform-facing imports local:

- `web/src/types/*` re-export from `shared/`
- `web/src/utils/*` re-export from `shared/`

That means the web UI can stay clean and platform-oriented, while the real logic still lives in one place.

### Design token usage (web)

At the web app root (e.g. `app/layout.tsx` or `_app.tsx`), call `injectCSSVariables()` from `shared/theme.ts` once. This writes all design tokens as CSS custom properties onto `:root`, making them available everywhere in CSS and Tailwind:

```ts
import { injectCSSVariables } from '../../shared/theme';
injectCSSVariables();
```

Then in components and CSS:

```css
.card {
  background: var(--color-bg-surface);
  padding: var(--spacing-4);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}
```

The `tailwind.config.js` should reference the same CSS variables so utility classes stay in sync with the shared token values.

---

## 5. Shared business logic

The `shared/` folder is the most important part of the template.

```text
shared/
├─ qr.ts         # Shared domain types, constants, options
├─ encoders.ts   # Shared business logic / formatter / encoder helpers
└─ theme.ts      # Design tokens: colors, spacing, typography, radii, shadows, animation
```

Put here anything that should behave **identically across mobile, web, and desktop**, for example:

- domain types
- business rules
- formatting rules
- encoder/decoder helpers
- validation logic
- constant option lists
- serialization rules
- design tokens (colors, spacing, typography, radii, shadows, animation timing)

Do **not** put platform UI code in `shared/`.

### Rule of thumb

- If it touches React Native components, keep it in `src/`
- If it touches browser-only APIs, keep it in `web/src/`
- If it is pure TypeScript logic, prefer `shared/`

This is what lets the mobile app and web app remain visually different internally, while still producing the same outputs.

---

## 6. Desktop app with Tauri

The desktop app is not a third fully separate frontend. It is a **desktop wrapper around the web app**.

```text
web/src-tauri/
├─ Cargo.toml         # Rust/Tauri dependencies
├─ tauri.conf.json    # Tauri packaging/build configuration
├─ src/
│  ├─ main.rs
│  └─ lib.rs
├─ icons/
└─ capabilities/
```

### How it works

1. The **web app** is built first.
2. Tauri packages that frontend into a native desktop application.
3. Rust is used only for the desktop shell and native integration.

### Why this is useful

This avoids maintaining a completely separate desktop UI codebase.

Instead:

- **web = browser delivery**
- **web + Tauri = desktop delivery**

So desktop and web share the same frontend implementation, while mobile has its own UI implementation.

---

## 7. Deployment model

### Vercel

Vercel is used to deploy the **web application**, not the React Native app.

At the repository level, deployment points to the `web/` project:

- install command runs inside `web/`
- build command runs inside `web/`
- output points to the Next.js build output

This keeps the repository monorepo-like, while making the web app deployable as an independent target.

### Recommended deployment rule

Treat deployment like this:

- **mobile** → app stores / native distribution
- **web** → Vercel
- **desktop** → local or CI packaging via Tauri

---

## 8. Release automation

The `scripts/` folder contains local build and packaging automation.

```text
scripts/
├─ release-android.sh / .ps1   # Build APK/AAB
├─ release-linux.sh            # Build Linux desktop bundles via Tauri
├─ release-windows.ps1         # Build Windows desktop bundles via Tauri
├─ release.sh                  # Convenience wrapper for supported targets
└─ sync-versions.js            # Keep versions aligned across subprojects
```

### Release strategy

The scripts follow a simple pattern:

1. Read the current version from the latest git tag
2. Build the relevant platform
3. Copy artifacts into `releases/<version>/`
4. Generate checksum files

### Why this is a good template

It gives you:

- repeatable local builds
- predictable artifact naming
- one release directory per version
- easy handoff to QA or distribution

---

## 9. Versioning strategy

This repository keeps version numbers aligned across multiple places.

The `sync-versions.js` script updates version values in:

- root `package.json`
- root lockfile
- `web/package.json`
- `web` lockfile
- `web/src-tauri/tauri.conf.json`

### Template recommendation

When using this structure in another app, always define a **single source of truth** for the version and sync all downstream manifests from it.

---

## 10. How to add a new feature in this structure

Use this decision model:

### Add to `shared/` when:

- the logic must behave the same everywhere
- the code is UI-independent
- the code is pure TypeScript/domain logic
- the value must stay visually consistent across mobile and web

Examples:

- data transformation
- QR payload generation
- validation rules
- shared enums and option lists
- design tokens (colors, spacing, typography, radii, shadows, animation timing)

### Add to `src/` when:

- the feature is mobile-only
- it depends on React Native APIs
- it needs native permissions or mobile-specific UX

Examples:

- camera roll integration
- native share sheets
- mobile screen layouts

### Add to `web/src/` when:

- the feature is browser-only
- it depends on DOM or clipboard APIs
- it belongs to the web presentation layer

Examples:

- file upload UX
- browser download handling
- Tailwind-based page layout

### Add to `web/src-tauri/` when:

- the desktop wrapper needs native behavior
- the feature requires Tauri or Rust integration

Examples:

- desktop file system integration
- desktop menus
- native desktop capabilities

---

## 11. Suggested template rules for the next project

If you reuse this structure for another product, keep these rules:

### Rule 1 — Separate UI by platform

Keep platform UI code separate:

- mobile UI in `src/`
- web UI in `web/src/`
- desktop shell in `web/src-tauri/`

### Rule 2 — Share logic, not rendering

Share:

- business logic
- types
- configuration models
- validators
- encoders/decoders

Do not try to force one rendering layer across all platforms unless it actually reduces complexity.

### Rule 3 — Keep imports ergonomic

Use local re-export files in each frontend so imports remain readable, even when the source of truth is `shared/`.

### Rule 4 — Make web deploy independently

The web app should be deployable without depending on the mobile toolchain.

### Rule 5 — Let desktop depend on web

If the desktop experience can use the same frontend as web, wrap the web app with Tauri instead of creating a separate desktop UI.

### Rule 6 — Automate release packaging

Platform release scripts should:

- build
- collect artifacts
- rename consistently
- generate checksums
- store outputs by version

### Rule 7 — Keep design tokens in `shared/`, not per-platform

Define all design tokens (colors, spacing, typography, radii, shadows, animation timing) once in `shared/theme.ts`.

- Mobile consumes them directly via `StyleSheet` and `useTheme()`
- Web consumes them via `injectCSSVariables()` at the app root, then uses `var(--token-name)` in CSS
- Desktop inherits them automatically through the web app

Never duplicate token values in `src/theme/` or `web/src/`. Those folders are re-export and hook layers only — `shared/theme.ts` is the single source of truth.

---

## 12. Example folder contract for a future project

```text
my-app/
├─ package.json
├─ App.tsx
├─ src/                    # Mobile app
├─ shared/                 # Shared business/domain logic
├─ web/                    # Web app
│  ├─ package.json
│  ├─ src/
│  └─ src-tauri/           # Desktop wrapper for the web app
├─ android/
├─ ios/
├─ scripts/
├─ assets/
├─ __tests__/
└─ vercel.json
```

This is a strong template when you want to ship the same product to:

- mobile users,
- browser users,
- desktop users,

without rewriting the core logic three times.

---

## 13. Summary

This project works because it applies a clear split:

- **React Native** handles the mobile experience
- **Next.js** handles the web experience
- **Tauri** turns the web experience into a desktop app
- **`shared/`** holds reusable business logic and design tokens
- **Vercel** deploys the web target
- **scripts/** automate local release creation

In short:

> **One product, multiple frontends, shared domain logic, separate delivery pipelines.**

That is the main template to carry into the next application.
