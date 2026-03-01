import {useColorScheme} from 'react-native';
import {Colors, ThemeColors} from './colors';

export function useAppTheme(): {colors: ThemeColors; isDark: boolean} {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return {
    colors: isDark ? Colors.dark : Colors.light,
    isDark,
  };
}
