'use client';

import { useRef } from 'react';
import QRCode from 'react-qr-code';
import { ErrorCorrectionLevel } from '../types/qr';
import { downloadQRCode } from '../utils/download';

interface Props {
  value: string;
  errorCorrectionLevel: ErrorCorrectionLevel;
  size?: number;
}

export function QrDisplay({ value, errorCorrectionLevel, size = 256 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    if (containerRef.current) {
      const svg = containerRef.current.querySelector('svg');
      if (svg) {
        downloadQRCode(svg, 'qrcode.png');
      }
    }
  };

  if (!value) {
    return (
      <div
        className="flex aspect-square w-full items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700"
        style={{ maxWidth: size }}
      >
        <p className="text-gray-400 dark:text-gray-600 text-center px-4">
          Enter content to generate QR code
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-4" style={{ maxWidth: size + 32 }}>
      <div ref={containerRef} className="w-full p-4 bg-white rounded-xl shadow-lg">
        <QRCode
          value={value}
          size={size}
          level={errorCorrectionLevel}
          style={{ width: '100%', height: 'auto' }}
        />
      </div>
      
      <button
        onClick={handleDownload}
        className="w-full sm:w-auto px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors shadow-md hover:shadow-lg"
      >
        📥 Download PNG
      </button>
    </div>
  );
}
