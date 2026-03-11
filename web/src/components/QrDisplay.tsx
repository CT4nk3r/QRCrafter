'use client';

import { Component, ReactNode, useRef } from 'react';
import QRCode from 'react-qr-code';
import { ErrorCorrectionLevel } from '../types/qr';
import { downloadQRCode } from '../utils/download';

interface Props {
  value: string;
  errorCorrectionLevel: ErrorCorrectionLevel;
  size?: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  size: number;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class QrErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (prevProps.children !== this.props.children && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20 border-2 border-dashed border-red-300 dark:border-red-700 p-4"
          style={{ width: this.props.size, height: this.props.size }}
        >
          <p className="text-red-600 dark:text-red-400 text-center text-sm px-2">
            ⚠️ Content is too long to encode as a QR code. Please shorten the text and try again.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
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
        className="flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700"
        style={{ width: size, height: size }}
      >
        <p className="text-gray-400 dark:text-gray-600 text-center px-4">
          Enter content to generate QR code
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <QrErrorBoundary size={size}>
        <div ref={containerRef} className="p-4 bg-white rounded-xl shadow-lg">
          <QRCode
            value={value}
            size={size}
            level={errorCorrectionLevel}
          />
        </div>
      </QrErrorBoundary>

      <button
        onClick={handleDownload}
        className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors shadow-md hover:shadow-lg"
      >
        📥 Download PNG
      </button>
    </div>
  );
}
