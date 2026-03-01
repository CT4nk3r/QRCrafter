import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Platform,
  PermissionsAndroid,
  Alert,
  ActivityIndicator,
} from 'react-native';
import WifiManager from 'react-native-wifi-reborn';
import {
  QrType,
  WifiConfig,
  EmailConfig,
  SmsConfig,
  QR_TYPE_OPTIONS,
} from '../types/qr';
import {useAppTheme} from '../theme/useAppTheme';

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
}: Props) {
  const {colors} = useAppTheme();
  const [loadingSsid, setLoadingSsid] = useState(false);
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
        <TextInput
          style={inputStyle}
          value={smsConfig.phone}
          onChangeText={phone =>
            onSmsConfigChange({...smsConfig, phone})
          }
          placeholder="+1234567890"
          placeholderTextColor={colors.textSecondary}
          keyboardType="phone-pad"
        />

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
      </View>
    );
  }

  // Simple input for url, text, phone
  return (
    <View style={styles.container}>
      <Text style={labelStyle}>
        {qrType === 'url'
          ? 'Website URL'
          : qrType === 'phone'
            ? 'Phone Number'
            : 'Your Text'}
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
          qrType === 'url'
            ? 'url'
            : qrType === 'phone'
              ? 'phone-pad'
              : 'default'
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
});
