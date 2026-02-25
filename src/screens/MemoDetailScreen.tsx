import React, { useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AdBanner from '../components/AdBanner';
import TutorialTooltip from '../components/TutorialTooltip';
import { useTranslation } from 'react-i18next';
import { useMemoStore } from '../store/memoStore';
import { useTutorial } from '../hooks/useTutorial';
import { RootStackParamList, ShoppingItem, MemoLocation } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'MemoDetail'>;

export default function MemoDetailScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { memoId } = route.params;

  const memo = useMemoStore(s => s.getMemoById(memoId));
  const toggleItem = useMemoStore(s => s.toggleItem);
  const updateMemo = useMemoStore(s => s.updateMemo);
  const deleteLocation = useMemoStore(s => s.deleteLocation);

  const bellRef = useRef<View>(null);
  const { step: tutStep, isActive: tutActive, targetLayout: tutLayout, advance: tutAdvance, skip: tutSkip } =
    useTutorial('memoDetail', 1, [bellRef]);

  if (!memo) {
    return (
      <View style={styles.center}>
        <Text>{t('memoDetail.notFound')}</Text>
      </View>
    );
  }

  const handleToggleNotification = () => {
    updateMemo(memoId, { notificationEnabled: !memo.notificationEnabled });
  };

  const handleDeleteLocation = (loc: MemoLocation) => {
    Alert.alert(t('memoDetail.deleteLocTitle'), t('memoDetail.deleteLocMessage', { label: loc.label }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => deleteLocation(memoId, loc.id),
      },
    ]);
  };

  const handleToggleItem = useCallback((item: ShoppingItem) => {
    if (item.isChecked) {
      Alert.alert(
        t('memoDetail.uncheckTitle'),
        t('memoDetail.uncheckMessage'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('common.confirm'), onPress: () => toggleItem(memoId, item.id) },
        ],
      );
    } else {
      toggleItem(memoId, item.id);
    }
  }, [memoId, t, toggleItem]);

  const renderShoppingItem = (item: ShoppingItem) => {
    const dateStr =
      item.isChecked && item.checkedAt
        ? new Date(item.checkedAt).toLocaleDateString()
        : null;
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.itemRow}
        onPress={() => handleToggleItem(item)}
        activeOpacity={0.7}>
        <Icon
          name={item.isChecked ? 'check-box' : 'check-box-outline-blank'}
          size={24}
          color={item.isChecked ? '#4CAF50' : '#9E9E9E'}
        />
        <Text style={[styles.itemText, item.isChecked && styles.itemChecked]}>
          {item.name}
        </Text>
        {dateStr !== null && (
          <Text style={styles.itemDate}>{dateStr}</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
      {/* タイトル + 通知トグル + 編集ボタン */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>{memo.title}</Text>
        <View ref={bellRef}>
          <TouchableOpacity
            onPress={handleToggleNotification}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.headerIcon}>
            <Icon
              name={memo.notificationEnabled ? 'notifications' : 'notifications-off'}
              size={22}
              color={memo.notificationEnabled ? '#4CAF50' : '#9E9E9E'}
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('MemoEdit', { memoId })}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.pencilBtn}>
          <Icon name="edit" size={22} color="#757575" />
        </TouchableOpacity>
      </View>

      {/* 場所セクション */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {t('memoDetail.locationSection', { count: memo.locations.length })}
          </Text>
          {memo.locations.length < 3 && (
            <TouchableOpacity
              onPress={() => navigation.navigate('LocationPicker', { memoId })}
              style={styles.addLocBtn}>
              <Icon name="add-location" size={18} color="#4CAF50" />
              <Text style={styles.addLocText}>{t('memoDetail.addLocation')}</Text>
            </TouchableOpacity>
          )}
        </View>
        {memo.locations.length === 0 ? (
          <Text style={styles.noLocText}>
            {t('memoDetail.locationEmpty')}
          </Text>
        ) : (
          memo.locations.map(loc => (
            <View key={loc.id} style={styles.locChip}>
              <View style={styles.locChipBody}>
                <Text style={styles.locChipLabel}>{loc.label}</Text>
                {loc.address ? (
                  <Text style={styles.locChipAddress}>{loc.address}</Text>
                ) : null}
                <Text style={styles.locChipRadius}>{t('memoDetail.radiusLabel', { radius: loc.radius })}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDeleteLocation(loc)}>
                <Icon name="close" size={18} color="#9E9E9E" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* 買い物アイテムリスト */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('memoDetail.itemSection')}</Text>
        {memo.items.length === 0 ? (
          <Text style={styles.noLocText}>
            {t('memoDetail.itemEmpty')}
          </Text>
        ) : (
          memo.items.map(renderShoppingItem)
        )}
      </View>

      </ScrollView>

      <View style={styles.bottomBar}>
        <AdBanner />
      </View>
      <TutorialTooltip
        visible={tutActive}
        targetLayout={tutLayout}
        text={t('tutorial.memoDetail.step1')}
        stepLabel={`STEP 1 / 1`}
        isLast
        nextLabel={t('tutorial.ok')}
        skipLabel={t('tutorial.skip')}
        onNext={tutAdvance}
        onSkip={tutSkip}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 8 },
  bottomBar: { paddingHorizontal: 16, paddingTop: 4, backgroundColor: '#F5F5F5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#212121', flex: 1, marginRight: 8 },
  headerIcon: { marginLeft: 8 },
  pencilBtn: { marginLeft: 16 },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#424242' },
  addLocBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addLocText: { fontSize: 14, color: '#4CAF50', fontWeight: '600' },
  noLocText: { fontSize: 13, color: '#9E9E9E', textAlign: 'center', paddingVertical: 8 },
  locChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
  },
  locChipBody: { flex: 1 },
  locChipLabel: { fontSize: 14, fontWeight: '600', color: '#2E7D32' },
  locChipAddress: { fontSize: 12, color: '#616161', marginTop: 2 },
  locChipRadius: { fontSize: 12, color: '#4CAF50', marginTop: 2 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  itemText: { fontSize: 15, color: '#212121', flex: 1 },
  itemChecked: { color: '#9E9E9E', textDecorationLine: 'line-through' },
  itemDate: { fontSize: 11, color: '#9E9E9E', marginLeft: 4 },
});
