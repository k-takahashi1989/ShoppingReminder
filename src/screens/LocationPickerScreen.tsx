import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  RouteProp,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MapView, { Marker, Circle, LongPressEvent } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import Config from 'react-native-config';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useMemoStore } from '../store/memoStore';
import { useSettingsStore } from '../store/memoStore';
import { RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'LocationPicker'>;

type Tab = 'map' | 'search';

interface PickedLocation {
  latitude: number;
  longitude: number;
}

// 日本のデフォルト中心 (東京)
const DEFAULT_REGION = {
  latitude: 35.6812,
  longitude: 139.7671,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function LocationPickerScreen(): React.JSX.Element {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { memoId, existingLocationId } = route.params;

  const addLocation = useMemoStore(s => s.addLocation);
  const updateLocation = useMemoStore(s => s.updateLocation);
  const defaultRadius = useSettingsStore(s => s.defaultRadius);

  const [activeTab, setActiveTab] = useState<Tab>('search');
  const [picked, setPicked] = useState<PickedLocation | null>(null);
  const [label, setLabel] = useState('');
  const [radius, setRadius] = useState(String(defaultRadius));

  const mapRef = useRef<MapView>(null);

  const handleMapPress = (e: LongPressEvent) => {
    setPicked(e.nativeEvent.coordinate);
  };

  const handlePlaceSelected = (data: any, details: any) => {
    if (!details?.geometry?.location) return;
    const { lat, lng } = details.geometry.location;
    const coords = { latitude: lat, longitude: lng };
    setPicked(coords);
    if (!label && details.name) setLabel(details.name);
    // 地図タブに切り替えて選択地点を表示
    setActiveTab('map');
    setTimeout(() => {
      mapRef.current?.animateToRegion(
        { ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 },
        400,
      );
    }, 100);
  };

  const handleSave = () => {
    if (!picked) {
      Alert.alert('場所を選択してください', '地図をタップするか検索で場所を選んでください');
      return;
    }
    if (!label.trim()) {
      Alert.alert('名前を入力してください', 'この場所の名前 (例: スーパー) を入力してください');
      return;
    }
    const radiusNum = parseInt(radius, 10);
    if (isNaN(radiusNum) || radiusNum < 50 || radiusNum > 5000) {
      Alert.alert('半径エラー', '半径は 50〜5000m の範囲で入力してください');
      return;
    }

    const locationData = {
      label: label.trim(),
      latitude: picked.latitude,
      longitude: picked.longitude,
      radius: radiusNum,
    };

    if (existingLocationId) {
      updateLocation(memoId, existingLocationId, locationData);
    } else {
      const result = addLocation(memoId, locationData);
      if (!result) {
        Alert.alert('追加できません', '場所は最大3か所まで登録できます');
        return;
      }
    }

    navigation.goBack();
  };

  const radiusNum = parseInt(radius, 10) || defaultRadius;

  return (
    <View style={styles.container}>
      {/* タブ */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'search' && styles.tabActive]}
          onPress={() => setActiveTab('search')}>
          <Icon name="search" size={18} color={activeTab === 'search' ? '#4CAF50' : '#9E9E9E'} />
          <Text style={[styles.tabText, activeTab === 'search' && styles.tabTextActive]}>
            検索
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'map' && styles.tabActive]}
          onPress={() => setActiveTab('map')}>
          <Icon name="map" size={18} color={activeTab === 'map' ? '#4CAF50' : '#9E9E9E'} />
          <Text style={[styles.tabText, activeTab === 'map' && styles.tabTextActive]}>
            地図
          </Text>
        </TouchableOpacity>
      </View>

      {/* 検索タブ */}
      {activeTab === 'search' && (
        <View style={styles.searchContainer}>
          <GooglePlacesAutocomplete
            placeholder="店名や住所で検索..."
            onPress={handlePlaceSelected}
            fetchDetails={true}
            query={{
              key: Config.GOOGLE_PLACES_API_KEY,
              language: 'ja',
              components: 'country:jp',
            }}
            styles={{
              textInput: styles.searchInput,
              listView: styles.searchList,
              row: styles.searchRow,
              description: styles.searchDesc,
            }}
            enablePoweredByContainer={false}
          />
          {picked && (
            <View style={styles.pickedBadge}>
              <Icon name="check-circle" size={16} color="#4CAF50" />
              <Text style={styles.pickedBadgeText}>
                場所を選択しました ({picked.latitude.toFixed(5)}, {picked.longitude.toFixed(5)})
              </Text>
            </View>
          )}
        </View>
      )}

      {/* 地図タブ */}
      {activeTab === 'map' && (
        <View style={styles.mapContainer}>
          <Text style={styles.mapHint}>地図を長押しして場所を選択</Text>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={
              picked
                ? { ...picked, latitudeDelta: 0.01, longitudeDelta: 0.01 }
                : DEFAULT_REGION
            }
            onLongPress={handleMapPress}
            showsUserLocation={true}
            showsMyLocationButton={true}>
            {picked && (
              <>
                <Marker coordinate={picked} pinColor="#4CAF50" />
                <Circle
                  center={picked}
                  radius={isNaN(radiusNum) ? defaultRadius : radiusNum}
                  fillColor="rgba(76, 175, 80, 0.15)"
                  strokeColor="rgba(76, 175, 80, 0.6)"
                  strokeWidth={2}
                />
              </>
            )}
          </MapView>
        </View>
      )}

      {/* 場所名・半径入力 */}
      <View style={styles.form}>
        <View style={styles.inputRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>場所の名前</Text>
            <TextInput
              style={styles.input}
              value={label}
              onChangeText={setLabel}
              placeholder="例: スーパー三和"
              placeholderTextColor="#BDBDBD"
            />
          </View>
          <View style={[styles.inputGroup, styles.inputGroupSmall]}>
            <Text style={styles.inputLabel}>半径 (m)</Text>
            <TextInput
              style={styles.input}
              value={radius}
              onChangeText={setRadius}
              keyboardType="numeric"
              placeholder="200"
              placeholderTextColor="#BDBDBD"
            />
          </View>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Icon name="check" size={20} color="#fff" />
          <Text style={styles.saveBtnText}>この場所を保存</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#4CAF50' },
  tabText: { fontSize: 14, color: '#9E9E9E', fontWeight: '600' },
  tabTextActive: { color: '#4CAF50' },
  searchContainer: { flex: 1, padding: 12 },
  searchInput: {
    fontSize: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 48,
    elevation: 2,
    color: '#212121',
  },
  searchList: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginTop: 4,
    elevation: 3,
  },
  searchRow: { padding: 14 },
  searchDesc: { fontSize: 14, color: '#212121' },
  pickedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  pickedBadgeText: { fontSize: 12, color: '#2E7D32', flex: 1 },
  mapContainer: { flex: 1 },
  mapHint: {
    textAlign: 'center',
    fontSize: 12,
    color: '#757575',
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  map: { flex: 1 },
  form: {
    backgroundColor: '#fff',
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  inputRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  inputGroup: { flex: 1 },
  inputGroupSmall: { flex: 0.45 },
  inputLabel: { fontSize: 12, color: '#757575', marginBottom: 4, fontWeight: '600' },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 15,
    color: '#212121',
  },
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
