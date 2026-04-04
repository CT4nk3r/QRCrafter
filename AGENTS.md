# AGENTS.md — QRCrafter

Multi-platform QR code generator/decoder: React Native (mobile), Next.js (web), Tauri (desktop).
Shared business logic lives in `shared/`. Each frontend re-exports from `shared/` via local barrel files.

## Build & Run Commands

### Mobile (React Native) — root workspace

```bash
npm install                    # Install dependencies (runs patch-package via postinstall)
npm start                      # Start Metro bundler
npm run android                # Build and run on Android
npm run ios                    # Build and run on iOS
```

### Web (Next.js) — `web/` directory

```bash
cd web && npm install          # Install web dependencies
cd web && npm run dev          # Dev server
cd web && npm run build        # Production build (static export)
cd web && npm run lint         # Run Next.js lint
```

### Desktop (Tauri) — `web/` directory

```bash
cd web && npm run tauri:dev    # Dev mode with Tauri desktop shell
cd web && npm run tauri:build  # Production desktop build
```

### Lint

```bash
npm run lint                   # ESLint across root (React Native code)
cd web && npm run lint         # Next.js lint for web code
```

### Test

```bash
npm test                       # Run all tests (Jest, react-native preset)
npx jest --testPathPattern="App.test"   # Run a single test file by name
npx jest __tests__/App.test.tsx         # Run a single test file by path
npx jest --watch                        # Watch mode
```

Test config: `jest.config.js` (preset: `react-native`). Tests live in `__tests__/`, mocks in `__mocks__/`.

### Version Sync

```bash
npm run version:sync           # Sync version across package.json, web/package.json, tauri.conf.json
```

## Project Layout

```
root/                          # React Native workspace + coordination layer
├── src/                       # Mobile UI (screens, components, theme, types, utils)
├── shared/                    # Shared business logic (types, encoders, constants)
├── web/                       # Standalone Next.js web app
│   ├── src/                   # Web UI (app router, components, types, utils)
│   └── src-tauri/             # Tauri desktop shell (Rust)
├── android/                   # Native Android project
├── ios/                       # Native iOS project
├── scripts/                   # Release automation scripts
├── __tests__/                 # Jest tests
└── __mocks__/                 # Jest mocks for native modules
```

## Code Style

### Formatting (Prettier)

- Single quotes, trailing commas (`all`), no parens on single arrow params (`arrowParens: 'avoid'`)
- Config: `.prettierrc.js`

### Imports

- **Order**: external packages first, then internal modules (relative paths), types mixed in
- **Paths**: always relative — no `@/` aliases in mobile code. Web uses `@/*` mapping to `./src/*`
- **Barrel re-exports**: `src/types/` and `src/utils/` re-export from `shared/`; same for `web/src/types/` and `web/src/utils/`
- Use named imports/exports everywhere. Only use `export default` where frameworks require it (Next.js pages/layouts, React Native `App.tsx`)

### Components

- Always use `function` declarations for components — never `const Foo = () => {}`
- Arrow functions are for inline callbacks, local helpers, and validation functions only
- Props: define a separate `interface Props { ... }` above the component, destructured in the signature
  ```typescript
  interface Props {
    value: string;
    onChange: (v: string) => void;
  }
  export function MyComponent({ value, onChange }: Props) { ... }
  ```
- Inline prop types only for small private sub-components within the same file

### Naming Conventions

| Element                | Convention              | Example                                                |
| ---------------------- | ----------------------- | ------------------------------------------------------ |
| Component files        | PascalCase              | `QrInputForm.tsx`, `HomeScreen.tsx`                    |
| Utility files          | camelCase               | `encoders.ts`, `download.ts`, `pngDecoder.ts`          |
| Directories            | lowercase/camelCase     | `components/`, `screens/`, `utils/`, `src-tauri/`      |
| Variables, functions   | camelCase               | `qrValue`, `handleShare`, `encodeWifi`                 |
| Event handlers         | `handle` prefix         | `handleTypeChange`, `handleSave`, `handlePickImage`    |
| Types, interfaces      | PascalCase              | `QrType`, `WifiConfig`, `ErrorCorrectionLevel`         |
| Module-level constants | UPPER_SNAKE_CASE        | `PRESET_COLORS`, `QR_TYPE_OPTIONS`, `DEFAULT_QR_STYLE` |
| Hooks                  | `use` prefix, camelCase | `useAppTheme`                                          |

### Types

- Use `interface` for object shapes (props, configs, data structures)
- Use `type` for unions, aliases, and simple types (`type QrType = 'url' | 'text' | ...`)
- Explicit return types on utility/helper functions; implicit on React components
- Avoid `any` — acceptable only for third-party refs without typings and RN catch clauses (`catch (err: any)`)
- No `@ts-ignore` or `@ts-expect-error`

### State Management

- React built-in only — `useState`, `useMemo`, `useCallback`, `useRef`. No external state libraries
- `useMemo` for derived/computed values
- `useCallback` for event handlers in React Native; plain functions in Next.js components
- State is passed via props (prop drilling). No React Context or global stores

### Error Handling

- `try/catch` for async operations. Surface errors to users via `Alert.alert()` (mobile) or `setError()` state (web)
- Class-based error boundary wraps QR rendering on web (`QrErrorBoundary` in `QrDisplay.tsx`)
- No custom error classes — use standard `new Error('message')`
- Web side: `catch (err)` without type annotation, log with `console.error`
- Mobile side: `catch (err: any)` to access `err?.message`

### Comments

- JSDoc (`/** */`) for utility functions and file-level docs in shared/library code
- Single-line `//` for inline explanations and section labels in component files
- JSX comments (`{/* Section Name */}`) to label visual sections in render output
- Keep comments sparse and functional — label sections and explain "why", not "what"

## Architecture Rules

These rules come from `.github/copilot-instructions.md` — read it for full details.

1. **Shared logic in `shared/`**: pure TypeScript logic (types, encoders, validators, constants) goes in `shared/`. Never put platform UI code there
2. **Platform UI is separate**: mobile UI in `src/`, web UI in `web/src/`, desktop shell in `web/src-tauri/`
3. **Re-export pattern**: each frontend has local `types/` and `utils/` folders that re-export from `shared/` for ergonomic imports
4. **Desktop wraps web**: Tauri packages the Next.js static export — desktop and web share the same frontend
5. **Web deploys independently**: the web app builds and deploys (Vercel) without depending on the mobile toolchain
6. **Design tokens in shared**: all colors, spacing, and theme values originate in `shared/`. Mobile uses `useAppTheme()`, web uses CSS variables via `injectCSSVariables()`
7. **Node.js requirement**: `>= 22.11.0` (see `engines` in `package.json`)
8. **Package manager**: npm (not yarn or pnpm). Lockfiles: `package-lock.json`
