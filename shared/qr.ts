export type QrType = 'url' | 'text' | 'wifi' | 'email' | 'phone' | 'sms';

export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export const ECL_OPTIONS: {
  value: ErrorCorrectionLevel;
  label: string;
  percentage: number;
}[] = [
  { value: 'L', label: '7%', percentage: 7 },
  { value: 'M', label: '15%', percentage: 15 },
  { value: 'Q', label: '25%', percentage: 25 },
  { value: 'H', label: '30%', percentage: 30 },
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

export function percentageToECL(percentage: number): ErrorCorrectionLevel {
  if (percentage <= 7) return 'L';
  if (percentage <= 15) return 'M';
  if (percentage <= 25) return 'Q';
  return 'H';
}

export function eclToPercentage(ecl: ErrorCorrectionLevel): number {
  const option = ECL_OPTIONS.find(opt => opt.value === ecl);
  return option?.percentage ?? 7;
}

export interface QrStyleConfig {
  fgColor: string;
  bgColor: string;
  size: number;
}

export const DEFAULT_QR_STYLE: QrStyleConfig = {
  fgColor: '#000000',
  bgColor: '#FFFFFF',
  size: 256,
};

export const PRESET_COLORS = [
  '#000000',
  '#FFFFFF',
  '#2563EB',
  '#DC2626',
  '#16A34A',
  '#9333EA',
  '#EA580C',
  '#0891B2',
  '#4F46E5',
  '#BE185D',
  '#854D0E',
  '#1E293B',
];
