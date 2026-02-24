import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AdBanner from '../components/AdBanner';
import { useMemoStore } from '../store/memoStore';
import { clearMemoFromCache } from '../services/geofenceService';
import { RootStackParamList, ShoppingItem, MemoLocation } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'MemoDetail'>;

export default function MemoDetailScreen(): React.JSX.Element {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { memoId } = route.params;

  const memo = useMemoStore(s => s.getMemoById(memoId));
  const toggleItem = useMemoStore(s => s.toggleItem);
  const updateMemo = useMemoStore(s => s.updateMemo);
  const deleteLocation = useMemoStore(s => s.deleteLocation);

  if (!memo) {
    return (
      <View style={styles.center}>
        <Text>メモが見つかりません</Text>
      </View>
    );
  }

  const handleComplete = () => {
    Alert.alert(
      memo.isCompleted ? '未完了に戻す' : 'メモを完了にする',
      memo.isCompleted
        ? 'このメモを未完了に戻しますか？'
        : 'このメモを完了にしますか？場所のリマインドが停止されます。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '確定',
          onPress: () => {
            updateMemo(memoId, { isCompleted: !memo.isCompleted });
            if (!memo.isCompleted) clearMemoFromCache(memoId);
          },
        },
      ],
    );
  };

  const handleDeleteLocation = (loc: MemoLocation) => {
    Alert.alert('場所を削除', `「${loc.label}」を削除しますか？`, [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: () => deleteLocation(memoId, loc.id),
      },
    ]);
  };

  const renderItem = ({ item }: { item: ShoppingItem }) => (
    <TouchableOpacity
      style={styles.itemRow}
      onPress={() => toggleItem(memoId, item.id)}
      activeOpacity={0.7}>
      <Icon
        name={item.isChecked ? 'check-box' : 'check-box-outline-blank'}
        size={24}
        color={item.isChecked ? '#4CAF50' : '#9E9E9E'}
      />
      <Text style={[styles.itemText, item.isChecked && styles.itemChecked]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* タイトル + 編集ボタン */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>{memo.title}</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('MemoEdit', { memoId })}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="edit" size={22} color="#757575" />
        </TouchableOpacity>
      </View>

      {/* 場所セクション */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            📍 場所 ({memo.locations.length} / 3)
          </Text>
          {memo.locations.length < 3 && !memo.isCompleted && (
            <TouchableOpacity
              onPress={() => navigation.navigate('LocationPicker', { memoId })}
              style={styles.addLocBtn}>
              <Icon name="add-location" size={18} color="#4CAF50" />
              <Text style={styles.addLocText}>追加</Text>
            </TouchableOpacity>
          )}
        </View>
        {memo.locations.length === 0 ? (
          <Text style={styles.noLocText}>
            場所を追加するとそこに近づいたとき通知が来ます
          </Text>
        ) : (
          memo.locations.map(loc => (
            <View key={loc.id} style={styles.locChip}>
              <View style={styles.locChipBody}>
                <Text style={styles.locChipLabel}>{loc.label}</Text>
                {loc.address ? (
                  <Text style={styles.locChipAddress}>{loc.address}</Text>
                ) : null}
                <Text style={styles.locChipRadius}>半径 {loc.radius}m</Text>
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
        <Text style={styles.sectionTitle}>🛒 買い物リスト</Text>
        {memo.items.length === 0 ? (
          <Text style={styles.noLocText}>
            編集画面でアイテムを追加してください
          </Text>
        ) : (
          <FlatList
            data={memo.items}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            scrollEnabled={false}
          />
        )}
      </View>

      {/* 完了ボタン */}
      <TouchableOpacity
        style={[styles.completeBtn, memo.isCompleted && styles.completeBtnDone]}
        onPress={handleComplete}>
        <Icon
          name={memo.isCompleted ? 'undo' : 'check-circle'}
          size={20}
          color="#fff"
        />
        <Text style={styles.completeBtnText}>
          {memo.isCompleted ? '未完了に戻す' : 'メモを完了にする'}
        </Text>
      </TouchableOpacity>
      <AdBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#212121', flex: 1, marginRight: 8 },
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
  completeBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  completeBtnDone: { backgroundColor: '#757575' },
  completeBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
