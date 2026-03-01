# QRCrafter Web

A privacy-first QR code generator and decoder built with Next.js and TypeScript. Generate and decode QR codes for URLs, text, and WiFi networks — all processed locally in your browser.

## Features

### Create QR Codes
- 🔗 **URL QR Codes** - Generate QR codes for web links
- 📝 **Text QR Codes** - Encode any plain text
- 📶 **WiFi QR Codes** - Share WiFi credentials easily
- 🎚️ **Error Correction** - Adjustable error correction level (7%, 15%, 25%, 30%)
- 📥 **Download as PNG** - Export high-resolution QR codes

### Decode QR Codes
- 📁 **Upload Images** - Select QR code images from your device
- 📋 **Paste from Clipboard** - Decode images copied to clipboard
- 🔗 **Load from URL** - Decode QR codes from any image URL
- 📋 **Copy Results** - One-click copy of decoded text

### General
- 🔒 **Privacy First** - Everything generated client-side, no data sent to servers
- 🎨 **Modern UI** - Clean, responsive design with dark mode support

## Philosophy

- **No ads** - Clean, distraction-free experience
- **No trackers** - Your data stays on your device
- **No URL shorteners** - Generate direct QR codes
- **Client-side only** - All processing happens in your browser

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **react-qr-code** - QR code generation library
- **jsqr** - QR code decoding library

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/              # Next.js App Router
│   ├── layout.tsx    # Root layout
│   ├── page.tsx      # Home page
│   └── globals.css   # Global styles
├── components/       # React components
│   ├── QrTypeSelector.tsx
│   ├── QrInputForm.tsx
│   ├── ErrorCorrectionControl.tsx
│   └── QrDisplay.tsx
├── types/           # TypeScript types
│   └── qr.ts
└── utils/           # Utility functions
    ├── encoders.ts  # WiFi encoding
    └── download.ts  # QR download logic
```

## Error Correction Levels

QRCrafter uses industry-standard error correction levels:

- **7% (L)** - Low - Recovers ~7% of data
- **15% (M)** - Medium - Recovers ~15% of data
- **25% (Q)** - Quartile - Recovers ~25% of data
- **30% (H)** - High - Recovers ~30% of data

Higher levels create denser QR codes but allow for more damage recovery.

## WiFi QR Code Format

WiFi QR codes use the standard format:
```
WIFI:T:<encryption>;S:<ssid>;P:<password>;H:<hidden>;;
```

Supported encryption types:
- WPA/WPA2/WPA3
- WEP
- No password

## License

Open source - use freely

## Related

This is the web companion to the QRCrafter mobile app built with React Native.
