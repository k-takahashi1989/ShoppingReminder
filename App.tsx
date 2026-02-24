/**
 * ShoppingReminder - メインエントリコンポーネント
 * @format
 */

import React, { useEffect } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { createNotificationChannel } from './src/services/notificationService';
import { startGeofenceMonitoring } from './src/services/geofenceService';
import { check, PERMISSIONS, RESULTS } from 'react-native-permissions';
import './src/i18n'; // i18n 初期化

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    // 通知チャンネルの作成 (Android 必須)
    createNotificationChannel();

    // 位置情報権限があればジオフェンス監視を自動開始
    check(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION).then(status => {
      if (status === RESULTS.GRANTED) {
        startGeofenceMonitoring();
      }
    });
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

export default App;
