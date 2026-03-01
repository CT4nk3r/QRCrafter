'use client';

import { useMemo, useState } from 'react';
import { getCountries, getCountryCallingCode } from 'libphonenumber-js';
import type { CountryCode } from 'libphonenumber-js';
import countries from 'i18n-iso-countries';
import enCountries from 'i18n-iso-countries/langs/en.json';
import { QrType, WifiConfig, EmailConfig, SmsConfig, QR_TYPE_OPTIONS } from '../types/qr';

type CountryOption = {
  country: string;
  callingCode: string;
  name: string;
  label: string;
};

const countryToFlag = (country: string) => {
  const code = country.toUpperCase();
  if (code.length !== 2) {
    return '🏳️';
  }
  const base = 0x1f1e6;
  const first = code.charCodeAt(0) - 65 + base;
  const second = code.charCodeAt(1) - 65 + base;
  return String.fromCodePoint(first, second);
};

countries.registerLocale(enCountries);

const COUNTRY_OPTIONS: CountryOption[] = getCountries().map((country: CountryCode) => {
  const callingCode = `+${getCountryCallingCode(country)}`;
  const name = countries.getName(country, 'en') || country;
  return {
    country,
    callingCode,
    name,
    label: `${countryToFlag(country)} ${callingCode} ${country}`,
  };
});

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
  phoneCountry: string;
  onPhoneCountryChange: (value: string) => void;
  smsCountry: string;
  onSmsCountryChange: (value: string) => void;
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
  phoneCountry,
  onPhoneCountryChange,
  smsCountry,
  onSmsCountryChange,
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

  // Consistent container with minimum height to prevent jittering
  const containerClassName = 'space-y-4 min-h-[320px]';

  const sanitizePhone = (raw: string) => raw.replace(/\D/g, '');
  const [phoneQuery, setPhoneQuery] = useState('');
  const [smsQuery, setSmsQuery] = useState('');
  const [openDropdown, setOpenDropdown] = useState<'phone' | 'sms' | null>(null);

  const filterCountries = (query: string) => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return COUNTRY_OPTIONS;
    }
    return COUNTRY_OPTIONS.filter((option) => {
      return (
        option.country.toLowerCase().includes(normalized) ||
        option.callingCode.includes(normalized) ||
        option.name.toLowerCase().includes(normalized)
      );
    });
  };

  const filteredPhoneCountries = useMemo(
    () => filterCountries(phoneQuery),
    [phoneQuery]
  );
  const filteredSmsCountries = useMemo(
    () => filterCountries(smsQuery),
    [smsQuery]
  );

  const renderCountryDropdown = (
    id: 'phone' | 'sms',
    selected: string,
    onChange: (value: string) => void,
    query: string,
    onQueryChange: (value: string) => void,
    options: CountryOption[]
  ) => (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpenDropdown(openDropdown === id ? null : id)}
        className={`${inputClassName} w-[140px] flex items-center justify-between`}
        aria-haspopup="listbox"
        aria-expanded={openDropdown === id}
      >
        <span className="truncate">
          {COUNTRY_OPTIONS.find((opt) => opt.country === selected)?.label ?? selected}
        </span>
        <span aria-hidden className="ml-2">▾</span>
      </button>
      {openDropdown === id && (
        <div
          className="absolute z-20 mt-2 w-[260px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg"
          role="listbox"
        >
          <div className="p-2">
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && options.length > 0) {
                  e.preventDefault();
                  onChange(options[0].country);
                  setOpenDropdown(null);
                }
              }}
              placeholder="Search (e.g. Hungary or +36)"
              autoFocus
              className={`${inputClassName} w-full`}
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {options.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                No results
              </div>
            ) : (
              options.map((option, index) => (
                <button
                  key={option.country}
                  type="button"
                  onClick={() => {
                    onChange(option.country);
                    setOpenDropdown(null);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm ${
                    index === 0
                      ? 'bg-blue-100 dark:bg-blue-900/40 hover:bg-blue-200 dark:hover:bg-blue-900/60'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  role="option"
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );

  if (qrType === 'wifi') {
    return (
      <div className={containerClassName}>
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
      <div className={containerClassName}>
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
      <div className={containerClassName}>
        <div>
          <label htmlFor="sms-country" className={labelClassName}>
            Region
          </label>
          <div className="flex gap-3">
            {renderCountryDropdown(
              'sms',
              smsCountry,
              onSmsCountryChange,
              smsQuery,
              setSmsQuery,
              filteredSmsCountries
            )}
            <input
              id="sms-phone"
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              value={smsConfig.phone}
              onChange={(e) =>
                onSmsConfigChange({
                  ...smsConfig,
                  phone: sanitizePhone(e.target.value),
                })
              }
              placeholder="5551234567"
              className={inputClassName}
            />
          </div>
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

  if (qrType === 'phone') {
    return (
      <div className={containerClassName}>
        <div>
          <label htmlFor="phone-country" className={labelClassName}>
            Region
          </label>
          <div className="flex gap-3">
            {renderCountryDropdown(
              'phone',
              phoneCountry,
              onPhoneCountryChange,
              phoneQuery,
              setPhoneQuery,
              filteredPhoneCountries
            )}
            <input
              id="phone-number"
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              value={value}
              onChange={(e) => onValueChange(sanitizePhone(e.target.value))}
              placeholder="5551234567"
              className={inputClassName}
            />
          </div>
        </div>
      </div>
    );
  }

  // URL and text use simple input
  return (
    <div className={containerClassName}>
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
          type={qrType === 'url' ? 'url' : 'text'}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={placeholder}
          className={inputClassName}
        />
      )}
    </div>
  );
}
