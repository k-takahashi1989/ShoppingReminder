import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  RouteProp,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useMemoStore } from '../store/memoStore';
import { useSettingsStore } from '../store/memoStore';
import { useInterstitialAd } from '../hooks/useInterstitialAd';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import { RootStackParamList, ShoppingItem } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'MemoEdit'>;

export default function MemoEditScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const memoId = route.params?.memoId;

  const existingMemo = useMemoStore(s => (memoId ? s.getMemoById(memoId) : undefined));
  const addMemo = useMemoStore(s => s.addMemo);
  const updateMemo = useMemoStore(s => s.updateMemo);
  const addItem = useMemoStore(s => s.addItem);
  const deleteItem = useMemoStore(s => s.deleteItem);
  const updateItem = useMemoStore(s => s.updateItem);

  const totalMemoRegistrations = useSettingsStore(s => s.totalMemoRegistrations);
  const incrementMemoRegistrations = useSettingsStore(s => s.incrementMemoRegistrations);
  const { showIfReady } = useInterstitialAd();

  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [title, setTitle] = useState(existingMemo?.title ?? '');
  const [newItemName, setNewItemName] = useState('');
  const [savedMemoId, setSavedMemoId] = useState<string | undefined>(memoId);

  useEffect(() => {
    if (existingMemo) setTitle(existingMemo.title);
  }, [existingMemo]);

  const handleSaveTitle = useCallback(() => {
    if (!title.trim()) {
      Alert.alert('エラー', 'タイトルを入力してください');
      return;
    }
    if (savedMemoId) {
      updateMemo(savedMemoId, { title: title.trim() });
    } else {
      const memo = addMemo(title.trim());
      setSavedMemoId(memo.id);
    }
  }, [title, savedMemoId, addMemo, updateMemo]);

  const handleAddItem = useCallback(() => {
    if (!newItemName.trim()) return;
    if (!savedMemoId) {
      // メモ未保存なら先に保存する
      if (!title.trim()) {
        Alert.alert(t('memoEdit.errorNeedTitleFirst'), t('memoEdit.errorNeedTitleFirstMsg'));
        return;
      }
      const memo = addMemo(title.trim());
      setSavedMemoId(memo.id);
      addItem(memo.id, newItemName.trim());
    } else {
      addItem(savedMemoId, newItemName.trim());
    }
    setNewItemName('');
  }, [newItemName, savedMemoId, title, addMemo, addItem]);

  const currentItems = useMemoStore(
    useShallow((s): ShoppingItem[] => {
      if (!savedMemoId) return [];
      return s.memos.find(m => m.id === savedMemoId)?.items ?? [];
    }),
  );

  const renderItem = ({ item }: { item: ShoppingItem }) => (
    <View style={styles.itemRow}>
      <Icon name="drag-handle" size={20} color="#BDBDBD" />
      <TextInput
        style={styles.itemInput}
        value={item.name}
        onChangeText={text => updateItem(savedMemoId!, item.id, { name: text })}
        multiline={false}
      />
      <TouchableOpacity
        onPress={() => deleteItem(savedMemoId!, item.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Icon name="close" size={20} color="#EF5350" />
      </TouchableOpacity>
    </View>
  );

  const handleDone = () => {
    if (!title.trim()) {
      Alert.alert('エラー', 'タイトルを入力してください');
      return;
    }
    const isNew = !memoId; // ルートパラメータがない → 新規作成
    let targetId: string | undefined = savedMemoId;
    if (savedMemoId) {
      updateMemo(savedMemoId, { title: title.trim() });
    } else {
      const newMemo = addMemo(title.trim());
      targetId = newMemo.id;
    }
    if (!targetId) {
      navigation.goBack();
      return;
    }
    const finalId = targetId;
    const doNavigate = () => navigation.replace('MemoDetail', { memoId: finalId });
    if (isNew) {
      incrementMemoRegistrations();
      // totalMemoRegistrations は increment 前の値。
      // 5回目 (index 4) 以降からインタースティシャルを表示する
      if (totalMemoRegistrations >= 4) {
        showIfReady(doNavigate) || doNavigate();
        return;
      }
    }
    doNavigate();
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'android' ? 80 : 0}>
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => {
          // アイテム追加でリストが伸びたら最下部へ追従
          if (newItemName === '') {
            scrollRef.current?.scrollToEnd({ animated: true });
          }
        }}>
        {/* タイトル */}
        <Text style={styles.label}>{t('memoEdit.titleLabel')}</Text>
        <TextInput
          style={styles.titleInput}
          value={title}
          onChangeText={setTitle}
          placeholder={t('memoEdit.titlePlaceholder')}
          placeholderTextColor="#BDBDBD"
          onBlur={handleSaveTitle}
          returnKeyType="done"
        />

        {/* アイテム */}
        <Text style={styles.label}>{t('memoEdit.itemsLabel')}</Text>
        {currentItems.length > 0 && (
          <FlatList
            data={currentItems}
            keyExtractor={i => i.id}
            renderItem={renderItem}
            scrollEnabled={false}
          />
        )}

        {/* アイテム入力 */}
        <View style={styles.addRow}>
          <TextInput
            style={styles.addInput}
            value={newItemName}
            onChangeText={setNewItemName}
            placeholder={t('memoEdit.addItemPlaceholder')}
            placeholderTextColor="#9E9E9E"
            onSubmitEditing={handleAddItem}
            returnKeyType="done"
            blurOnSubmit={false}
            onFocus={() => {
              // キーボードが開ききってから末尾にスクロール
              setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 400);
            }}
          />
          <TouchableOpacity onPress={handleAddItem} style={styles.addButton}>
            <Icon name="add" size={20} color="#4CAF50" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 完了 */}
      <TouchableOpacity style={[styles.doneBtn, { marginBottom: Math.max(insets.bottom, 16) }]} onPress={handleDone}>
        <Text style={styles.doneBtnText}>{t('memoEdit.doneButton')}</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F5F5F5' },
  container: { flex: 1, padding: 16 },
  scrollContent: { paddingBottom: 80 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#757575',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 6,
  },
  titleInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    elevation: 1,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 4,
  },
  itemInput: {
    flex: 1,
    fontSize: 15,
    color: '#212121',
    padding: 0,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginTop: 4,
    elevation: 1,
  },
  addInput: {
    flex: 1,
    fontSize: 15,
    color: '#212121',
    paddingVertical: 12,
  },
  addButton: {
    padding: 6,
  },
  doneBtn: {
    margin: 16,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
