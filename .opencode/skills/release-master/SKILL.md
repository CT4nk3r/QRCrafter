---
name: release-master
description: Step-by-step release workflow for QRCrafter — commit analysis, semver determination, version sync, tagging, and push.
---

# Release Master Workflow

Follow these steps **in exact order**. Do not skip steps. Present results to the user at each checkpoint.

---

## Step 1: Identify the Last Release

Find the latest version tag:

```bash
git tag -l "v*" --sort=-v:refname | head -n 1
```

Store this as `LAST_TAG`. If no tags exist, use the initial commit as the base.

---

## Step 2: Gather Commits Since Last Release

Get all commits between the last tag and HEAD:

```bash
git log <LAST_TAG>..HEAD --oneline --no-merges
```

If there are **zero commits**, stop and inform the user there is nothing to release.

---

## Step 3: Classify Commits and Build Changelog

Parse each commit message according to Conventional Commits. Categorize them:

| Category         | Commit types                                               | SemVer impact                                                           |
| ---------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------- |
| Breaking changes | Any commit with `!` or `BREAKING CHANGE:` footer           | MAJOR                                                                   |
| Features         | `feat`                                                     | MINOR                                                                   |
| Fixes            | `fix`                                                      | PATCH                                                                   |
| Other            | `refactor`, `perf`, `docs`, `style`, `test`, `chore`, `ci` | PATCH (if fixes/features are absent, these alone still warrant a PATCH) |

Build a human-readable changelog grouped by category. Include the short hash and description for each commit.

### Example output format

```
## Changelog since v1.5.0

### Features
- abc1234 feat(shared): add vCard encoder for contact QR codes
- def5678 feat(web): add batch export functionality

### Fixes
- 789abcd fix(mobile): prevent crash on Android 14 camera permission

### Other
- 012efgh refactor(web): extract color picker component
- 345ijkl docs: update README installation steps
```

---

## Step 4: Determine the Version Bump

Apply SemVer rules based on the classified commits:

1. If ANY commit is a breaking change → **MAJOR** bump
2. Else if ANY commit is a `feat` → **MINOR** bump
3. Else → **PATCH** bump

Calculate the new version from `LAST_TAG`:

- `v1.5.0` + MAJOR → `v2.0.0`
- `v1.5.0` + MINOR → `v1.6.0`
- `v1.5.0` + PATCH → `v1.5.1`

---

## Step 5: Present to User for Confirmation

Show the user:

1. The changelog (from Step 3)
2. The bump type (MAJOR / MINOR / PATCH) and why
3. The current version and proposed new version
4. That pushing the tag will trigger the CI release pipeline

**Ask for explicit confirmation before proceeding.** The user may:

- Approve as-is
- Override the version number
- Abort the release

Do NOT proceed without a clear "yes" or approval from the user.

---

## Step 6: Update Version

Once confirmed, update the root package.json version:

```bash
npm version <NEW_VERSION> --no-git-tag-version
```

Then sync across all manifests:

```bash
npm run version:sync
```

This updates:

- `package.json` (root)
- `package-lock.json` (root)
- `web/package.json`
- `web/package-lock.json`
- `web/src-tauri/tauri.conf.json`

---

## Step 7: Commit the Version Bump

Stage and commit all changed manifests:

```bash
git add package.json package-lock.json web/package.json web/package-lock.json web/src-tauri/tauri.conf.json
git commit -m "chore(release): bump version to <NEW_VERSION>"
```

Do NOT use `git add -A`. Only stage the 5 manifest files listed above.

---

## Step 8: Create the Tag

```bash
git tag v<NEW_VERSION>
```

Tag format is always `v` prefix + full semver: `v1.6.0`, `v2.0.0`, etc.

---

## Step 9: Push

Push the commit and tag together. Use explicit ref to avoid ambiguity with the legacy `master` tag:

```bash
git push origin refs/heads/master --tags
```

---

## Step 10: Confirm Success

After pushing, inform the user:

1. The version bump commit hash
2. The tag that was pushed (`v<NEW_VERSION>`)
3. That the CI release pipeline has been triggered
4. Link to the GitHub Actions run: `https://github.com/CT4nk3r/QRCrafter/actions`

---

## Error Handling

- **Dirty working tree**: If `git status` shows uncommitted changes before starting, STOP and warn the user. Do not proceed with a dirty working tree.
- **Not on master**: If the current branch is not `master`, STOP and warn the user. Releases must be tagged on `master`.
- **Push fails**: Report the error. Do NOT retry with `--force`.
- **Version sync fails**: Report the error. The user must fix the manifest structure manually.

---

## Important Notes

- The CI pipeline (`.github/workflows/release.yml`) triggers on `v*` tags and handles: Vercel deployment, Tauri desktop builds, Android builds, GitHub Release creation with artifacts and checksums.
- You do NOT build, deploy, or create GitHub Releases. The pipeline does all of that.
- Commits that don't follow Conventional Commits format should be listed under "Other" with a note that they could not be classified.
- If the user provides a specific version number, use it even if it doesn't match the semver analysis. They may have reasons.
