# QRCrafter

![QRCrafter Banner](assets/marketing/play_store_feature_graphic.png)

| ![QR Code Light](assets/images/qr_code_github_light.png) | ![QR Code Dark](assets/images/qr_code_github_dark.png) |
|---|---|
| Light Mode | Dark Mode |

**Free & Open Source QR Code Generator & Decoder** — no proxies, no tracking, no paywalls. Your data never leaves your device.

Available as:
- **React Native app** (Android/iOS)
- **Web app** (Next.js) in the `/web` directory

## Why?

Most QR code generators online:
- Create proxy URLs (like bit.ly) instead of direct QR codes
- Require payment for basic features
- Track your data

This app generates and decodes **real QR codes** locally on your device. What you type is exactly what gets encoded. Period.

## Features

### Create QR Codes
- **Multiple QR types**: URL, Plain Text, Wi-Fi, Email, Phone, SMS
- **Instant preview**: QR code updates in real-time as you type
- **Color customization**: Pick foreground & background colors
- **Adjustable size**: Slider to control QR code dimensions
- **Share & Save**: Export as PNG image

### Decode QR Codes
- **Upload from gallery**: Select QR code images from your device
- **Paste from clipboard**: Decode copied images, image URLs, or base64 image data
- **Load from URL**: Decode QR codes from any image URL
- **Copy decoded data**: One-tap copy to clipboard
- **Open URLs**: Direct link opening for decoded URLs

### General
- **Dark mode**: Automatic system theme support
- **100% offline**: All processing happens on-device
- **Privacy first**: No data ever leaves your device

## Getting Started

### Prerequisites

- Node.js >= 22.11.0
- React Native CLI
- Android Studio / Xcode

### Install

```bash
npm install
```

### Run

```bash
# Android
npm run android

# iOS
cd ios && pod install && cd ..
npm run ios

# Web (Next.js)
cd web
npm install
npm run dev
# Open http://localhost:3000
```

## Tech Stack

### React Native (Mobile)
- React Native 0.84
- TypeScript
- `react-native-qrcode-svg` — QR code rendering
- `react-native-svg` — SVG support
- `react-native-view-shot` — Screenshot capture
- `react-native-share` — Native share sheet
- `react-native-wifi-reborn` — Wi-Fi QR code support
- `@react-native-camera-roll/camera-roll` — Save to gallery
- `react-native-safe-area-context` — Safe area handling
- `@react-native-community/slider` — Size control
- `react-native-image-picker` — Image selection from gallery
- `@react-native-clipboard/clipboard` — Clipboard access
- `react-native-fs` — File system operations
- `rn-qr-generator` — Native QR decoding from image/base64

### Web (see `/web/README.md` for details)
- Next.js 14
- TypeScript
- Tailwind CSS
- `react-qr-code` — QR generation
- `jsqr` — QR decoding

## Project Structure

```
src/
├── components/
│   ├── QrTypeSelector.tsx    # QR type picker chips
│   ├── QrInputForm.tsx       # Dynamic input forms per type
│   └── QrCustomizer.tsx      # Color & size controls
├── screens/
│   ├── HomeScreen.tsx        # QR code creation screen
│   └── DecoderScreen.tsx     # QR code decoding screen
├── theme/
│   ├── colors.ts             # Color palette & presets
│   └── useAppTheme.ts        # Dark/light theme hook
├── types/
│   └── qr.ts                 # TypeScript types & constants
└── utils/
    └── encoders.ts           # QR data encoders (Wi-Fi, email, etc.)
```

## License

MIT — do whatever you want with it.
