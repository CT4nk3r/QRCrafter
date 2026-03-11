#!/bin/bash

set -e

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
ROOT_DIR=$(cd "$SCRIPT_DIR/.." && pwd)

VERSION=$(git -C "$ROOT_DIR" describe --tags --abbrev=0)

if [ -z "$VERSION" ]; then
  echo "No git tag found. Please create a tag first: git tag -a v1.0.0 -m 'Release v1.0.0'"
  exit 1
fi

echo "Building iOS release for $VERSION..."

RELEASE_DIR="$ROOT_DIR/releases/$VERSION"
mkdir -p "$RELEASE_DIR"

IOS_DIR="$ROOT_DIR/ios"
IOS_BUILD_DIR="$IOS_DIR/build"
ARCHIVE_PATH="$IOS_BUILD_DIR/QRCrafter.xcarchive"
EXPORT_OPTIONS="$IOS_DIR/ExportOptions.plist"

if [ -d "$IOS_DIR" ]; then
  cd "$IOS_DIR"
  if command -v pod >/dev/null 2>&1; then
    pod install
  else
    echo "CocoaPods not found. Install with: sudo gem install cocoapods"
  fi
  cd "$ROOT_DIR"
else
  echo "Missing iOS directory: $IOS_DIR"
  exit 1
fi

rm -rf "$IOS_BUILD_DIR"
mkdir -p "$IOS_BUILD_DIR"

IOS_WORKSPACE="$IOS_DIR/QRCrafter.xcworkspace"
IOS_PROJECT="$IOS_DIR/QRCrafter.xcodeproj"
IOS_SCHEME="QRCrafter"

if [ -d "$IOS_WORKSPACE" ]; then
  xcodebuild -workspace "$IOS_WORKSPACE" -scheme "$IOS_SCHEME" -configuration Release -archivePath "$ARCHIVE_PATH" clean archive
elif [ -d "$IOS_PROJECT" ]; then
  xcodebuild -project "$IOS_PROJECT" -scheme "$IOS_SCHEME" -configuration Release -archivePath "$ARCHIVE_PATH" clean archive
else
  echo "Missing Xcode workspace or project in $IOS_DIR"
  exit 1
fi

ARTIFACTS=()

if [ -d "$ARCHIVE_PATH" ]; then
  ARCHIVE_ZIP="$RELEASE_DIR/QRCrafter-$VERSION-ios.xcarchive.zip"
  ditto -c -k --sequesterRsrc --keepParent "$ARCHIVE_PATH" "$ARCHIVE_ZIP"
  ARTIFACTS+=("$ARCHIVE_ZIP")
  echo "Added $(basename "$ARCHIVE_ZIP")"
else
  echo "Missing archive: $ARCHIVE_PATH"
fi

if [ -f "$EXPORT_OPTIONS" ]; then
  EXPORT_DIR="$IOS_BUILD_DIR/ipa"
  xcodebuild -exportArchive -archivePath "$ARCHIVE_PATH" -exportOptionsPlist "$EXPORT_OPTIONS" -exportPath "$EXPORT_DIR"
  IPA_SRC=$(ls "$EXPORT_DIR"/*.ipa 2>/dev/null | head -n 1 || true)

  if [ -n "$IPA_SRC" ]; then
    IPA_DEST="$RELEASE_DIR/QRCrafter-$VERSION-ios.ipa"
    cp "$IPA_SRC" "$IPA_DEST"
    ARTIFACTS+=("$IPA_DEST")
    echo "Added $(basename "$IPA_DEST")"
  else
    echo "Missing artifact: $EXPORT_DIR/*.ipa"
  fi
else
  echo "Missing ExportOptions.plist; skipping IPA export."
fi

CHECKSUM_FILE="$RELEASE_DIR/checksums-ios.txt"
{
  echo "QRCrafter $VERSION - iOS SHA256 Checksums"
  echo "========================================="
  for artifact in "${ARTIFACTS[@]}"; do
    hash=$(shasum -a 256 "$artifact" | awk '{ print $1 }')
    echo "$(basename "$artifact"): $hash"
  done
} > "$CHECKSUM_FILE"

echo "Release artifacts written to $RELEASE_DIR"
