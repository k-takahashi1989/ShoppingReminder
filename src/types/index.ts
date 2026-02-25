// ============================================================
// データモデルの型定義
// ============================================================

export interface ShoppingItem {
  id: string;
  name: string;
  isChecked: boolean;
  checkedAt?: number;
}

export interface MemoLocation {
  id: string;
  label: string;        // ユーザーが付けた名前 (例: "スーパー三和")
  latitude: number;
  longitude: number;
  radius: number;       // ジオフェンス半径 (メートル)
  address?: string;     // 逆ジオコーディングで取得した住所 (町名まで)
}

export interface Memo {
  id: string;
  title: string;
  items: ShoppingItem[];
  locations: MemoLocation[];   // 最大3か所
  notificationEnabled: boolean;
  createdAt: number;           // Unix タイムスタンプ (ms)
  updatedAt: number;
}

// ============================================================
// ナビゲーション パラメータ型
// ============================================================

export type RootStackParamList = {
  MainTabs: undefined;
  MemoDetail: { memoId: string };
  MemoEdit: { memoId?: string };                   // undefined = 新規作成
  LocationPicker: {
    memoId: string;
    existingLocationId?: string;                   // undefined = 新規追加
  };
};

export type MainTabParamList = {
  MemoList: undefined;
  Settings: undefined;
};
