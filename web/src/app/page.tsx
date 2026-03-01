'use client';

import { useState, useMemo } from 'react';
import { QrTypeSelector } from '../components/QrTypeSelector';
import { QrInputForm } from '../components/QrInputForm';
import { ErrorCorrectionControl } from '../components/ErrorCorrectionControl';
import { QrDisplay } from '../components/QrDisplay';
import { QrType, ErrorCorrectionLevel, WifiConfig } from '../types/qr';
import { encodeWifi } from '../utils/encoders';

export default function Home() {
  // QR type
  const [qrType, setQrType] = useState<QrType>('url');

  // Simple value (for url, text)
  const [simpleValue, setSimpleValue] = useState('');

  // WiFi config
  const [wifiConfig, setWifiConfig] = useState<WifiConfig>({
    ssid: '',
    password: '',
    encryption: 'WPA',
    hidden: false,
  });

  // QR settings
  const [ecl, setEcl] = useState<ErrorCorrectionLevel>('M');

  // Compute final QR value
  const qrValue = useMemo(() => {
    switch (qrType) {
      case 'url':
      case 'text':
        return simpleValue;
      case 'wifi':
        return wifiConfig.ssid ? encodeWifi(wifiConfig) : '';
      default:
        return '';
    }
  }, [qrType, simpleValue, wifiConfig]);

  // Handle type change — clear inputs
  const handleTypeChange = (type: QrType) => {
    setQrType(type);
    setSimpleValue('');
    setWifiConfig({
      ssid: '',
      password: '',
      encryption: 'WPA',
      hidden: false,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                QRCrafter
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Generate QR codes • No ads • No trackers • Privacy first
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Controls */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-6">
              <QrTypeSelector selected={qrType} onSelect={handleTypeChange} />

              <QrInputForm
                qrType={qrType}
                value={simpleValue}
                onValueChange={setSimpleValue}
                wifiConfig={wifiConfig}
                onWifiConfigChange={setWifiConfig}
              />

              <ErrorCorrectionControl value={ecl} onChange={setEcl} />
            </div>

            {/* Info Card */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                🔒 Privacy First
              </h3>
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                All QR codes are generated locally in your browser. No data is sent to any server.
                No ads, no trackers, no URL shorteners.
              </p>
            </div>
          </div>

          {/* Right Column - QR Display */}
          <div className="flex items-start justify-center lg:pt-6">
            <QrDisplay value={qrValue} errorCorrectionLevel={ecl} size={256} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-600 dark:text-gray-400 text-sm">
            QRCrafter • Open source • Built with Next.js
          </p>
        </div>
      </footer>
    </div>
  );
}
