export const Colors = {
  light: {
    background: '#F8F9FA',
    surface: '#FFFFFF',
    surfaceVariant: '#F0F0F0',
    primary: '#2563EB',
    primaryLight: '#DBEAFE',
    text: '#1A1A2E',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    error: '#EF4444',
    success: '#22C55E',
  },
  dark: {
    background: '#0F172A',
    surface: '#1E293B',
    surfaceVariant: '#334155',
    primary: '#3B82F6',
    primaryLight: '#1E3A5F',
    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    border: '#334155',
    error: '#F87171',
    success: '#4ADE80',
  },
} as const;

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceVariant: string;
  primary: string;
  primaryLight: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
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
