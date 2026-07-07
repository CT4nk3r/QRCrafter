export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceVariant: string;
  card: string;
  primary: string;
  primaryLight: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
}

export interface QrStyleConfig {
  fgColor: string;
  bgColor: string;
  size: number;
}

export const Colors: Record<ThemeMode, ThemeColors> = {
  light: {
    background: '#F8F9FA',
    surface: '#FFFFFF',
    surfaceVariant: '#F0F0F0',
    card: '#FFFFFF',
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
    card: '#1E293B',
    primary: '#3B82F6',
    primaryLight: '#1E3A5F',
    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    border: '#334155',
    error: '#F87171',
    success: '#4ADE80',
  },
};

export const WEB_THEME_COLORS = {
  primary: {
    DEFAULT: Colors.light.primary,
    light: Colors.light.primaryLight,
    dark: '#1E40AF',
  },
} as const;

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

function cssVariableName(token: keyof ThemeColors): string {
  return `--color-${token.replace(
    /[A-Z]/g,
    letter => `-${letter.toLowerCase()}`,
  )}`;
}

function cssVariablesForTheme(theme: ThemeColors): string {
  return Object.entries(theme)
    .map(
      ([token, value]) =>
        `  ${cssVariableName(token as keyof ThemeColors)}: ${value};`,
    )
    .join('\n');
}

export function injectCSSVariables(): string {
  return `:root {
${cssVariablesForTheme(Colors.light)}
  --color-primary-dark: ${WEB_THEME_COLORS.primary.dark};
}

@media (prefers-color-scheme: dark) {
  :root {
${cssVariablesForTheme(Colors.dark)}
    --color-primary-dark: ${Colors.dark.primary};
  }
}`;
}
