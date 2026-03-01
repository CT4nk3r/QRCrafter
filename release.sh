#!/bin/bash

set -e

# Get the latest git tag
VERSION=$(git describe --tags --abbrev=0)

if [ -z "$VERSION" ]; then
  echo "❌ No git tag found. Please create a tag first: git tag -a v1.0.0 -m 'Release v1.0.0'"
  exit 1
fi

echo "🚀 Building QRCrafter $VERSION release..."

# Run the release build
cd android
./gradlew bundleRelease assembleRelease
cd ..

# Create release folder
RELEASE_DIR="releases/$VERSION"
mkdir -p "$RELEASE_DIR"

# Rename and move files
APK_SRC="android/app/build/outputs/apk/release/app-release.apk"
AAB_SRC="android/app/build/outputs/bundle/release/app-release.aab"
APK_DEST="$RELEASE_DIR/QRCrafter-$VERSION-android.apk"
AAB_DEST="$RELEASE_DIR/QRCrafter-$VERSION-android.aab"

cp "$APK_SRC" "$APK_DEST"
cp "$AAB_SRC" "$AAB_DEST"

# Generate SHA256 hashes
echo "🔒 Generating SHA256 checksums..."
APK_HASH=$(sha256sum "$APK_DEST" | awk '{ print $1 }')
AAB_HASH=$(sha256sum "$AAB_DEST" | awk '{ print $1 }')

# Write checksums to file
cat > "$RELEASE_DIR/checksums.txt" <<EOF
QRCrafter $VERSION - SHA256 Checksums
======================================
QRCrafter-$VERSION-android.apk: $APK_HASH
QRCrafter-$VERSION-android.aab: $AAB_HASH
EOF

echo ""
echo "✅ Release $VERSION built successfully!"
echo ""
echo "📁 Output: $RELEASE_DIR/"
echo "   - QRCrafter-$VERSION-android.apk"
echo "   - QRCrafter-$VERSION-android.aab"
echo "   - checksums.txt"
echo ""
echo "🔒 SHA256 Checksums:"
echo "   APK: $APK_HASH"
echo "   AAB: $AAB_HASH"
