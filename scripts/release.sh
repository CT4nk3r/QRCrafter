#!/bin/bash

set -e

usage() {
  echo "Usage: ./scripts/release.sh [android|linux|all]"
  echo "  android: build Android APK/AAB"
  echo "  linux:   build Linux desktop bundles"
  echo "  all:     build Android and Linux (default)"
  echo ""
  echo "Windows builds must be run on Windows:"
  echo "  powershell -ExecutionPolicy Bypass -File scripts/release-windows.ps1"
}

TARGET=${1:-all}

case "$TARGET" in
  android)
    ./scripts/release-android.sh
    ;;
  linux)
    ./scripts/release-linux.sh
    ;;
  all)
    ./scripts/release-android.sh
    ./scripts/release-linux.sh
    ;;
  -h|--help)
    usage
    ;;
  *)
    echo "Unknown target: $TARGET"
    usage
    exit 1
    ;;
esac
