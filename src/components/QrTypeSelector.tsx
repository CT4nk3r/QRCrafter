import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {QR_TYPE_OPTIONS, QrType} from '../types/qr';
import {useAppTheme} from '../theme/useAppTheme';

interface Props {
  selected: QrType;
  onSelect: (type: QrType) => void;
}

export function QrTypeSelector({selected, onSelect}: Props) {
  const {colors} = useAppTheme();

  return (
    <View>
      <Text style={[styles.label, {color: colors.textSecondary}]}>
        QR Code Type
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {QR_TYPE_OPTIONS.map(option => {
          const isActive = selected === option.type;
          return (
            <TouchableOpacity
              key={option.type}
              onPress={() => onSelect(option.type)}
              activeOpacity={0.7}
              style={[
                styles.chip,
                {
                  backgroundColor: isActive
                    ? colors.primary
                    : colors.surfaceVariant,
                  borderColor: isActive ? colors.primary : colors.border,
                },
              ]}>
              <Text style={styles.icon}>{option.icon}</Text>
              <Text
                style={[
                  styles.chipText,
                  {color: isActive ? '#FFFFFF' : colors.text},
                ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  scrollContent: {
    gap: 8,
    paddingRight: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  icon: {
    fontSize: 16,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
