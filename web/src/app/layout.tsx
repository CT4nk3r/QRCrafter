import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'QRCrafter - Generate QR Codes',
  description: 'Generate QR codes for URLs, text, and WiFi networks. No ads, no trackers, no URL shorteners. Everything generated client-side on your device.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
