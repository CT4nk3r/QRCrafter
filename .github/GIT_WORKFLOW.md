# GIT_WORKFLOW.md — QRCrafter

Git conventions for branching, commits, and releases. All contributors and AI coding agents **must** follow these rules for all new work going forward.

> **Note**: Commits and branches created before this document was introduced do not follow these conventions. Do not use prior git history as a reference for style. These rules are the source of truth.

## Branching Strategy (Conventional Branching)

### Branch Naming

All branches **must** use the format: `<type>/<short-description>`

| Type        | Purpose                                  | Example                            |
| ----------- | ---------------------------------------- | ---------------------------------- |
| `feature/`  | New functionality                        | `feature/qr-batch-export`          |
| `fix/`      | Bug fixes                                | `fix/png-decoder-crash`            |
| `refactor/` | Code restructuring (no behavior change)  | `refactor/extract-encoder-helpers` |
| `docs/`     | Documentation only                       | `docs/update-readme-install`       |
| `chore/`    | Tooling, CI, dependencies, config        | `chore/upgrade-react-native-085`   |
| `test/`     | Adding or fixing tests                   | `test/add-encoder-unit-tests`      |
| `perf/`     | Performance improvements                 | `perf/lazy-load-qr-renderer`       |
| `style/`    | Formatting, whitespace (no logic change) | `style/fix-prettier-violations`    |

### Rules

- `master` is the default and production branch -- never commit directly to it
- All work happens on topic branches created from `master`
- The branch type **must** match the commit types used in that branch (a `fix/` branch should contain `fix:` commits)
- Use lowercase kebab-case for the description: `feature/wifi-qr-type` not `feature/WifiQrType`
- Keep descriptions short (2-4 words): `fix/clipboard-paste-error` not `fix/clipboard-paste-not-working-on-web-when-user-clicks-button`
- Delete branches after merging

### Branch Lifecycle

```
master ──┬──────────────────────────────────── master
         │                                      ▲
         └── feature/my-feature ── PR ── merge ─┘
```

1. Create branch from `master`: `git checkout -b feature/my-feature master`
2. Make commits (see below)
3. Push and open a pull request against `master`
4. Squash-merge or merge after review
5. Delete the branch

## Commit Messages (Conventional Commits)

Every commit **must** follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

| Type       | When to use                                             |
| ---------- | ------------------------------------------------------- |
| `feat`     | New feature or capability                               |
| `fix`      | Bug fix                                                 |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `docs`     | Documentation only                                      |
| `chore`    | Build process, CI, dependencies, config changes         |
| `test`     | Adding or correcting tests                              |
| `perf`     | Performance improvement                                 |
| `style`    | Formatting, semicolons, whitespace (no logic change)    |
| `ci`       | CI/CD configuration changes                             |
| `revert`   | Reverts a previous commit                               |

### Scopes

Scope is optional but encouraged. Use the area of the codebase affected:

| Scope     | Area                                                      |
| --------- | --------------------------------------------------------- |
| `mobile`  | React Native code (`src/`, `App.tsx`, `android/`, `ios/`) |
| `web`     | Next.js code (`web/src/`)                                 |
| `desktop` | Tauri shell (`web/src-tauri/`)                            |
| `shared`  | Shared logic (`shared/`)                                  |
| `ci`      | GitHub Actions workflows                                  |
| `deps`    | Dependency updates                                        |
| `release` | Release scripts and versioning                            |

### Examples

```
feat(shared): add vCard encoder for contact QR codes

fix(mobile): prevent crash when camera permission is denied on Android 14

refactor(web): extract color picker into standalone component

docs: add git workflow conventions

chore(deps): upgrade react-native to 0.85

test: add unit tests for WiFi encoder edge cases

ci: add macOS arm64 build to release workflow

perf(web): lazy-load QR decoder component

style(mobile): apply prettier formatting to screen components

feat(shared)!: change QrType union to include 'vcard'

BREAKING CHANGE: QrType now includes 'vcard', exhaustive switches need updating.
```

### Commit Message Rules

- Every commit **must** have a valid type prefix -- no freeform messages
- Use imperative mood: "add feature" not "added feature" or "adds feature"
- Do not capitalize the description: `feat: add export` not `feat: Add export`
- No period at the end of the description
- Keep the first line under 72 characters
- Use the body to explain **why**, not **what** (the diff shows the what)
- Mark breaking changes with `!` after the scope and/or a `BREAKING CHANGE:` footer
- A commit that does not conform to this format is **invalid** and must be rewritten

## Releases

Releases are triggered by pushing a version tag to `master`.

### Tagging

Always use **annotated tags** to preserve release metadata:

```bash
npm run version:sync           # Align version across package.json, web/package.json, tauri.conf.json
git add -A
git commit -m "chore(release): bump version to 1.4.0"
git tag -a v1.4.0 -m "Release v1.4.0"
git push origin master --tags
```

### What happens on tag push

The `release.yml` workflow (`.github/workflows/release.yml`) triggers on `v*` tags and:

1. Deploys the web app to Vercel
2. Builds Tauri desktop apps (Linux, Windows, macOS arm64, macOS x64)
3. Builds Android APK and AAB
4. Creates a GitHub Release with all artifacts and checksums

### Version format

Follow [SemVer](https://semver.org/): `MAJOR.MINOR.PATCH`

- **MAJOR**: breaking changes to shared types or public APIs
- **MINOR**: new features (new QR type, new export format, etc.)
- **PATCH**: bug fixes, performance improvements, documentation

## Quick Reference

```bash
# Start new work
git checkout master && git pull
git checkout -b feature/my-feature

# Commit
git add -A
git commit -m "feat(shared): add vCard encoder"

# Push and create PR
git push -u origin feature/my-feature
# Open PR against master

# Release
npm run version:sync
git add -A && git commit -m "chore(release): bump version to 1.4.0"
git tag -a v1.4.0 -m "Release v1.4.0"
git push origin master --tags
```
