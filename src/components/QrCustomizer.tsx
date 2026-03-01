import React, {useEffect, useState} from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet} from 'react-native';
import Slider from '@react-native-community/slider';
import {useAppTheme} from '../theme/useAppTheme';
import {PRESET_COLORS} from '../theme/colors';

interface Props {
  fgColor: string;
  bgColor: string;
  size: number;
  onFgColorChange: (color: string) => void;
  onBgColorChange: (color: string) => void;
  onSizeChange: (size: number) => void;
}

export function QrCustomizer({
  fgColor,
  bgColor,
  size,
  onFgColorChange,
  onBgColorChange,
  onSizeChange,
}: Props) {
  const {colors} = useAppTheme();
  const [sizeText, setSizeText] = useState(String(Math.round(size)));
  const [isEditingSize, setIsEditingSize] = useState(false);
  const [fgHex, setFgHex] = useState(fgColor);
  const [bgHex, setBgHex] = useState(bgColor);
  const [isEditingFg, setIsEditingFg] = useState(false);
  const [isEditingBg, setIsEditingBg] = useState(false);

  const isValidHex = (val: string) =>
    /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(val);

  // Sync hex fields when color changes externally (preset tap)
  useEffect(() => {
    if (!isEditingFg) {
      setFgHex(fgColor);
    }
  }, [fgColor, isEditingFg]);

  useEffect(() => {
    if (!isEditingBg) {
      setBgHex(bgColor);
    }
  }, [bgColor, isEditingBg]);

  // Sync text when size changes externally (e.g. from slider) but not while typing
  useEffect(() => {
    if (!isEditingSize) {
      setSizeText(String(Math.round(size)));
    }
  }, [size, isEditingSize]);

  const labelStyle = [styles.label, {color: colors.textSecondary}];

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, {color: colors.text}]}>
        Customize
      </Text>

      {/* Foreground color */}
      <Text style={labelStyle}>Foreground Color</Text>
      <View style={styles.colorRow}>
        {PRESET_COLORS.slice(0, 6).map(c => (
          <TouchableOpacity
            key={`fg-${c}`}
            onPress={() => onFgColorChange(c)}
            style={[
              styles.colorDot,
              {
                backgroundColor: c,
                borderColor: fgColor === c ? colors.primary : colors.border,
                borderWidth: fgColor === c ? 3 : 1,
              },
            ]}
          />
        ))}
      </View>
      <View style={styles.colorRow}>
        {PRESET_COLORS.slice(6).map(c => (
          <TouchableOpacity
            key={`fg-${c}`}
            onPress={() => onFgColorChange(c)}
            style={[
              styles.colorDot,
              {
                backgroundColor: c,
                borderColor: fgColor === c ? colors.primary : colors.border,
                borderWidth: fgColor === c ? 3 : 1,
              },
            ]}
          />
        ))}
      </View>
      <View style={styles.hexRow}>
        <View style={[styles.hexPreview, {backgroundColor: fgHex && isValidHex(fgHex) ? fgHex : fgColor, borderColor: colors.border}]} />
        <TextInput
          style={[
            styles.hexInput,
            {
              backgroundColor: colors.surfaceVariant,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
          value={fgHex}
          onFocus={() => setIsEditingFg(true)}
          onChangeText={text => {
            const val = text.startsWith('#') ? text : `#${text}`;
            setFgHex(val);
            if (isValidHex(val)) {
              onFgColorChange(val.toUpperCase());
            }
          }}
          onEndEditing={() => {
            if (isValidHex(fgHex)) {
              onFgColorChange(fgHex.toUpperCase());
            }
            setFgHex(fgColor);
            setIsEditingFg(false);
          }}
          placeholder="#000000"
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="characters"
          maxLength={7}
          selectTextOnFocus
        />
      </View>

      {/* Background color */}
      <Text style={[labelStyle, {marginTop: 16}]}>Background Color</Text>
      <View style={styles.colorRow}>
        {PRESET_COLORS.slice(0, 6).map(c => (
          <TouchableOpacity
            key={`bg-${c}`}
            onPress={() => onBgColorChange(c)}
            style={[
              styles.colorDot,
              {
                backgroundColor: c,
                borderColor: bgColor === c ? colors.primary : colors.border,
                borderWidth: bgColor === c ? 3 : 1,
              },
            ]}
          />
        ))}
      </View>
      <View style={styles.colorRow}>
        {PRESET_COLORS.slice(6).map(c => (
          <TouchableOpacity
            key={`bg-${c}`}
            onPress={() => onBgColorChange(c)}
            style={[
              styles.colorDot,
              {
                backgroundColor: c,
                borderColor: bgColor === c ? colors.primary : colors.border,
                borderWidth: bgColor === c ? 3 : 1,
              },
            ]}
          />
        ))}
      </View>
      <View style={styles.hexRow}>
        <View style={[styles.hexPreview, {backgroundColor: bgHex && isValidHex(bgHex) ? bgHex : bgColor, borderColor: colors.border}]} />
        <TextInput
          style={[
            styles.hexInput,
            {
              backgroundColor: colors.surfaceVariant,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
          value={bgHex}
          onFocus={() => setIsEditingBg(true)}
          onChangeText={text => {
            const val = text.startsWith('#') ? text : `#${text}`;
            setBgHex(val);
            if (isValidHex(val)) {
              onBgColorChange(val.toUpperCase());
            }
          }}
          onEndEditing={() => {
            if (isValidHex(bgHex)) {
              onBgColorChange(bgHex.toUpperCase());
            }
            setBgHex(bgColor);
            setIsEditingBg(false);
          }}
          placeholder="#FFFFFF"
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="characters"
          maxLength={7}
          selectTextOnFocus
        />
      </View>

      {/* Size slider + input */}
      <Text style={[labelStyle, {marginTop: 16}]}>Size</Text>
      <View style={styles.sizeRow}>
        <Slider
          minimumValue={120}
          maximumValue={300}
          value={size}
          onValueChange={onSizeChange}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.primary}
          style={styles.slider}
        />
        <TextInput
          style={[
            styles.sizeInput,
            {
              backgroundColor: colors.surfaceVariant,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
          value={sizeText}
          onFocus={() => setIsEditingSize(true)}
          onChangeText={setSizeText}
          onEndEditing={() => {
            const num = parseInt(sizeText, 10);
            if (!isNaN(num) && num >= 120 && num <= 300) {
              onSizeChange(num);
            }
            setSizeText(String(Math.round(size)));
            setIsEditingSize(false);
          }}
          onSubmitEditing={() => {
            const num = parseInt(sizeText, 10);
            if (!isNaN(num) && num >= 120 && num <= 300) {
              onSizeChange(num);
            }
            setSizeText(String(Math.round(size)));
            setIsEditingSize(false);
          }}
          keyboardType="number-pad"
          maxLength={3}
          selectTextOnFocus
        />
        <Text style={[styles.sizeUnit, {color: colors.textSecondary}]}>px</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  hexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  hexPreview: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
  },
  hexInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  slider: {
    flex: 1,
  },
  sizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sizeInput: {
    width: 56,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  sizeUnit: {
    fontSize: 13,
    fontWeight: '600',
  },
});
