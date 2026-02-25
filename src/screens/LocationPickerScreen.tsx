import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  RouteProp,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, Circle, LongPressEvent, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import { GooglePlacesAutocomplete, GooglePlaceData, GooglePlaceDetail } from 'react-native-google-places-autocomplete';
import Config from 'react-native-config';
import { useMemoStore } from '../store/memoStore';
import { useSettingsStore } from '../store/memoStore';
import { useShallow } from 'zustand/react/shallow';
import { RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'LocationPicker'>;

interface PickedLocation {
  latitude: number;
  longitude: number;
}

// フォールバック（現在地が取得できない場合）
const FALLBACK_REGION: Region = {
  latitude: 35.6812,
  longitude: 139.7671,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function LocationPickerScreen(): React.JSX.Element {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { memoId, existingLocationId } = route.params;

  const addLocation = useMemoStore(s => s.addLocation);
  const updateLocation = useMemoStore(s => s.updateLocation);
  const defaultRadius = useSettingsStore(s => s.defaultRadius);
  const maxRadius = useSettingsStore(s => s.maxRadius);

  // 同一メモの登録済み場所（編集中の場所自体は除外）
  const otherLocations = useMemoStore(
    useShallow(s =>
      (s.memos.find(m => m.id === memoId)?.locations ?? []).filter(
        loc => loc.id !== existingLocationId,
      ),
    ),
  );

  const [picked, setPicked] = useState<PickedLocation | null>(null);
  const [label, setLabel] = useState('');
  const [radius, setRadius] = useState(defaultRadius);
  const [address, setAddress] = useState<string | null>(null);
  const [initialRegion, setInitialRegion] = useState<Region>(FALLBACK_REGION);

  const mapRef = useRef<MapView>(null);
  const geocodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mapReadyRef = useRef(false);
  const pendingRegionRef = useRef<Region | null>(null);

  const animateWhenReady = (region: Region) => {
    if (mapReadyRef.current) {
      mapRef.current?.animateToRegion(region, 500);
    } else {
      pendingRegionRef.current = region;
    }
  };

  const handleMapReady = () => {
    mapReadyRef.current = true;
    if (pendingRegionRef.current) {
      mapRef.current?.animateToRegion(pendingRegionRef.current, 500);
      pendingRegionRef.current = null;
    }
  };

  // 逆ジオコーディングで住所（町名まで）を取得 - OpenStreetMap Nominatim使用（APIキー不要）
  // Nominatim のポリシーにより 1秒以下の間隔でリクエストしないようデバウンスする
  const reverseGeocode = (lat: number, lng: number) => {
    setAddress(null);
    if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current);
    geocodeTimerRef.current = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ja&zoom=16`;
        const res = await fetch(url, {
          headers: { 'User-Agent': 'YorimichiApp/1.0' },
        });
      const json = await res.json();
        if (json && json.address) {
          const a = json.address as Record<string, string>;
          // 都道府県: state（東京都等） または province（大阪府等）
          const pref  = a.state ?? a.province ?? '';
          // 市区 / 町 / 村
          const city  = a.city ?? a.town ?? a.village ?? '';
          // 区・郡など
          const ward  = a.suburb ?? '';
          // 丁目・町名
          const area  = a.quarter ?? a.neighbourhood ?? '';
          const parts  = [pref, city, ward, area].filter(Boolean);
          // 重複除去
          const unique = parts.filter((v, i) => parts.indexOf(v) === i);
          const formatted = unique.join('');
          if (formatted) {
            setAddress(formatted);
          }
        }
      } catch {
        // 住所取得失敗は無視
      }
    }, 1000);
  };

  // 起動時に現在地を取得して地図の中心にセット
  useEffect(() => {
    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        const region: Region = {
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setInitialRegion(region);
        animateWhenReady(region);
      },
      _error => {
        // 位置情報が取得できない場合はフォールバック（東京）を使用
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 既存場所の編集時はフォームに初期値をセット
  useEffect(() => {
    if (!existingLocationId) return;
    const memo = useMemoStore.getState().memos.find(m => m.id === memoId);
    const existing = memo?.locations.find(l => l.id === existingLocationId);
    if (!existing) return;
    setLabel(existing.label);
    setRadius(existing.radius);
    if (existing.address) setAddress(existing.address);
    const coords = { latitude: existing.latitude, longitude: existing.longitude };
    setPicked(coords);
    const region: Region = { ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 };
    setInitialRegion(region);
    setTimeout(() => animateWhenReady(region), 300);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMapPress = (e: LongPressEvent) => {
    const coord = e.nativeEvent.coordinate;
    setPicked(coord);
    Keyboard.dismiss();
    reverseGeocode(coord.latitude, coord.longitude);
  };

  const handlePlaceSelected = (_data: GooglePlaceData, details: GooglePlaceDetail | null) => {
    // 「現在地を使用」が選択された場合 (details が null)
    if (!details?.geometry?.location) {
      Geolocation.getCurrentPosition(
        pos => {
          const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          setPicked(coords);
          reverseGeocode(coords.latitude, coords.longitude);
          setTimeout(() => {
            mapRef.current?.animateToRegion(
              { ...coords, latitudeDelta: 0.005, longitudeDelta: 0.005 },
              400,
            );
          }, 100);
        },
        _err => {},
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
      return;
    }
    const { lat, lng } = details.geometry.location;
    const coords = { latitude: lat, longitude: lng };
    setPicked(coords);
    if (!label && details.name) setLabel(details.name);
    Keyboard.dismiss();
    reverseGeocode(lat, lng);
    setTimeout(() => {
      mapRef.current?.animateToRegion(
        { ...coords, latitudeDelta: 0.005, longitudeDelta: 0.005 },
        400,
      );
    }, 100);
  };

  const handleSave = () => {
    if (!picked) {
      Alert.alert(t('locationPicker.alertNoLocation'), t('locationPicker.alertNoLocationMsg'));
      return;
    }
    if (!label.trim()) {
      Alert.alert(t('locationPicker.alertNoLabel'), t('locationPicker.alertNoLabelMsg'));
      return;
    }

    const locationData = {
      label: label.trim(),
      latitude: picked.latitude,
      longitude: picked.longitude,
      radius,
      ...(address ? { address } : {}),
    };

    if (existingLocationId) {
      updateLocation(memoId, existingLocationId, locationData);
    } else {
      const result = addLocation(memoId, locationData);
      if (!result) {
        Alert.alert(t('locationPicker.alertMaxTitle'), t('locationPicker.alertMaxMsg'));
        return;
      }
    }

    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      {/* 地図 + 上部に検索バーをオーバーレイ */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={initialRegion}
          onMapReady={handleMapReady}
          onLongPress={handleMapPress}
          showsUserLocation={true}
          showsMyLocationButton={true}>
          {picked && (
            <>
              <Marker coordinate={picked} pinColor="#4CAF50" title={t('locationPicker.markerSelected')} />
              <Circle
                center={picked}
                radius={radius}
                fillColor="rgba(76, 175, 80, 0.15)"
                strokeColor="rgba(76, 175, 80, 0.6)"
                strokeWidth={2}
              />
            </>
          )}
          {/* 登録済みの場所（青で表示） */}
          {otherLocations.map(loc => (
            <React.Fragment key={loc.id}>
              <Marker
                coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
                pinColor="#2196F3"
                title={loc.label}
                description={t('locationPicker.markerRegistered')}
              />
              <Circle
                center={{ latitude: loc.latitude, longitude: loc.longitude }}
                radius={loc.radius}
                fillColor="rgba(33, 150, 243, 0.12)"
                strokeColor="rgba(33, 150, 243, 0.5)"
                strokeWidth={2}
              />
            </React.Fragment>
          ))}
        </MapView>

        {/* 地名検索バー */}
        <GooglePlacesAutocomplete
          placeholder={t('locationPicker.searchPlaceholder')}
          onPress={handlePlaceSelected}
          query={{
            key: Config.GOOGLE_PLACES_API_KEY ?? '',
            language: i18n.language === 'ja' ? 'ja' : 'en',
          }}
          fetchDetails={true}
          enablePoweredByContainer={false}
          currentLocation={true}
          currentLocationLabel={i18n.language === 'ja' ? '現在地を使用' : 'Use current location'}
          textInputProps={{ placeholderTextColor: '#9E9E9E' }}
          styles={{
            container: styles.placesContainer,
            textInputContainer: styles.placesTextInputContainer,
            textInput: styles.placesTextInput,
            listView: styles.placesList,
            row: styles.placesRow,
            description: styles.placesDescription,
          }}
        />

        {/* ヒントバッジ */}
        <View style={styles.hintBadge}>
          <Icon name="touch-app" size={14} color="#757575" />
          <Text style={styles.hintText}>{t('locationPicker.hintLongPress')}</Text>
        </View>

        {/* 凡例（登録済み場所が1件以上ある場合のみ表示） */}
        {otherLocations.length > 0 && (
          <View style={styles.legendBadge}>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
              <Text style={styles.legendText}>{t('locationPicker.legendSelected')}</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: '#2196F3' }]} />
              <Text style={styles.legendText}>{t('locationPicker.legendRegistered')}</Text>
            </View>
          </View>
        )}
      </View>

      {/* フォーム: 場所名・半径・保存ボタン */}
      <View style={[styles.form, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        {/* 場所名 */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>{t('locationPicker.labelInput')}</Text>
          <TextInput
            style={styles.input}
            value={label}
            onChangeText={setLabel}
            placeholder={t('locationPicker.labelPlaceholder')}
            placeholderTextColor="#BDBDBD"
          />
        </View>

        {/* 半径スライダー */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>{t('locationPicker.radiusLabel', { radius })}</Text>
          <Slider
            style={styles.slider}
            minimumValue={50}
            maximumValue={maxRadius}
            step={1}
            value={radius}
            onValueChange={val => setRadius(val)}
            minimumTrackTintColor="#4CAF50"
            maximumTrackTintColor="#E0E0E0"
            thumbTintColor="#4CAF50"
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>50m</Text>
            <Text style={styles.sliderLabel}>{maxRadius}m</Text>
          </View>
        </View>

        {/* 選択済みバッジ */}
        {picked && (
          <View style={styles.pickedBadge}>
            <Icon name="check-circle" size={14} color="#4CAF50" />
            <Text style={styles.pickedBadgeText}>
              {address ?? `${picked.latitude.toFixed(5)}, ${picked.longitude.toFixed(5)}`}
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Icon name="check" size={20} color="#fff" />
          <Text style={styles.saveBtnText}>{t('locationPicker.saveButton')}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },

  /* 地名検索 */
  placesContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    zIndex: 10,
    elevation: 5,
  },
  placesTextInputContainer: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderBottomWidth: 0,
  },
  placesTextInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    height: 44,
    fontSize: 14,
    color: '#212121',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  placesList: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 2,
    elevation: 5,
  },
  placesRow: {
    backgroundColor: '#fff',
    paddingVertical: 4,
  },
  placesDescription: {
    fontSize: 13,
    color: '#212121',
  },

  /* 地図 */
  mapContainer: { flex: 1, position: 'relative' },
  map: { flex: 1 },

  /* ヒントバッジ */
  hintBadge: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    elevation: 3,
  },
  hintText: { fontSize: 12, color: '#757575' },

  /* 凡例 */
  legendBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.93)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    elevation: 3,
    gap: 4,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: { fontSize: 11, color: '#424242' },

  /* フォーム */
  form: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  inputGroup: { marginBottom: 10 },
  inputLabel: { fontSize: 12, color: '#757575', marginBottom: 4, fontWeight: '600' },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 15,
    color: '#212121',
  },

  /* スライダー */
  slider: { width: '100%', height: 40 },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  sliderLabel: { fontSize: 11, color: '#9E9E9E' },

  /* 選択済みバッジ */
  pickedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  pickedBadgeText: { fontSize: 12, color: '#2E7D32' },

  /* 保存ボタン */
  saveBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
