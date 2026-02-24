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
import AdBanner from '../components/AdBanner';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
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
  const { t } = useTranslation();
  const defaultRadius = useSettingsStore(s => s.defaultRadius);
  const setDefaultRadius = useSettingsStore(s => s.setDefaultRadius);
  const maxRadius = useSettingsStore(s => s.maxRadius);
  const setMaxRadius = useSettingsStore(s => s.setMaxRadius);

  const [perms, setPerms] = useState<{
    fine: PermStatus;
    background: PermStatus;
    notification: PermStatus;
  }>({ fine: 'unknown', background: 'unknown', notification: 'unknown' });

  const [isMonitoring, setIsMonitoring] = useState(BackgroundService.isRunning());
  const [currentLang, setCurrentLang] = useState(i18n.language);

  const handleChangeLang = (lang: string) => {
    i18n.changeLanguage(lang);
    setCurrentLang(lang);
  };

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
        t('settings.alertFineLocation.title'),
        t('settings.alertFineLocation.message'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('settings.alertFineLocation.openSettings'), onPress: () => openSettings() },
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
          t('settings.alertBackground.title'),
          t('settings.alertBackground.message'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('settings.alertFineLocation.openSettings'), onPress: () => openSettings() },
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
        Alert.alert(t('settings.alertFineLocation.title'), t('settings.alertMonitor.message'));
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
      case 'granted': return t('settings.status.on');
      case 'denied': return t('settings.status.off');
      case 'blocked': return t('settings.status.blocked');
      case 'unavailable': return t('settings.status.unavailable');
      default: return t('settings.status.checking');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.pageTitle}>{t('settings.screenTitle')}</Text>

      {/* 権限セクション */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('settings.permCard.title')}</Text>

        <View style={styles.permRow}>
          {statusIcon(perms.fine)}
          <View style={styles.permBody}>
            <Text style={styles.permName}>{t('settings.permCard.foreground')}</Text>
            <Text style={styles.permStatus}>{statusText(perms.fine)}</Text>
          </View>
        </View>

        <View style={styles.permRow}>
          {statusIcon(perms.background)}
          <View style={styles.permBody}>
            <Text style={styles.permName}>{t('settings.permCard.background')}</Text>
            <Text style={styles.permStatus}>{statusText(perms.background)}</Text>
          </View>
        </View>

        <View style={styles.permRow}>
          {statusIcon(perms.notification)}
          <View style={styles.permBody}>
            <Text style={styles.permName}>{t('settings.permCard.notification')}</Text>
            <Text style={styles.permStatus}>{statusText(perms.notification)}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.permBtn} onPress={handleRequestPerms}>
          <Icon name="lock-open" size={18} color="#fff" />
          <Text style={styles.permBtnText}>{t('settings.permCard.enableButton')}</Text>
        </TouchableOpacity>
      </View>

      {/* 監視の ON/OFF */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('settings.monitorCard.title')}</Text>
        <Text style={styles.cardDesc}>
          {t('settings.monitorCard.description')}
        </Text>
        <TouchableOpacity
          style={[styles.monitorBtn, isMonitoring && styles.monitorBtnStop]}
          onPress={handleToggleMonitoring}>
          <Icon name={isMonitoring ? 'stop' : 'play-arrow'} size={20} color="#fff" />
          <Text style={styles.monitorBtnText}>
            {isMonitoring ? t('settings.monitorCard.stopButton') : t('settings.monitorCard.startButton')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* デフォルト半径 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('settings.defaultRadius.title')}</Text>
        <Text style={styles.radiusValue}>{defaultRadius} m</Text>
        <Slider
          style={styles.slider}
          minimumValue={50}
          maximumValue={maxRadius}
          step={50}
          value={defaultRadius}
          onValueChange={setDefaultRadius}
          minimumTrackTintColor="#4CAF50"
          maximumTrackTintColor="#E0E0E0"
          thumbTintColor="#4CAF50"
        />
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabel}>50m</Text>
          <Text style={styles.sliderLabel}>{maxRadius}m</Text>
        </View>
      </View>

      {/* 半径拡大オプション */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('settings.maxRadius.title')}</Text>
        <Text style={styles.infoText}>{t('settings.maxRadius.description')}</Text>
        <View style={styles.maxRadiusRow}>
          {[200, 400, 600, 800, 1000].map(val => (
            <TouchableOpacity
              key={val}
              style={[styles.maxRadiusBtn, maxRadius === val && styles.maxRadiusBtnActive]}
              onPress={() => setMaxRadius(val)}>
              <Text style={[styles.maxRadiusBtnText, maxRadius === val && styles.maxRadiusBtnTextActive]}>{val}m</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 表示言語 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('settings.langCard.title')}</Text>
        <View style={styles.langRow}>
          <TouchableOpacity
            style={[styles.langBtn, currentLang === 'ja' && styles.langBtnActive]}
            onPress={() => handleChangeLang('ja')}>
            <Text style={[styles.langBtnText, currentLang === 'ja' && styles.langBtnTextActive]}>🇯🇵 日本語</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langBtn, currentLang === 'en' && styles.langBtnActive]}
            onPress={() => handleChangeLang('en')}>
            <Text style={[styles.langBtnText, currentLang === 'en' && styles.langBtnTextActive]}>🇺🇸 English</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* アプリ情報 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('settings.appInfo.title')}</Text>
        <Text style={styles.infoText}>{t('settings.appInfo.version')}</Text>
        <Text style={styles.infoText}>{t('settings.appInfo.name')}</Text>
      </View>
      <AdBanner />
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
  maxRadiusRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  maxRadiusBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  maxRadiusBtnActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  maxRadiusBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9E9E9E',
  },
  maxRadiusBtnTextActive: {
    color: '#4CAF50',
  },
  infoText: { fontSize: 13, color: '#757575', marginBottom: 4 },
  langRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  langBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  langBtnActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  langBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9E9E9E',
  },
  langBtnTextActive: {
    color: '#4CAF50',
  },
});



