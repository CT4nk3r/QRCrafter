'use client';

import { useState, useMemo } from 'react';
import { QrTypeSelector } from '../components/QrTypeSelector';
import { QrInputForm } from '../components/QrInputForm';
import { ErrorCorrectionControl } from '../components/ErrorCorrectionControl';
import { QrDisplay } from '../components/QrDisplay';
import { QrDecoder } from '../components/QrDecoder';
import { QrType, ErrorCorrectionLevel, WifiConfig, EmailConfig, SmsConfig } from '../types/qr';
import { encodeWifi, encodeEmail, encodeSms, encodePhone } from '../utils/encoders';

type Mode = 'create' | 'decode';

export default function Home() {
  // Mode toggle
  const [mode, setMode] = useState<Mode>('create');
  
  // QR type
  const [qrType, setQrType] = useState<QrType>('url');

  // Simple value (for url, text, phone)
  const [simpleValue, setSimpleValue] = useState('');

  // WiFi config
  const [wifiConfig, setWifiConfig] = useState<WifiConfig>({
    ssid: '',
    password: '',
    encryption: 'WPA',
    hidden: false,
  });

  // Email config
  const [emailConfig, setEmailConfig] = useState<EmailConfig>({
    address: '',
    subject: '',
    body: '',
  });

  // SMS config
  const [smsConfig, setSmsConfig] = useState<SmsConfig>({
    phone: '',
    message: '',
  });

  // QR settings
  const [ecl, setEcl] = useState<ErrorCorrectionLevel>('M');

  // Compute final QR value
  const qrValue = useMemo(() => {
    switch (qrType) {
      case 'url':
      case 'text':
        return simpleValue;
      case 'phone':
        return simpleValue ? encodePhone(simpleValue) : '';
      case 'wifi':
        return wifiConfig.ssid ? encodeWifi(wifiConfig) : '';
      case 'email':
        return emailConfig.address ? encodeEmail(emailConfig) : '';
      case 'sms':
        return smsConfig.phone ? encodeSms(smsConfig) : '';
      default:
        return '';
    }
  }, [qrType, simpleValue, wifiConfig, emailConfig, smsConfig]);

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
    setEmailConfig({
      address: '',
      subject: '',
      body: '',
    });
    setSmsConfig({
      phone: '',
      message: '',
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
                Generate & Decode QR codes • No ads • No trackers • Privacy first
              </p>
            </div>
            {/* Mode Toggle */}
            <div className="flex gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setMode('create')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  mode === 'create'
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Create
              </button>
              <button
                onClick={() => setMode('decode')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  mode === 'decode'
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Decode
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {mode === 'create' ? (
          // Create Mode
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
                  emailConfig={emailConfig}
                  onEmailConfigChange={setEmailConfig}
                  smsConfig={smsConfig}
                  onSmsConfigChange={setSmsConfig}
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
        ) : (
          // Decode Mode
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column - Decoder */}
            <div>
              <QrDecoder onDecode={(data) => console.log('Decoded:', data)} />
            </div>

            {/* Right Column - Info */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  How to Decode QR Codes
                </h2>
                <div className="space-y-3 text-gray-700 dark:text-gray-300 text-sm">
                  <div className="flex gap-3">
                    <span className="text-2xl">📁</span>
                    <div>
                      <h3 className="font-semibold mb-1">Upload a File</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Click the file input to select an image containing a QR code from your device.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-2xl">📋</span>
                    <div>
                      <h3 className="font-semibold mb-1">Paste from Clipboard</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Copy an image to your clipboard, then click the Paste button to decode it.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-2xl">🔗</span>
                    <div>
                      <h3 className="font-semibold mb-1">Load from URL</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Enter the URL of an image and click Load to decode the QR code.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Card */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  🔒 Privacy First
                </h3>
                <p className="text-blue-800 dark:text-blue-200 text-sm">
                  All QR code decoding happens locally in your browser. Images are never uploaded to any server.
                  Your privacy is protected.
                </p>
              </div>
            </div>
          </div>
        )}
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
