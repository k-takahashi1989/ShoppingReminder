import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  PermissionsAndroid,
  ScrollView,
} from 'react-native';
import {
  check,
  request,
  PERMISSIONS,
  RESULTS,
  openSettings,
} from 'react-native-permissions';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSettingsStore } from '../store/memoStore';
import {
  startGeofenceMonitoring,
  stopGeofenceMonitoring,
} from '../services/geofenceService';
import BackgroundService from 'react-native-background-actions';

type PermStatus = 'granted' | 'denied' | 'blocked' | 'unavailable' | 'limited' | 'unknown';

const androidVersion = Platform.Version as number;

async function checkLocationPermissions(): Promise<{
  fine: PermStatus;
  background: PermStatus;
  notification: PermStatus;
}> {
  const fine = (await check(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION)) as PermStatus;
  const background = (await check(
    PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION,
  )) as PermStatus;

  let notification: PermStatus = 'granted';
  if (androidVersion >= 33) {
    const result = await PermissionsAndroid.check(
      'android.permission.POST_NOTIFICATIONS' as any,
    );
    notification = result ? 'granted' : 'denied';
  }

  return { fine, background, notification };
}

export default function SettingsScreen(): React.JSX.Element {
  const defaultRadius = useSettingsStore(s => s.defaultRadius);
  const setDefaultRadius = useSettingsStore(s => s.setDefaultRadius);

  const [perms, setPerms] = useState<{
    fine: PermStatus;
    background: PermStatus;
    notification: PermStatus;
  }>({ fine: 'unknown', background: 'unknown', notification: 'unknown' });

  const [isMonitoring, setIsMonitoring] = useState(BackgroundService.isRunning());

  const refreshPerms = async () => {
    const p = await checkLocationPermissions();
    setPerms(p);
  };

  useEffect(() => {
    refreshPerms();
  }, []);

  const handleRequestPerms = async () => {
    // 1. 前景位置情報
    const fineResult = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
    if (fineResult !== RESULTS.GRANTED) {
      Alert.alert(
        '位置情報の許可が必要です',
        '設定 > アプリ > ShoppingReminder > 位置情報から許可してください',
        [
          { text: 'キャンセル', style: 'cancel' },
          { text: '設定を開く', onPress: () => openSettings() },
        ],
      );
      await refreshPerms();
      return;
    }

    // 2. バックグラウンド位置情報
    if (androidVersion >= 29) {
      const bgResult = await request(PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION);
      if (bgResult !== RESULTS.GRANTED) {
        Alert.alert(
          'バックグラウンド位置情報が必要です',
          '設定で「常に許可」を選択してください。これによりアプリを閉じているときも通知が届きます。',
          [
            { text: 'キャンセル', style: 'cancel' },
            { text: '設定を開く', onPress: () => openSettings() },
          ],
        );
      }
    }

    // 3. 通知 (Android 13+)
    if (androidVersion >= 33) {
      await PermissionsAndroid.request(
        'android.permission.POST_NOTIFICATIONS' as any,
      );
    }

    await refreshPerms();
  };

  const handleToggleMonitoring = async () => {
    if (isMonitoring) {
      await stopGeofenceMonitoring();
      setIsMonitoring(false);
    } else {
      if (perms.fine !== 'granted') {
        Alert.alert('位置情報の許可が必要です', '先に権限を付与してください');
        return;
      }
      await startGeofenceMonitoring();
      setIsMonitoring(true);
    }
  };

  const statusIcon = (s: PermStatus) => {
    if (s === 'granted') return <Icon name="check-circle" size={20} color="#4CAF50" />;
    if (s === 'blocked') return <Icon name="block" size={20} color="#EF5350" />;
    return <Icon name="warning" size={20} color="#FF9800" />;
  };

  const statusText = (s: PermStatus) => {
    switch (s) {
      case 'granted': return '許可済み';
      case 'denied': return '未許可';
      case 'blocked': return 'ブロック中';
      case 'unavailable': return '利用不可';
      default: return '確認中...';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.pageTitle}>⚙️ 設定</Text>

      {/* 権限セクション */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>通知・位置情報の権限</Text>

        <View style={styles.permRow}>
          {statusIcon(perms.fine)}
          <View style={styles.permBody}>
            <Text style={styles.permName}>位置情報 (前景)</Text>
            <Text style={styles.permStatus}>{statusText(perms.fine)}</Text>
          </View>
        </View>

        <View style={styles.permRow}>
          {statusIcon(perms.background)}
          <View style={styles.permBody}>
            <Text style={styles.permName}>位置情報 (バックグラウンド)</Text>
            <Text style={styles.permStatus}>{statusText(perms.background)}</Text>
          </View>
        </View>

        <View style={styles.permRow}>
          {statusIcon(perms.notification)}
          <View style={styles.permBody}>
            <Text style={styles.permName}>プッシュ通知</Text>
            <Text style={styles.permStatus}>{statusText(perms.notification)}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.permBtn} onPress={handleRequestPerms}>
          <Icon name="lock-open" size={18} color="#fff" />
          <Text style={styles.permBtnText}>権限を申請する</Text>
        </TouchableOpacity>
      </View>

      {/* 監視の ON/OFF */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>ジオフェンス監視</Text>
        <Text style={styles.cardDesc}>
          オンにすると登録した場所に近づいたとき通知が届きます。バッテリー消費が増える場合があります。
        </Text>
        <TouchableOpacity
          style={[styles.monitorBtn, isMonitoring && styles.monitorBtnStop]}
          onPress={handleToggleMonitoring}>
          <Icon name={isMonitoring ? 'stop' : 'play-arrow'} size={20} color="#fff" />
          <Text style={styles.monitorBtnText}>
            {isMonitoring ? '監視を停止' : '監視を開始'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* デフォルト半径 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>デフォルト通知半径</Text>
        <Text style={styles.radiusValue}>{defaultRadius} m</Text>
        <Slider
          style={styles.slider}
          minimumValue={50}
          maximumValue={1000}
          step={50}
          value={defaultRadius}
          onValueChange={setDefaultRadius}
          minimumTrackTintColor="#4CAF50"
          maximumTrackTintColor="#E0E0E0"
          thumbTintColor="#4CAF50"
        />
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabel}>50m</Text>
          <Text style={styles.sliderLabel}>1000m</Text>
        </View>
      </View>

      {/* アプリ情報 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>アプリ情報</Text>
        <Text style={styles.infoText}>バージョン: 1.0.0</Text>
        <Text style={styles.infoText}>ShoppingReminder</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 16 },
  pageTitle: { fontSize: 20, fontWeight: 'bold', color: '#212121', marginBottom: 16, marginTop: 8 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    elevation: 1,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#424242', marginBottom: 12 },
  cardDesc: { fontSize: 13, color: '#757575', marginBottom: 12, lineHeight: 20 },
  permRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  permBody: { flex: 1 },
  permName: { fontSize: 14, color: '#212121', fontWeight: '500' },
  permStatus: { fontSize: 12, color: '#9E9E9E', marginTop: 2 },
  permBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 12,
    marginTop: 14,
  },
  permBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  monitorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 12,
  },
  monitorBtnStop: { backgroundColor: '#EF5350' },
  monitorBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  radiusValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 8,
  },
  slider: { width: '100%', height: 40 },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  sliderLabel: { fontSize: 11, color: '#9E9E9E' },
  infoText: { fontSize: 13, color: '#757575', marginBottom: 4 },
});
