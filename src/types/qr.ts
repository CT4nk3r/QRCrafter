export type QrType = 'url' | 'text' | 'wifi' | 'email' | 'phone' | 'sms';

export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export const ECL_OPTIONS: {value: ErrorCorrectionLevel; label: string}[] = [
  {value: 'L', label: '7%'},
  {value: 'M', label: '15%'},
  {value: 'Q', label: '25%'},
  {value: 'H', label: '30%'},
];

export interface QrTypeOption {
  type: QrType;
  label: string;
  icon: string;
  placeholder: string;
}

export interface WifiConfig {
  ssid: string;
  password: string;
  encryption: 'WPA' | 'WEP' | 'nopass';
  hidden: boolean;
}

export interface EmailConfig {
  address: string;
  subject: string;
  body: string;
}

export interface SmsConfig {
  phone: string;
  message: string;
}

export const QR_TYPE_OPTIONS: QrTypeOption[] = [
  {
    type: 'url',
    label: 'URL',
    icon: '🔗',
    placeholder: 'https://example.com',
  },
  {
    type: 'text',
    label: 'Text',
    icon: '📝',
    placeholder: 'Enter any text...',
  },
  {
    type: 'wifi',
    label: 'Wi-Fi',
    icon: '📶',
    placeholder: 'Network name',
  },
  {
    type: 'email',
    label: 'Email',
    icon: '📧',
    placeholder: 'email@example.com',
  },
  {
    type: 'phone',
    label: 'Phone',
    icon: '📞',
    placeholder: '+1234567890',
  },
  {
    type: 'sms',
    label: 'SMS',
    icon: '💬',
    placeholder: '+1234567890',
  },
];
