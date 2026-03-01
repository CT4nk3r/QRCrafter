import React, {useCallback, useMemo, useRef, useState} from 'react';
import {
  Alert,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import ViewShot, {captureRef} from 'react-native-view-shot';
import Share from 'react-native-share';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {getCountryCallingCode} from 'libphonenumber-js';

import {QrTypeSelector} from '../components/QrTypeSelector';
import {QrInputForm} from '../components/QrInputForm';
import {QrCustomizer} from '../components/QrCustomizer';
import {useAppTheme} from '../theme/useAppTheme';
import {
  encodeEmail,
  encodePhone,
  encodeSms,
  encodeWifi,
} from '../utils/encoders';
import {
  QrType,
  WifiConfig,
  EmailConfig,
  SmsConfig,
  ErrorCorrectionLevel,
} from '../types/qr';
import {QrSettingsBar} from '../components/QrSettingsBar';

export function HomeScreen() {
  const {colors, isDark} = useAppTheme();
  const insets = useSafeAreaInsets();
  const qrRef = useRef<View>(null);
  const exportRef = useRef<View>(null);

  const PREVIEW_SIZE = 200;

  // QR type
  const [qrType, setQrType] = useState<QrType>('url');

  // Simple value (for url, text, phone)
  const [simpleValue, setSimpleValue] = useState('');

  const [phoneCountry, setPhoneCountry] = useState('US');

  // Structured configs
  const [wifiConfig, setWifiConfig] = useState<WifiConfig>({
    ssid: '',
    password: '',
    encryption: 'WPA',
    hidden: false,
  });
  const [emailConfig, setEmailConfig] = useState<EmailConfig>({
    address: '',
    subject: '',
    body: '',
  });
  const [smsConfig, setSmsConfig] = useState<SmsConfig>({
    phone: '',
    message: '',
  });

  const [smsCountry, setSmsCountry] = useState('US');

  // Customization
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [exportSize, setExportSize] = useState(200);
  const [showCustomizer, setShowCustomizer] = useState(false);

  // QR settings
  const [ecl, setEcl] = useState<ErrorCorrectionLevel>('L');

  // Compute final QR value
  const qrValue = useMemo(() => {
    switch (qrType) {
      case 'url':
      case 'text':
        return simpleValue;
      case 'phone':
        return simpleValue
          ? encodePhone(`+${getCountryCallingCode(phoneCountry)}${simpleValue}`)
          : '';
      case 'wifi':
        return wifiConfig.ssid ? encodeWifi(wifiConfig) : '';
      case 'email':
        return emailConfig.address ? encodeEmail(emailConfig) : '';
      case 'sms':
        return smsConfig.phone
          ? encodeSms({
              ...smsConfig,
              phone: `+${getCountryCallingCode(smsCountry)}${smsConfig.phone}`,
            })
          : '';
      default:
        return '';
    }
  }, [qrType, simpleValue, wifiConfig, emailConfig, smsConfig, phoneCountry, smsCountry]);

  const hasContent = qrValue.length > 0;

  // Handle type change — clear inputs
  const handleTypeChange = useCallback((type: QrType) => {
    setQrType(type);
    setSimpleValue('');
    setWifiConfig({ssid: '', password: '', encryption: 'WPA', hidden: false});
    setEmailConfig({address: '', subject: '', body: ''});
    setSmsConfig({phone: '', message: ''});
    setPhoneCountry('US');
    setSmsCountry('US');
  }, []);

  // Share QR code
  const handleShare = useCallback(async () => {
    if (!exportRef.current) {
      return;
    }
    try {
      const uri = await captureRef(exportRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      await Share.open({
        url: Platform.OS === 'android' ? `file://${uri}` : uri,
        type: 'image/png',
        title: 'Share QR Code',
      });
    } catch (err: any) {
      if (err?.message !== 'User did not share') {
        Alert.alert('Error', 'Could not share the QR code.');
      }
    }
  }, []);

  // Save QR code directly to gallery
  const handleSave = useCallback(async () => {
    if (!exportRef.current) {
      return;
    }
    try {
      // Request permission on Android < 13 (API 33+)
      if (Platform.OS === 'android') {
        const apiLevel = Platform.Version;
        if (typeof apiLevel === 'number' && apiLevel < 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            {
              title: 'Storage Permission',
              message: 'QR Code Creator needs access to save images to your gallery.',
              buttonPositive: 'Allow',
              buttonNegative: 'Deny',
            },
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert(
              'Permission Denied',
              'Storage permission is required to save QR codes to your gallery.',
            );
            return;
          }
        }
      }

      const uri = await captureRef(exportRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      await CameraRoll.saveAsset(
        Platform.OS === 'android' ? `file://${uri}` : uri,
        {type: 'photo', album: 'QR Codes'},
      );

      Alert.alert('Saved!', 'QR code has been saved to your gallery.');
    } catch (err: any) {
      Alert.alert('Error', 'Could not save the QR code to your gallery.');
    }
  }, []);

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
          paddingBottom: insets.bottom,
        },
      ]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, {color: colors.text}]}>
          QR Code Creator
        </Text>
        <Text style={[styles.subtitle, {color: colors.textSecondary}]}>
          Free & Open Source — No tracking, no proxies
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* Type selector */}
        <QrTypeSelector selected={qrType} onSelect={handleTypeChange} />

        {/* Input form */}
        <View style={[styles.card, {backgroundColor: colors.surface, borderColor: colors.border}]}>
          <QrInputForm
            qrType={qrType}
            value={simpleValue}
            onValueChange={setSimpleValue}
            wifiConfig={wifiConfig}
            onWifiConfigChange={setWifiConfig}
            emailConfig={emailConfig}
            onEmailConfigChange={setEmailConfig}
            smsConfig={smsConfig}
            onSmsConfigChange={setSmsConfig}
            phoneCountry={phoneCountry}
            onPhoneCountryChange={setPhoneCountry}
            smsCountry={smsCountry}
            onSmsCountryChange={setSmsCountry}
          />
        </View>

        {/* QR Code display */}
        {hasContent && (
          <View
            style={[
              styles.qrCard,
              {backgroundColor: colors.surface, borderColor: colors.border},
            ]}>
            {/* QR Settings */}
            <QrSettingsBar
              ecl={ecl}
              onEclChange={setEcl}
            />

            <View
              ref={qrRef}
              collapsable={false}
              style={[styles.qrContainer, {backgroundColor: bgColor}]}>
              <QRCode
                value={qrValue}
                size={PREVIEW_SIZE}
                color={fgColor}
                backgroundColor={bgColor}
                ecl={ecl}
              />
            </View>

            {/* Action buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={handleShare}
                activeOpacity={0.7}
                style={[styles.actionBtn, {backgroundColor: colors.primary}]}>
                <Text style={styles.actionBtnText}>📤 Share</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSave}
                activeOpacity={0.7}
                style={[
                  styles.actionBtn,
                  {backgroundColor: colors.primary},
                ]}>
                <Text style={styles.actionBtnText}>💾 Save</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowCustomizer(prev => !prev)}
                activeOpacity={0.7}
                style={[
                  styles.actionBtn,
                  {
                    backgroundColor: showCustomizer
                      ? colors.primaryLight
                      : colors.surfaceVariant,
                    borderColor: colors.border,
                    borderWidth: 1,
                  },
                ]}>
                <Text
                  style={[
                    styles.actionBtnText,
                    {color: showCustomizer ? colors.primary : colors.text},
                  ]}>
                  🎨 Style
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Customizer panel */}
        {hasContent && showCustomizer && (
          <View
            style={[
              styles.card,
              {backgroundColor: colors.surface, borderColor: colors.border},
            ]}>
            <QrCustomizer
              fgColor={fgColor}
              bgColor={bgColor}
              size={exportSize}
              onFgColorChange={setFgColor}
              onBgColorChange={setBgColor}
              onSizeChange={setExportSize}
            />
          </View>
        )}

        {/* Empty state */}
        {!hasContent && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📱</Text>
            <Text style={[styles.emptyTitle, {color: colors.textSecondary}]}>
              Enter content above
            </Text>
            <Text style={[styles.emptyDesc, {color: colors.textSecondary}]}>
              Your QR code will appear here instantly
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, {color: colors.textSecondary}]}>
            100% free & open source. Your data never leaves your device.
          </Text>
        </View>
      </ScrollView>

      {/* Hidden off-screen QR code rendered at export size */}
      {hasContent && (
        <View
          ref={exportRef}
          collapsable={false}
          style={[styles.offscreen, {backgroundColor: bgColor}]}>
          <QRCode
            value={qrValue}
            size={exportSize}
            color={fgColor}
            backgroundColor={bgColor}
            ecl={ecl}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 12,
    gap: 16,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  qrCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  qrContainer: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptyDesc: {
    fontSize: 14,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
  },
  offscreen: {
    position: 'absolute',
    left: -9999,
    top: -9999,
    padding: 20,
  },
});
