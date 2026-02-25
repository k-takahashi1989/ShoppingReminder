/**
 * ShoppingReminder - メインエントリコンポーネント
 * @format
 */

import React, { useEffect } from 'react';
import { Alert, Linking, StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { createNotificationChannel } from './src/services/notificationService';
import { startGeofenceMonitoring } from './src/services/geofenceService';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import './src/i18n'; // i18n 初期化

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    // 通知チャンネルの作成 (Android 必須)
    createNotificationChannel();

    // 位置情報権限チェック → 必要なら起動時にリクエスト
    const initPermissions = async () => {
      const status = await check(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
      if (status === RESULTS.GRANTED) {
        startGeofenceMonitoring();
      } else if (status === RESULTS.DENIED) {
        // 初回またはまだ拒否済みでない場合はリクエスト
        const result = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
        if (result === RESULTS.GRANTED) {
          startGeofenceMonitoring();
        }
      } else if (status === RESULTS.BLOCKED) {
        // 「今後表示しない」で拒否済み → 設定画面へ誘導
        Alert.alert(
          '📍 位置情報の許可が必要です',
          'このアプリは近くの場所に近づいたときに通知するために位置情報を使用します。設定から「常に許可」または「アプリの使用中のみ許可」をオンにしてください。',
          [
            { text: 'あとで', style: 'cancel' },
            { text: '設定を開く', onPress: () => Linking.openSettings() },
          ],
        );
      }
    };

    // レンダリング後に少し遅らせてダイアログを表示
    setTimeout(() => initPermissions(), 500);
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

export default App;
