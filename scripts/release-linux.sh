#!/bin/bash

set -e

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
ROOT_DIR=$(cd "$SCRIPT_DIR/.." && pwd)

VERSION=$(git -C "$ROOT_DIR" describe --tags --abbrev=0)

if [ -z "$VERSION" ]; then
  echo "No git tag found. Please create a tag first: git tag -a v1.0.0 -m 'Release v1.0.0'"
  exit 1
fi

echo "Building Linux desktop release for $VERSION..."

RELEASE_DIR="$ROOT_DIR/releases/$VERSION"
mkdir -p "$RELEASE_DIR"

cd "$ROOT_DIR/web"
npm run tauri:build
cd "$ROOT_DIR"

TAURI_BUNDLE_DIR="$ROOT_DIR/web/src-tauri/target/release/bundle"
APPIMAGE_SRC=$(ls "$TAURI_BUNDLE_DIR"/appimage/*.AppImage 2>/dev/null | head -n 1 || true)
DEB_SRC=$(ls "$TAURI_BUNDLE_DIR"/deb/*.deb 2>/dev/null | head -n 1 || true)
RPM_SRC=$(ls "$TAURI_BUNDLE_DIR"/rpm/*.rpm 2>/dev/null | head -n 1 || true)

ARTIFACTS=()

if [ -n "$APPIMAGE_SRC" ]; then
  APPIMAGE_DEST="$RELEASE_DIR/QRCrafter-$VERSION-linux.AppImage"
  cp "$APPIMAGE_SRC" "$APPIMAGE_DEST"
  ARTIFACTS+=("$APPIMAGE_DEST")
  echo "Added $(basename "$APPIMAGE_DEST")"
else
  echo "Missing artifact: $TAURI_BUNDLE_DIR/appimage/*.AppImage"
fi

if [ -n "$DEB_SRC" ]; then
  DEB_DEST="$RELEASE_DIR/QRCrafter-$VERSION-linux.deb"
  cp "$DEB_SRC" "$DEB_DEST"
  ARTIFACTS+=("$DEB_DEST")
  echo "Added $(basename "$DEB_DEST")"
else
  echo "Missing artifact: $TAURI_BUNDLE_DIR/deb/*.deb"
fi

if [ -n "$RPM_SRC" ]; then
  RPM_DEST="$RELEASE_DIR/QRCrafter-$VERSION-linux.rpm"
  cp "$RPM_SRC" "$RPM_DEST"
  ARTIFACTS+=("$RPM_DEST")
  echo "Added $(basename "$RPM_DEST")"
else
  echo "Missing artifact: $TAURI_BUNDLE_DIR/rpm/*.rpm"
fi

CHECKSUM_FILE="$RELEASE_DIR/checksums-linux.txt"
{
  echo "QRCrafter $VERSION - Linux SHA256 Checksums"
  echo "==========================================="
  for artifact in "${ARTIFACTS[@]}"; do
    hash=$(sha256sum "$artifact" | awk '{ print $1 }')
    echo "$(basename "$artifact"): $hash"
  done
} > "$CHECKSUM_FILE"

echo "Release artifacts written to $RELEASE_DIR"
