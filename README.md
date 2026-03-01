# QRCrafter

**Free & Open Source QR Code Generator** — no proxies, no tracking, no paywalls. Your data never leaves your device.

## Why?

Most QR code generators online:
- Create proxy URLs (like bit.ly) instead of direct QR codes
- Require payment for basic features
- Track your data

This app generates **real QR codes** locally on your device. What you type is exactly what gets encoded. Period.

## Features

- **Multiple QR types**: URL, Plain Text, Wi-Fi, Email, Phone, SMS
- **Instant preview**: QR code updates in real-time as you type
- **Color customization**: Pick foreground & background colors
- **Adjustable size**: Slider to control QR code dimensions
- **Share & Save**: Export as PNG image
- **Dark mode**: Automatic system theme support
- **100% offline**: All processing happens on-device

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
```

## Tech Stack

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

## Project Structure

```
src/
├── components/
│   ├── QrTypeSelector.tsx    # QR type picker chips
│   ├── QrInputForm.tsx       # Dynamic input forms per type
│   └── QrCustomizer.tsx      # Color & size controls
├── screens/
│   └── HomeScreen.tsx        # Main app screen
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
