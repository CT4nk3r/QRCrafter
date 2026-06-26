import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Colors, injectCSSVariables } from '../../../shared/theme';

export const metadata: Metadata = {
  title: 'QRCrafter - Generate QR Codes',
  description:
    'Generate QR codes for URLs, text, and WiFi networks. No ads, no trackers, no URL shorteners. Everything generated client-side on your device.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'QRCrafter',
  },
};

export const viewport: Viewport = {
  themeColor: Colors.light.primary,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <style dangerouslySetInnerHTML={{ __html: injectCSSVariables() }} />
        {children}
      </body>
    </html>
  );
}
