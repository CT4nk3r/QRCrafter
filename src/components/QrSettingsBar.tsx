import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {
  ErrorCorrectionLevel,
  ECL_OPTIONS,
} from '../types/qr';
import {useAppTheme} from '../theme/useAppTheme';

interface Props {
  ecl: ErrorCorrectionLevel;
  onEclChange: (ecl: ErrorCorrectionLevel) => void;
}

export function QrSettingsBar({ecl, onEclChange}: Props) {
  const {colors} = useAppTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, {color: colors.textSecondary}]}>
        Error Correction
      </Text>
      <View style={styles.row}>
        {ECL_OPTIONS.map(option => {
          const isActive = ecl === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => onEclChange(option.value)}
              activeOpacity={0.7}
              style={[
                styles.toggleBtn,
                {
                  backgroundColor: isActive
                    ? colors.primary
                    : colors.surfaceVariant,
                  borderColor: isActive ? colors.primary : colors.border,
                },
              ]}>
              <Text
                style={[
                  styles.toggleLabel,
                  {color: isActive ? '#FFFFFF' : colors.text},
                ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
    width: '100%',
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  toggleBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  toggleDesc: {
    fontSize: 10,
    marginTop: 2,
  },
});
