'use client';

import { QrType, WifiConfig, QR_TYPE_OPTIONS } from '../types/qr';

interface Props {
  qrType: QrType;
  value: string;
  onValueChange: (value: string) => void;
  wifiConfig: WifiConfig;
  onWifiConfigChange: (config: WifiConfig) => void;
}

export function QrInputForm({
  qrType,
  value,
  onValueChange,
  wifiConfig,
  onWifiConfigChange,
}: Props) {
  const placeholder =
    QR_TYPE_OPTIONS.find((o) => o.type === qrType)?.placeholder ?? '';

  const inputClassName = `
    w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700
    bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
    focus:ring-2 focus:ring-primary focus:border-transparent
    transition-all
  `;

  const labelClassName = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2';

  if (qrType === 'wifi') {
    return (
      <div className="space-y-4">
        <div>
          <label htmlFor="ssid" className={labelClassName}>
            Network Name (SSID)
          </label>
          <input
            id="ssid"
            type="text"
            value={wifiConfig.ssid}
            onChange={(e) =>
              onWifiConfigChange({ ...wifiConfig, ssid: e.target.value })
            }
            placeholder="My Network"
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="password" className={labelClassName}>
            Password
          </label>
          <input
            id="password"
            type="password"
            value={wifiConfig.password}
            onChange={(e) =>
              onWifiConfigChange({ ...wifiConfig, password: e.target.value })
            }
            placeholder="Password"
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="encryption" className={labelClassName}>
            Security Type
          </label>
          <select
            id="encryption"
            value={wifiConfig.encryption}
            onChange={(e) =>
              onWifiConfigChange({
                ...wifiConfig,
                encryption: e.target.value as 'WPA' | 'WEP' | 'nopass',
              })
            }
            className={inputClassName}
          >
            <option value="WPA">WPA/WPA2/WPA3</option>
            <option value="WEP">WEP</option>
            <option value="nopass">No Password</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <input
            id="hidden"
            type="checkbox"
            checked={wifiConfig.hidden}
            onChange={(e) =>
              onWifiConfigChange({ ...wifiConfig, hidden: e.target.checked })
            }
            className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
          />
          <label htmlFor="hidden" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Hidden Network
          </label>
        </div>
      </div>
    );
  }

  // URL and Text use simple input
  return (
    <div>
      <label htmlFor="qr-input" className={labelClassName}>
        {qrType === 'url' ? 'Enter URL' : 'Enter Text'}
      </label>
      {qrType === 'text' ? (
        <textarea
          id="qr-input"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className={inputClassName}
        />
      ) : (
        <input
          id="qr-input"
          type="text"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={placeholder}
          className={inputClassName}
        />
      )}
    </div>
  );
}
