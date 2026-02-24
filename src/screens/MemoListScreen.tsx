import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useMemoStore } from '../store/memoStore';
import { Memo, RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function MemoListScreen(): React.JSX.Element {
  const navigation = useNavigation<Nav>();
  const memos = useMemoStore(s => s.memos);
  const deleteMemo = useMemoStore(s => s.deleteMemo);
  const insets = useSafeAreaInsets();

  const handleDelete = useCallback(
    (memo: Memo) => {
      Alert.alert('メモを削除', `「${memo.title}」を削除しますか？`, [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => deleteMemo(memo.id),
        },
      ]);
    },
    [deleteMemo],
  );

  const renderItem = ({ item }: { item: Memo }) => {
    const unchecked = item.items.filter(i => !i.isChecked).length;
    const total = item.items.length;

    return (
      <TouchableOpacity
        style={[styles.card, item.isCompleted && styles.cardCompleted]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('MemoDetail', { memoId: item.id })}>
        <View style={styles.cardBody}>
          <Text style={[styles.cardTitle, item.isCompleted && styles.textMuted]}>
            {item.isCompleted ? '✅ ' : ''}{item.title}
          </Text>
          <Text style={styles.cardSub}>
            {total > 0 ? `${unchecked} / ${total} 点残り` : 'アイテムなし'}
          </Text>
          {item.locations.length > 0 && (
            <Text style={styles.cardLoc}>
              📍 {item.locations.map(l => l.label).join(' / ')}
            </Text>
          )}
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity
            onPress={() => navigation.navigate('MemoEdit', { memoId: item.id })}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Icon name="edit" size={22} color="#757575" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDelete(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.deleteBtn}>
            <Icon name="delete" size={22} color="#EF5350" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>買い物リスト</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('MemoEdit', {})}>
          <Icon name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {memos.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="shopping-cart" size={64} color="#E0E0E0" />
          <Text style={styles.emptyText}>メモがありません</Text>
          <Text style={styles.emptySubText}>右上の + ボタンで追加しましょう</Text>
        </View>
      ) : (
        <FlatList
          data={memos}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  addBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20,
    padding: 4,
  },
  list: { padding: 12, gap: 10 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardCompleted: { opacity: 0.6 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#212121', marginBottom: 4 },
  cardSub: { fontSize: 13, color: '#757575' },
  cardLoc: { fontSize: 12, color: '#4CAF50', marginTop: 4 },
  textMuted: { color: '#9E9E9E', textDecorationLine: 'line-through' },
  cardActions: { flexDirection: 'row', gap: 8, marginLeft: 8 },
  deleteBtn: { marginLeft: 4 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { fontSize: 18, color: '#9E9E9E', fontWeight: '600' },
  emptySubText: { fontSize: 14, color: '#BDBDBD' },
});
