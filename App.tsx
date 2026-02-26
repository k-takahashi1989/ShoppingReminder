/**
 * Yorimichi - メインエントリコンポーネント
 * @format
 */

import React, { useEffect } from 'react';
import { Alert, Linking, PermissionsAndroid, Platform, StatusBar, useColorScheme } from 'react-native';
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
      const androidVersion = Platform.Version as number;

      // 1. 前景位置情報
      const fineStatus = await check(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
      if (fineStatus === RESULTS.BLOCKED) {
        Alert.alert(
          '📍 位置情報の許可が必要です',
          'このアプリは近くの場所に近づいたときに通知するために位置情報を使用します。設定から「アプリの使用中のみ許可」または「常に許可」をオンにしてください。',
          [
            { text: 'あとで', style: 'cancel' },
            { text: '設定を開く', onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }
      if (fineStatus === RESULTS.DENIED) {
        const result = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
        if (result !== RESULTS.GRANTED) return;
      }

      // 前景許可取得済み → ジオフェンス開始
      startGeofenceMonitoring();

      // 2. バックグラウンド位置情報 (Android 10+ / API 29+)
      if (androidVersion >= 29) {
        const bgStatus = await check(PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION);
        if (bgStatus === RESULTS.DENIED) {
          await request(PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION);
        }
      }

      // 3. プッシュ通知 (Android 13+ / API 33+)
      if (androidVersion >= 33) {
        const notifGranted = await PermissionsAndroid.check(
          'android.permission.POST_NOTIFICATIONS' as any,
        );
        if (!notifGranted) {
          await PermissionsAndroid.request(
            'android.permission.POST_NOTIFICATIONS' as any,
          );
        }
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
