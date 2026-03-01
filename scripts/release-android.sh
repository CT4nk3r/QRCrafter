#!/bin/bash

set -e

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
ROOT_DIR=$(cd "$SCRIPT_DIR/.." && pwd)

VERSION=$(git -C "$ROOT_DIR" describe --tags --abbrev=0)

if [ -z "$VERSION" ]; then
  echo "No git tag found. Please create a tag first: git tag -a v1.0.0 -m 'Release v1.0.0'"
  exit 1
fi

echo "Building Android release for $VERSION..."

RELEASE_DIR="$ROOT_DIR/releases/$VERSION"
mkdir -p "$RELEASE_DIR"

cd "$ROOT_DIR/android"
./gradlew bundleRelease assembleRelease
cd "$ROOT_DIR"

APK_SRC="$ROOT_DIR/android/app/build/outputs/apk/release/app-release.apk"
AAB_SRC="$ROOT_DIR/android/app/build/outputs/bundle/release/app-release.aab"
APK_DEST="$RELEASE_DIR/QRCrafter-$VERSION-android.apk"
AAB_DEST="$RELEASE_DIR/QRCrafter-$VERSION-android.aab"

ARTIFACTS=()

if [ -f "$APK_SRC" ]; then
  cp "$APK_SRC" "$APK_DEST"
  ARTIFACTS+=("$APK_DEST")
  echo "Added $(basename "$APK_DEST")"
else
  echo "Missing artifact: $APK_SRC"
fi

if [ -f "$AAB_SRC" ]; then
  cp "$AAB_SRC" "$AAB_DEST"
  ARTIFACTS+=("$AAB_DEST")
  echo "Added $(basename "$AAB_DEST")"
else
  echo "Missing artifact: $AAB_SRC"
fi

CHECKSUM_FILE="$RELEASE_DIR/checksums-android.txt"
{
  echo "QRCrafter $VERSION - Android SHA256 Checksums"
  echo "============================================="
  for artifact in "${ARTIFACTS[@]}"; do
    hash=$(sha256sum "$artifact" | awk '{ print $1 }')
    echo "$(basename "$artifact"): $hash"
  done
} > "$CHECKSUM_FILE"

echo "Release artifacts written to $RELEASE_DIR"
