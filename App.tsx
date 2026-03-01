/**
 * QR Code Creator — Free & Open Source QR Code Generator
 *
 * @format
 */

import React, {useState} from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import {SafeAreaProvider, useSafeAreaInsets} from 'react-native-safe-area-context';
import {HomeScreen} from './src/screens/HomeScreen';
import {DecoderScreen} from './src/screens/DecoderScreen';
import {useAppTheme} from './src/theme/useAppTheme';

type Tab = 'create' | 'decode';

function TabNavigator() {
  const [activeTab, setActiveTab] = useState<Tab>('create');
  const {colors} = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Tab Bar */}
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
            paddingTop: insets.top,
          },
        ]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'create' && [
              styles.tabActive,
              {borderBottomColor: colors.primary},
            ],
          ]}
          onPress={() => setActiveTab('create')}>
          <Text
            style={[
              styles.tabText,
              {color: colors.textSecondary},
              activeTab === 'create' && [
                styles.tabTextActive,
                {color: colors.primary},
              ],
            ]}>
            ✏️ Create
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'decode' && [
              styles.tabActive,
              {borderBottomColor: colors.primary},
            ],
          ]}
          onPress={() => setActiveTab('decode')}>
          <Text
            style={[
              styles.tabText,
              {color: colors.textSecondary},
              activeTab === 'decode' && [
                styles.tabTextActive,
                {color: colors.primary},
              ],
            ]}>
            🔍 Decode
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'create' ? <HomeScreen /> : <DecoderScreen />}
    </View>
  );
}

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#0F172A' : '#F8F9FA'}
      />
      <TabNavigator />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  tabTextActive: {
    fontWeight: '700',
  },
});

export default App;
