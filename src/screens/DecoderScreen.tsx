import React, {useCallback, useState} from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Linking,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import Clipboard from '@react-native-clipboard/clipboard';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAppTheme} from '../theme/useAppTheme';
import RNFS from 'react-native-fs';
import jsQR from 'jsqr';
import jpeg from 'jpeg-js';
import {decodePNG} from '../utils/pngDecoder';

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function DecoderScreen() {
  const {colors} = useAppTheme();
  const insets = useSafeAreaInsets();

  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [decodedData, setDecodedData] = useState<string | null>(null);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);

  const decodeImageData = useCallback(async (imageBuffer: Uint8Array) => {
    try {
      let width: number;
      let height: number;
      let imageData: Uint8ClampedArray;

      // Detect image format from magic bytes
      const isPNG = imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50 && imageBuffer[2] === 0x4E && imageBuffer[3] === 0x47;
      const isJPEG = imageBuffer[0] === 0xFF && imageBuffer[1] === 0xD8 && imageBuffer[2] === 0xFF;

      if (isPNG) {
        // Decode PNG using minimal pure JS decoder
        const pngData = decodePNG(new Uint8Array(imageBuffer));
        width = pngData.width;
        height = pngData.height;
        imageData = pngData.data;
      } else if (isJPEG) {
        // Decode JPEG
        const rawImage = jpeg.decode(imageBuffer, {useTArray: true});
        width = rawImage.width;
        height = rawImage.height;
        imageData = new Uint8ClampedArray(rawImage.data);
      } else {
        throw new Error('Unsupported image format. Please use PNG or JPEG.');
      }

      const code = jsQR(imageData, width, height);
      
      if (code?.data) {
        setDecodedData(code.data);
      } else {
        setError('No QR code found in the image');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to decode image');
    }
  }, []);

  const decodeFromLocalUri = useCallback(async (uri: string) => {
    try {
      setLoading(true);
      setError('');
      setDecodedData(null);

      const normalizedUri = uri.startsWith('file://') ? uri.replace('file://', '') : uri;
      const imageBuffer = await RNFS.readFile(normalizedUri, 'base64');
      const buffer = base64ToUint8Array(imageBuffer);
      
      await decodeImageData(buffer);
    } catch (err: any) {
      setError(err?.message || 'Failed to decode image');
    } finally {
      setLoading(false);
    }
  }, [decodeImageData]);

  const decodeFromBase64 = useCallback(async (base64Input: string) => {
    try {
      setLoading(true);
      setError('');
      setDecodedData(null);

      const normalized = base64Input.trim();
      const base64 = normalized.startsWith('data:image')
        ? normalized.substring(normalized.indexOf(',') + 1)
        : normalized;

      const buffer = base64ToUint8Array(base64);
      await decodeImageData(buffer);
    } catch (err: any) {
      setError(err?.message || 'Failed to decode image');
    } finally {
      setLoading(false);
    }
  }, [decodeImageData]);

  const handlePickImage = useCallback(
    async () => {
      try {
        const result = await launchImageLibrary({
          mediaType: 'photo',
          selectionLimit: 1,
          quality: 1,
          includeBase64: true,
        });

        if (result.didCancel) {
          return;
        }

        if (result.errorCode) {
          setError(`Error: ${result.errorMessage}`);
          return;
        }

        const asset = result.assets?.[0];
        if (asset?.uri && asset?.base64) {
          setSelectedImageUri(asset.uri);
          await decodeFromBase64(asset.base64);
        } else if (asset?.uri) {
          setSelectedImageUri(asset.uri);
          await decodeFromLocalUri(asset.uri);
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to pick image');
        setLoading(false);
      }
    },
    [decodeFromBase64, decodeFromLocalUri],
  );

  const decodeImageFromUrl = useCallback(
    async (url: string) => {
      if (!url.trim()) {
        setError('Please enter an image URL');
        return;
      }

      try {
        setSelectedImageUri(url);
        setLoading(true);
        setError('');
        setDecodedData(null);

        // Download image and convert to base64
        const downloadResult = await RNFS.downloadFile({
          fromUrl: url,
          toFile: `${RNFS.CachesDirectoryPath}/qr_temp.jpg`,
        }).promise;

        if (downloadResult.statusCode === 200) {
          await decodeFromLocalUri(`${RNFS.CachesDirectoryPath}/qr_temp.jpg`);
          // Clean up
          await RNFS.unlink(`${RNFS.CachesDirectoryPath}/qr_temp.jpg`);
        } else {
          setError('Failed to download image from URL');
          setLoading(false);
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load image from URL');
        setLoading(false);
      }
    },
    [decodeFromLocalUri],
  );

  const handlePasteFromClipboard = useCallback(async () => {
    try {
      const clipboardImage = await Clipboard.getImage();

      if (clipboardImage && clipboardImage.startsWith('data:image')) {
        setSelectedImageUri(clipboardImage);
        await decodeFromBase64(clipboardImage);
        return;
      }

      const clipboardContent = await Clipboard.getString();

      if (!clipboardContent) {
        setError('Clipboard is empty');
        return;
      }

      if (
        clipboardContent.startsWith('http://') ||
        clipboardContent.startsWith('https://')
      ) {
        setImageUrl(clipboardContent);
        await decodeImageFromUrl(clipboardContent);
      } else if (clipboardContent.startsWith('data:image')) {
        setSelectedImageUri(clipboardContent);
        await decodeFromBase64(clipboardContent);
      } else {
        setError('Clipboard does not contain an image, image URL, or base64 image data');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to access clipboard');
      setLoading(false);
    }
  }, [decodeFromBase64, decodeImageFromUrl]);

  const handleLoadFromUrl = useCallback(async () => {
    if (!imageUrl.trim()) {
      setError('Please enter an image URL');
      return;
    }
    await decodeImageFromUrl(imageUrl);
  }, [imageUrl, decodeImageFromUrl]);

  const handleCopyToClipboard = useCallback(() => {
    if (decodedData) {
      Clipboard.setString(decodedData);
      Alert.alert('Copied!', 'Decoded text has been copied to clipboard.');
    }
  }, [decodedData]);

  const handleOpenUrl = useCallback(() => {
    if (decodedData && (decodedData.startsWith('http://') || decodedData.startsWith('https://'))) {
      Linking.openURL(decodedData);
    }
  }, [decodedData]);

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
        <Text style={[styles.title, {color: colors.text}]}>Decode QR Code</Text>
        <Text style={[styles.subtitle, {color: colors.textSecondary}]}>
          Pick from Gallery, paste from clipboard, or load from URL
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Image Picker Button */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, {color: colors.text}]}>
              🖼️ Pick from Gallery (Camera Roll)
            </Text>
            <TouchableOpacity
              style={[styles.button, {backgroundColor: colors.primary}]}
              onPress={handlePickImage}>
              <Text style={styles.buttonText}>Open Gallery</Text>
            </TouchableOpacity>
          </View>

          {/* Clipboard Button */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, {color: colors.text}]}>
              📋 Paste from Clipboard
            </Text>
            <Text style={[styles.sectionDescription, {color: colors.textSecondary}]}>
              Copy an image, image URL, or base64 image data
            </Text>
            <TouchableOpacity
              style={[styles.button, {backgroundColor: colors.primary}]}
              onPress={handlePasteFromClipboard}>
              <Text style={styles.buttonText}>Paste & Decode</Text>
            </TouchableOpacity>
          </View>

          {/* URL Input */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, {color: colors.text}]}>
              🔗 Load from URL
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={imageUrl}
              onChangeText={setImageUrl}
              placeholder="https://example.com/qrcode.png"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <TouchableOpacity
              style={[styles.button, {backgroundColor: colors.primary}]}
              onPress={handleLoadFromUrl}>
              <Text style={styles.buttonText}>Load Image</Text>
            </TouchableOpacity>
          </View>

          {/* Selected Image Preview */}
          {selectedImageUri && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, {color: colors.text}]}>
                Selected Image
              </Text>
              <Image
                source={{uri: selectedImageUri}}
                style={styles.imagePreview}
                resizeMode="contain"
              />
            </View>
          )}

          {/* Loading State */}
          {loading && (
            <View
              style={[
                styles.messageBox,
                {backgroundColor: colors.primary + '20'},
              ]}>
              <Text style={[styles.messageText, {color: colors.primary}]}>
                🔍 Decoding QR code...
              </Text>
            </View>
          )}

          {/* Error Display */}
          {error && (
            <View
              style={[styles.messageBox, {backgroundColor: colors.error + '20'}]}>
              <Text style={[styles.messageText, {color: colors.error}]}>
                ❌ {error}
              </Text>
            </View>
          )}

          {/* Decoded Data Display */}
          {decodedData && (
            <View
              style={[
                styles.messageBox,
                {backgroundColor: colors.success + '20'},
              ]}>
              <Text
                style={[
                  styles.messageTitle,
                  {color: colors.success},
                ]}>
                ✅ QR Code Decoded Successfully!
              </Text>
              <View
                style={[
                  styles.dataBox,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}>
                <Text
                  style={[styles.dataText, {color: colors.text}]}
                  selectable>
                  {decodedData}
                </Text>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, {backgroundColor: colors.success}]}
                  onPress={handleCopyToClipboard}>
                  <Text style={styles.actionButtonText}>📋 Copy</Text>
                </TouchableOpacity>

                {(decodedData.startsWith('http://') ||
                  decodedData.startsWith('https://')) && (
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      {backgroundColor: colors.primary},
                    ]}
                    onPress={handleOpenUrl}>
                    <Text style={styles.actionButtonText}>🔗 Open URL</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Info Card */}
          <View
            style={[
              styles.infoCard,
              {backgroundColor: colors.primary + '15'},
            ]}>
            <Text style={[styles.infoTitle, {color: colors.primary}]}>
              🔒 Privacy First
            </Text>
            <Text style={[styles.infoText, {color: colors.text}]}>
              All QR code decoding happens locally on your device. Images are
              never uploaded to any server. Your privacy is protected.
            </Text>
          </View>
        </View>
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
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
  },
  container: {
    gap: 20,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionDescription: {
    fontSize: 13,
    marginTop: -8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  button: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  messageBox: {
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  messageText: {
    fontSize: 14,
  },
  messageTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  dataBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  dataText: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
  },
});
