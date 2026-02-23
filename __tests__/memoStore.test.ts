/**
 * memoStore のユニットテスト
 * 全ての CRUD 操作をテストする
 */
import { useMemoStore, useSettingsStore } from '../src/store/memoStore';

// ============================================================
// ヘルパー: テスト前にストアをリセット
// ============================================================
beforeEach(() => {
  useMemoStore.setState({ memos: [] });
  useSettingsStore.setState({ defaultRadius: 200 });
});

// ============================================================
// Memo CRUD
// ============================================================
describe('useMemoStore - Memo CRUD', () => {
  it('新しいメモを作成できる', () => {
    const memo = useMemoStore.getState().addMemo('買い物リスト');

    expect(memo.title).toBe('買い物リスト');
    expect(memo.items).toEqual([]);
    expect(memo.locations).toEqual([]);
    expect(memo.isCompleted).toBe(false);
    expect(memo.id).toBeTruthy();
  });

  it('作成したメモがストアに追加される', () => {
    useMemoStore.getState().addMemo('テストメモ');
    const { memos } = useMemoStore.getState();

    expect(memos).toHaveLength(1);
    expect(memos[0].title).toBe('テストメモ');
  });

  it('複数のメモを作成できる', () => {
    useMemoStore.getState().addMemo('メモ1');
    useMemoStore.getState().addMemo('メモ2');
    useMemoStore.getState().addMemo('メモ3');

    const { memos } = useMemoStore.getState();
    expect(memos).toHaveLength(3);
  });

  it('最新のメモが先頭に来る', () => {
    useMemoStore.getState().addMemo('古いメモ');
    useMemoStore.getState().addMemo('新しいメモ');

    const { memos } = useMemoStore.getState();
    expect(memos[0].title).toBe('新しいメモ');
  });

  it('メモを更新できる', () => {
    const memo = useMemoStore.getState().addMemo('元のタイトル');
    useMemoStore.getState().updateMemo(memo.id, { title: '変更後のタイトル' });

    const updated = useMemoStore.getState().getMemoById(memo.id);
    expect(updated?.title).toBe('変更後のタイトル');
  });

  it('メモを完了状態にできる', () => {
    const memo = useMemoStore.getState().addMemo('完了テスト');
    useMemoStore.getState().updateMemo(memo.id, { isCompleted: true });

    const updated = useMemoStore.getState().getMemoById(memo.id);
    expect(updated?.isCompleted).toBe(true);
  });

  it('メモを削除できる', () => {
    const memo = useMemoStore.getState().addMemo('削除するメモ');
    useMemoStore.getState().deleteMemo(memo.id);

    const { memos } = useMemoStore.getState();
    expect(memos).toHaveLength(0);
  });

  it('存在しない ID で getMemoById は undefined を返す', () => {
    const result = useMemoStore.getState().getMemoById('non-existent-id');
    expect(result).toBeUndefined();
  });
});

// ============================================================
// ShoppingItem CRUD
// ============================================================
describe('useMemoStore - ShoppingItem CRUD', () => {
  let memoId: string;

  beforeEach(() => {
    const memo = useMemoStore.getState().addMemo('テストメモ');
    memoId = memo.id;
  });

  it('アイテムを追加できる', () => {
    useMemoStore.getState().addItem(memoId, '牛乳');

    const memo = useMemoStore.getState().getMemoById(memoId);
    expect(memo?.items).toHaveLength(1);
    expect(memo?.items[0].name).toBe('牛乳');
    expect(memo?.items[0].isChecked).toBe(false);
  });

  it('複数アイテムを追加できる', () => {
    useMemoStore.getState().addItem(memoId, '牛乳');
    useMemoStore.getState().addItem(memoId, '卵');
    useMemoStore.getState().addItem(memoId, 'パン');

    const memo = useMemoStore.getState().getMemoById(memoId);
    expect(memo?.items).toHaveLength(3);
  });

  it('アイテムをチェック/アンチェックできる', () => {
    useMemoStore.getState().addItem(memoId, '牛乳');
    const memo = useMemoStore.getState().getMemoById(memoId)!;
    const itemId = memo.items[0].id;

    useMemoStore.getState().toggleItem(memoId, itemId);
    expect(useMemoStore.getState().getMemoById(memoId)?.items[0].isChecked).toBe(true);

    useMemoStore.getState().toggleItem(memoId, itemId);
    expect(useMemoStore.getState().getMemoById(memoId)?.items[0].isChecked).toBe(false);
  });

  it('アイテム名を更新できる', () => {
    useMemoStore.getState().addItem(memoId, '牛乳');
    const itemId = useMemoStore.getState().getMemoById(memoId)!.items[0].id;

    useMemoStore.getState().updateItem(memoId, itemId, { name: '低脂肪牛乳' });
    const updated = useMemoStore.getState().getMemoById(memoId);
    expect(updated?.items[0].name).toBe('低脂肪牛乳');
  });

  it('アイテムを削除できる', () => {
    useMemoStore.getState().addItem(memoId, '牛乳');
    useMemoStore.getState().addItem(memoId, '卵');
    const itemId = useMemoStore.getState().getMemoById(memoId)!.items[0].id;

    useMemoStore.getState().deleteItem(memoId, itemId);
    const memo = useMemoStore.getState().getMemoById(memoId);
    expect(memo?.items).toHaveLength(1);
    expect(memo?.items[0].name).toBe('卵');
  });
});

