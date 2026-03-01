'use client';

import { QrType, WifiConfig, EmailConfig, SmsConfig, QR_TYPE_OPTIONS } from '../types/qr';

interface Props {
  qrType: QrType;
  value: string;
  onValueChange: (value: string) => void;
  wifiConfig: WifiConfig;
  onWifiConfigChange: (config: WifiConfig) => void;
  emailConfig: EmailConfig;
  onEmailConfigChange: (config: EmailConfig) => void;
  smsConfig: SmsConfig;
  onSmsConfigChange: (config: SmsConfig) => void;
}

export function QrInputForm({
  qrType,
  value,
  onValueChange,
  wifiConfig,
  onWifiConfigChange,
  emailConfig,
  onEmailConfigChange,
  smsConfig,
  onSmsConfigChange,
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

  if (qrType === 'email') {
    return (
      <div className="space-y-4">
        <div>
          <label htmlFor="email-address" className={labelClassName}>
            Email Address
          </label>
          <input
            id="email-address"
            type="email"
            value={emailConfig.address}
            onChange={(e) =>
              onEmailConfigChange({ ...emailConfig, address: e.target.value })
            }
            placeholder="email@example.com"
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="email-subject" className={labelClassName}>
            Subject (optional)
          </label>
          <input
            id="email-subject"
            type="text"
            value={emailConfig.subject}
            onChange={(e) =>
              onEmailConfigChange({ ...emailConfig, subject: e.target.value })
            }
            placeholder="Hello!"
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="email-body" className={labelClassName}>
            Body (optional)
          </label>
          <textarea
            id="email-body"
            value={emailConfig.body}
            onChange={(e) =>
              onEmailConfigChange({ ...emailConfig, body: e.target.value })
            }
            placeholder="Your message..."
            rows={3}
            className={inputClassName}
          />
        </div>
      </div>
    );
  }

  if (qrType === 'sms') {
    return (
      <div className="space-y-4">
        <div>
          <label htmlFor="sms-phone" className={labelClassName}>
            Phone Number
          </label>
          <input
            id="sms-phone"
            type="tel"
            value={smsConfig.phone}
            onChange={(e) =>
              onSmsConfigChange({ ...smsConfig, phone: e.target.value })
            }
            placeholder="+1234567890"
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="sms-message" className={labelClassName}>
            Message (optional)
          </label>
          <textarea
            id="sms-message"
            value={smsConfig.message}
            onChange={(e) =>
              onSmsConfigChange({ ...smsConfig, message: e.target.value })
            }
            placeholder="Your message..."
            rows={3}
            className={inputClassName}
          />
        </div>
      </div>
    );
  }

  // URL, text, and phone use simple input
  return (
    <div>
      <label htmlFor="qr-input" className={labelClassName}>
        {qrType === 'url'
          ? 'Enter URL'
          : qrType === 'phone'
            ? 'Phone Number'
            : 'Enter Text'}
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
          type={qrType === 'phone' ? 'tel' : qrType === 'url' ? 'url' : 'text'}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={placeholder}
          className={inputClassName}
        />
      )}
    </div>
  );
}
