'use client';

import { useState, useRef, useCallback } from 'react';
import jsQR from 'jsqr';

interface QrDecoderProps {
  onDecode: (data: string) => void;
}

export function QrDecoder({ onDecode }: QrDecoderProps) {
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [decodedData, setDecodedData] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const decodeImage = useCallback((imageElement: HTMLImageElement) => {
    setLoading(true);
    setError('');
    setDecodedData(null);

    const canvas = canvasRef.current;
    if (!canvas) {
      setError('Canvas not available');
      setLoading(false);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setError('Could not get canvas context');
      setLoading(false);
      return;
    }

    // Set canvas size to match image
    canvas.width = imageElement.width;
    canvas.height = imageElement.height;

    // Draw image on canvas
    ctx.drawImage(imageElement, 0, 0);

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Decode QR code
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      setDecodedData(code.data);
      onDecode(code.data);
    } else {
      setError('No QR code found in the image');
    }

    setLoading(false);
  }, [onDecode]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => decodeImage(img);
      img.onerror = () => setError('Failed to load image');
      img.src = e.target?.result as string;
    };
    reader.onerror = () => setError('Failed to read file');
    reader.readAsDataURL(file);
  };

  const handlePaste = async () => {
    try {
      setError('');
      const clipboardItems = await navigator.clipboard.read();
      
      for (const item of clipboardItems) {
        if (item.types.includes('image/png') || item.types.includes('image/jpeg')) {
          const blob = await item.getType(item.types.find(type => type.startsWith('image/'))!);
          const img = new Image();
          img.onload = () => decodeImage(img);
          img.onerror = () => setError('Failed to load image from clipboard');
          img.src = URL.createObjectURL(blob);
          return;
        }
      }
      
      setError('No image found in clipboard');
    } catch (err) {
      setError('Failed to access clipboard. Please make sure you have granted permission.');
      console.error('Clipboard error:', err);
    }
  };

  const handleUrlLoad = () => {
    if (!imageUrl.trim()) {
      setError('Please enter an image URL');
      return;
    }

    setError('');
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Try to load cross-origin images
    img.onload = () => decodeImage(img);
    img.onerror = () => setError('Failed to load image from URL. Make sure the URL is correct and CORS is enabled.');
    img.src = imageUrl;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Decode QR Code
        </h2>

        {/* File Upload */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Upload Image File
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 dark:text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                dark:file:bg-blue-900/20 dark:file:text-blue-400
                dark:hover:file:bg-blue-900/30
                cursor-pointer"
            />
          </div>

          {/* Paste from Clipboard */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Paste from Clipboard
            </label>
            <button
              onClick={handlePaste}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg
                transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                dark:focus:ring-offset-gray-800"
            >
              📋 Paste Image
            </button>
          </div>

          {/* URL Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Load from URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/qrcode.png"
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
              <button
                onClick={handleUrlLoad}
                className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg
                  transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  dark:focus:ring-offset-gray-800 whitespace-nowrap"
              >
                Load
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              🔍 Decoding QR code...
            </p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-red-800 dark:text-red-200 text-sm">
              ❌ {error}
            </p>
          </div>
        )}

        {/* Decoded Data Display */}
        {decodedData && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <h3 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">
              ✅ QR Code Decoded Successfully!
            </h3>
            <div className="bg-white dark:bg-gray-800 p-3 rounded border border-green-200 dark:border-green-800">
              <p className="text-gray-900 dark:text-white break-all font-mono text-sm">
                {decodedData}
              </p>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(decodedData)}
              className="mt-3 py-1.5 px-3 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded
                transition-colors duration-200"
            >
              📋 Copy to Clipboard
            </button>
          </div>
        )}
      </div>

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