// ============================================================
// Location CRUD
// ============================================================
describe('useMemoStore - Location CRUD', () => {
  let memoId: string;

  const sampleLocation = {
    label: 'スーパー三和',
    latitude: 35.6812,
    longitude: 139.7671,
    radius: 200,
  };

  beforeEach(() => {
    const memo = useMemoStore.getState().addMemo('場所テスト');
    memoId = memo.id;
  });

  it('場所を追加できる', () => {
    const location = useMemoStore.getState().addLocation(memoId, sampleLocation);

    expect(location).not.toBeNull();
    expect(location?.label).toBe('スーパー三和');
    expect(location?.id).toBeTruthy();
  });

  it('場所がメモに紐づく', () => {
    useMemoStore.getState().addLocation(memoId, sampleLocation);

    const memo = useMemoStore.getState().getMemoById(memoId);
    expect(memo?.locations).toHaveLength(1);
    expect(memo?.locations[0].label).toBe('スーパー三和');
  });

  it('最大3か所まで追加できる', () => {
    useMemoStore.getState().addLocation(memoId, { ...sampleLocation, label: '場所1' });
    useMemoStore.getState().addLocation(memoId, { ...sampleLocation, label: '場所2' });
    const result3 = useMemoStore.getState().addLocation(memoId, { ...sampleLocation, label: '場所3' });

    expect(result3).not.toBeNull();
    const memo = useMemoStore.getState().getMemoById(memoId);
    expect(memo?.locations).toHaveLength(3);
  });

  it('4か所目の追加は null を返す', () => {
    useMemoStore.getState().addLocation(memoId, { ...sampleLocation, label: '場所1' });
    useMemoStore.getState().addLocation(memoId, { ...sampleLocation, label: '場所2' });
    useMemoStore.getState().addLocation(memoId, { ...sampleLocation, label: '場所3' });

    const result = useMemoStore.getState().addLocation(memoId, { ...sampleLocation, label: '場所4' });
    expect(result).toBeNull();

    const memo = useMemoStore.getState().getMemoById(memoId);
    expect(memo?.locations).toHaveLength(3); // 3を超えない
  });

  it('場所の半径を更新できる', () => {
    useMemoStore.getState().addLocation(memoId, sampleLocation);
    const locationId = useMemoStore.getState().getMemoById(memoId)!.locations[0].id;

    useMemoStore.getState().updateLocation(memoId, locationId, { radius: 500 });
    const updated = useMemoStore.getState().getMemoById(memoId);
    expect(updated?.locations[0].radius).toBe(500);
  });

  it('場所を削除できる', () => {
    useMemoStore.getState().addLocation(memoId, { ...sampleLocation, label: '場所1' });
    useMemoStore.getState().addLocation(memoId, { ...sampleLocation, label: '場所2' });
    const locationId = useMemoStore.getState().getMemoById(memoId)!.locations[0].id;

    useMemoStore.getState().deleteLocation(memoId, locationId);
    const memo = useMemoStore.getState().getMemoById(memoId);
    expect(memo?.locations).toHaveLength(1);
    expect(memo?.locations[0].label).toBe('場所2');
  });
});

// ============================================================
// SettingsStore
// ============================================================
describe('useSettingsStore', () => {
  it('デフォルト半径は 200m', () => {
    expect(useSettingsStore.getState().defaultRadius).toBe(200);
  });

  it('半径を変更できる', () => {
    useSettingsStore.getState().setDefaultRadius(500);
    expect(useSettingsStore.getState().defaultRadius).toBe(500);
  });
});
