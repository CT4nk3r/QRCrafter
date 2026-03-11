#!/bin/bash

set -e

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
ROOT_DIR=$(cd "$SCRIPT_DIR/.." && pwd)

VERSION=$(git -C "$ROOT_DIR" describe --tags --abbrev=0)

if [ -z "$VERSION" ]; then
  echo "No git tag found. Please create a tag first: git tag -a v1.0.0 -m 'Release v1.0.0'"
  exit 1
fi

echo "Building macOS desktop release for $VERSION..."

RELEASE_DIR="$ROOT_DIR/releases/$VERSION"
mkdir -p "$RELEASE_DIR"

cd "$ROOT_DIR/web"
npm run tauri:build
cd "$ROOT_DIR"

TAURI_BUNDLE_DIR="$ROOT_DIR/web/src-tauri/target/release/bundle"
DMG_SRC=$(ls "$TAURI_BUNDLE_DIR"/dmg/*.dmg 2>/dev/null | head -n 1 || true)

ARTIFACTS=()

if [ -n "$DMG_SRC" ]; then
  DMG_DEST="$RELEASE_DIR/QRCrafter-$VERSION-macos.dmg"
  cp "$DMG_SRC" "$DMG_DEST"
  ARTIFACTS+=("$DMG_DEST")
  echo "Added $(basename "$DMG_DEST")"
else
  echo "Missing artifact: $TAURI_BUNDLE_DIR/dmg/*.dmg"
fi

CHECKSUM_FILE="$RELEASE_DIR/checksums-macos.txt"
{
  echo "QRCrafter $VERSION - macOS SHA256 Checksums"
  echo "============================================"
  for artifact in "${ARTIFACTS[@]}"; do
    hash=$(shasum -a 256 "$artifact" | awk '{ print $1 }')
    echo "$(basename "$artifact"): $hash"
  done
} > "$CHECKSUM_FILE"

echo "Release artifacts written to $RELEASE_DIR"
