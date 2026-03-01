import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Modal,
  FlatList,
  Platform,
  PermissionsAndroid,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {getCountries, getCountryCallingCode} from 'libphonenumber-js';
import type {CountryCode} from 'libphonenumber-js';
import countries from 'i18n-iso-countries';
import enCountries from 'i18n-iso-countries/langs/en.json';
import WifiManager from 'react-native-wifi-reborn';
import {
  QrType,
  WifiConfig,
  EmailConfig,
  SmsConfig,
  QR_TYPE_OPTIONS,
} from '../types/qr';
import {useAppTheme} from '../theme/useAppTheme';

type CountryOption = {
  country: string;
  callingCode: string;
  name: string;
  label: string;
};

countries.registerLocale(enCountries);

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
  const {colors} = useAppTheme();
  const [loadingSsid, setLoadingSsid] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'phone' | 'sms' | null>(null);
  const [countryQuery, setCountryQuery] = useState('');
  const placeholder =
    QR_TYPE_OPTIONS.find(o => o.type === qrType)?.placeholder ?? '';

  const inputStyle = [
    styles.input,
    {
      backgroundColor: colors.surfaceVariant,
      color: colors.text,
      borderColor: colors.border,
    },
  ];

  const labelStyle = [styles.fieldLabel, {color: colors.textSecondary}];

  const sanitizePhone = (raw: string) => raw.replace(/\D/g, '');
  const phoneCallingCode = `+${getCountryCallingCode(phoneCountry as CountryCode)}`;
  const smsCallingCode = `+${getCountryCallingCode(smsCountry as CountryCode)}`;

  const normalizedQuery = countryQuery.trim().toUpperCase();
  const normalizedQueryLower = countryQuery.trim().toLowerCase();
  const filteredCountries = COUNTRY_OPTIONS.filter(option => {
    if (!normalizedQuery) {
      return true;
    }
    return (
      option.country.includes(normalizedQuery) ||
      option.callingCode.includes(normalizedQuery) ||
      option.name.toLowerCase().includes(normalizedQueryLower)
    );
  });

  const openCountryPicker = (target: 'phone' | 'sms') => {
    setPickerTarget(target);
  };

  const closeCountryPicker = () => {
    setPickerTarget(null);
    setCountryQuery('');
  };

  const handleCountrySelect = (country: string) => {
    if (pickerTarget === 'phone') {
      onPhoneCountryChange(country);
    } else if (pickerTarget === 'sms') {
      onSmsCountryChange(country);
    }
    closeCountryPicker();
  };

  const countryPickerModal = (
    <Modal
      visible={pickerTarget !== null}
      transparent
      animationType="slide"
      onRequestClose={closeCountryPicker}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalSheet, {backgroundColor: colors.surface}]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, {color: colors.text}]}>
              Select Region
            </Text>
            <TouchableOpacity onPress={closeCountryPicker}>
              <Text style={{color: colors.primary, fontWeight: '600'}}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={[...inputStyle, styles.searchInput]}
            value={countryQuery}
            onChangeText={setCountryQuery}
            placeholder="Search ISO or code (e.g. US or +1)"
            placeholderTextColor={colors.textSecondary}
            autoCorrect={false}
            autoFocus
            onSubmitEditing={() => {
              if (filteredCountries.length > 0) {
                handleCountrySelect(filteredCountries[0].country);
              }
            }}
          />
          <FlatList
            data={filteredCountries}
            keyExtractor={item => item.country}
            keyboardShouldPersistTaps="handled"
            renderItem={({item, index}) => {
              const selectedCountry =
                pickerTarget === 'phone' ? phoneCountry : smsCountry;
              const isSelected = selectedCountry === item.country;
              const isFirstResult = index === 0;
              return (
                <TouchableOpacity
                  onPress={() => handleCountrySelect(item.country)}
                  style={[
                    styles.modalRow,
                    {
                      backgroundColor: isFirstResult
                        ? colors.primary + '20'
                        : isSelected
                          ? colors.surfaceVariant
                          : 'transparent',
                    },
                  ]}>
                  <Text
                    style={{
                      color: colors.text,
                      fontWeight: isSelected ? '700' : isFirstResult ? '600' : '500',
                    }}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );

  const fetchCurrentSsid = useCallback(async () => {
    setLoadingSsid(true);
    try {
      // Android needs location permission to read SSID
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message:
              'Location access is needed to detect the current Wi-Fi network name.',
            buttonPositive: 'Allow',
            buttonNegative: 'Deny',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            'Permission Denied',
            'Location permission is required to detect the Wi-Fi network.',
          );
          setLoadingSsid(false);
          return;
        }
      }

      const ssid = await WifiManager.getCurrentWifiSSID();
      if (ssid && ssid !== '<unknown ssid>') {
        onWifiConfigChange({...wifiConfig, ssid});
      } else {
        Alert.alert(
          'Not Connected',
          'Could not detect a Wi-Fi network. Make sure you are connected to Wi-Fi.',
        );
      }
    } catch {
      Alert.alert(
        'Error',
        'Could not detect the current Wi-Fi network.',
      );
    } finally {
      setLoadingSsid(false);
    }
  }, [wifiConfig, onWifiConfigChange]);

  if (qrType === 'wifi') {
    return (
      <View style={styles.container}>
        <Text style={labelStyle}>Network Name (SSID)</Text>
        <View style={styles.ssidRow}>
          <TextInput
            style={[...inputStyle, styles.ssidInput]}
            value={wifiConfig.ssid}
            onChangeText={ssid =>
              onWifiConfigChange({...wifiConfig, ssid})
            }
            placeholder="My Network"
            placeholderTextColor={colors.textSecondary}
          />
          <TouchableOpacity
            onPress={fetchCurrentSsid}
            disabled={loadingSsid}
            activeOpacity={0.7}
            style={[
              styles.ssidBtn,
              {
                backgroundColor: colors.primary,
              },
            ]}>
            {loadingSsid ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.ssidBtnText}>📶 Current</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={labelStyle}>Password</Text>
        <TextInput
          style={inputStyle}
          value={wifiConfig.password}
          onChangeText={password =>
            onWifiConfigChange({...wifiConfig, password})
          }
          placeholder="Password"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
        />

        <Text style={labelStyle}>Encryption</Text>
        <View style={styles.encryptionRow}>
          {(['WPA', 'WEP', 'nopass'] as const).map(enc => {
            const active = wifiConfig.encryption === enc;
            return (
              <TouchableOpacity
                key={enc}
                onPress={() =>
                  onWifiConfigChange({...wifiConfig, encryption: enc})
                }
                style={[
                  styles.encryptionChip,
                  {
                    backgroundColor: active
                      ? colors.primary
                      : colors.surfaceVariant,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}>
                <Text
                  style={{
                    color: active ? '#FFFFFF' : colors.text,
                    fontWeight: '600',
                    fontSize: 13,
                  }}>
                  {enc === 'nopass' ? 'None' : enc}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.switchRow}>
          <Text style={[styles.fieldLabel, {color: colors.text}]}>
            Hidden Network
          </Text>
          <Switch
            value={wifiConfig.hidden}
            onValueChange={hidden =>
              onWifiConfigChange({...wifiConfig, hidden})
            }
            trackColor={{true: colors.primary, false: colors.border}}
          />
        </View>
      </View>
    );
  }

  if (qrType === 'email') {
    return (
      <View style={styles.container}>
        <Text style={labelStyle}>Email Address</Text>
        <TextInput
          style={inputStyle}
          value={emailConfig.address}
          onChangeText={address =>
            onEmailConfigChange({...emailConfig, address})
          }
          placeholder="email@example.com"
          placeholderTextColor={colors.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={labelStyle}>Subject (optional)</Text>
        <TextInput
          style={inputStyle}
          value={emailConfig.subject}
          onChangeText={subject =>
            onEmailConfigChange({...emailConfig, subject})
          }
          placeholder="Hello!"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={labelStyle}>Body (optional)</Text>
        <TextInput
          style={[...inputStyle, styles.multiline]}
          value={emailConfig.body}
          onChangeText={body =>
            onEmailConfigChange({...emailConfig, body})
          }
          placeholder="Your message..."
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={3}
        />
      </View>
    );
  }

  if (qrType === 'sms') {
    return (
      <View style={styles.container}>
        <Text style={labelStyle}>Phone Number</Text>
        <View style={styles.phoneRow}>
          <TouchableOpacity
            onPress={() => openCountryPicker('sms')}
            activeOpacity={0.7}
            style={[
              styles.regionButton,
              {
                backgroundColor: colors.surfaceVariant,
                borderColor: colors.border,
              },
            ]}>
            <Text
              style={[styles.regionButtonText, {color: colors.text}]}
              numberOfLines={1}
            >
              {countryToFlag(smsCountry)} {smsCallingCode}
            </Text>
          </TouchableOpacity>
          <TextInput
            style={[...inputStyle, styles.phoneInput]}
            value={smsConfig.phone}
            onChangeText={phone =>
              onSmsConfigChange({...smsConfig, phone: sanitizePhone(phone)})
            }
            placeholder="5551234567"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            autoComplete="tel"
          />
        </View>

        <Text style={labelStyle}>Message (optional)</Text>
        <TextInput
          style={[...inputStyle, styles.multiline]}
          value={smsConfig.message}
          onChangeText={message =>
            onSmsConfigChange({...smsConfig, message})
          }
          placeholder="Your message..."
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={3}
        />
        {countryPickerModal}
      </View>
    );
  }

  if (qrType === 'phone') {
    return (
      <View style={styles.container}>
        <Text style={labelStyle}>Phone Number</Text>
        <View style={styles.phoneRow}>
          <TouchableOpacity
            onPress={() => openCountryPicker('phone')}
            activeOpacity={0.7}
            style={[
              styles.regionButton,
              {
                backgroundColor: colors.surfaceVariant,
                borderColor: colors.border,
              },
            ]}>
            <Text
              style={[styles.regionButtonText, {color: colors.text}]}
              numberOfLines={1}
            >
              {countryToFlag(phoneCountry)} {phoneCallingCode}
            </Text>
          </TouchableOpacity>
          <TextInput
            style={[...inputStyle, styles.phoneInput]}
            value={value}
            onChangeText={text => onValueChange(sanitizePhone(text))}
            placeholder="5551234567"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            autoComplete="tel"
          />
        </View>
        {countryPickerModal}
      </View>
    );
  }

  // Simple input for url, text
  return (
    <View style={styles.container}>
      <Text style={labelStyle}>
        {qrType === 'url' ? 'Website URL' : 'Your Text'}
      </Text>
      <TextInput
        style={[
          ...inputStyle,
          qrType === 'text' ? styles.multiline : undefined,
        ]}
        value={value}
        onChangeText={onValueChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        keyboardType={
          qrType === 'url' ? 'url' : 'default'
        }
        autoCapitalize={qrType === 'url' ? 'none' : 'sentences'}
        multiline={qrType === 'text'}
        numberOfLines={qrType === 'text' ? 4 : 1}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  encryptionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  countryPickerButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignSelf: 'flex-start',
    maxWidth: '70%',
  },
  countryPickerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countryCodePill: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  phoneInput: {
    flex: 1,
  },
  encryptionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  ssidRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  ssidInput: {
    flex: 1,
  },
  ssidBtn: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ssidBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  searchInput: {
    marginBottom: 12,
  },
  modalRow: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  regionButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
  },
  regionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
