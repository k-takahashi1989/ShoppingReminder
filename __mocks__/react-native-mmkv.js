// react-native-mmkv v4 のインメモリモック
const store = new Map();

const mockMMKV = {
  id: 'test',
  size: 0,
  isReadOnly: false,
  set: jest.fn((key, value) => store.set(key, String(value))),
  getString: jest.fn((key) => store.get(key) ?? undefined),
  getBoolean: jest.fn((key) => {
    const v = store.get(key);
    return v !== undefined ? v === 'true' : undefined;
  }),
  getNumber: jest.fn((key) => {
    const v = store.get(key);
    return v !== undefined ? Number(v) : undefined;
  }),
  contains: jest.fn((key) => store.has(key)),
  remove: jest.fn((key) => store.delete(key)),
  getAllKeys: jest.fn(() => [...store.keys()]),
  clearAll: jest.fn(() => store.clear()),
  trim: jest.fn(),
  recrypt: jest.fn(),
  addOnValueChangedListener: jest.fn(() => ({ remove: jest.fn() })),
};

module.exports = {
  MMKV: jest.fn(() => mockMMKV),
  createMMKV: jest.fn(() => mockMMKV),
  useMMKV: jest.fn(() => mockMMKV),
  useMMKVString: jest.fn(() => [undefined, jest.fn()]),
  useMMKVBoolean: jest.fn(() => [undefined, jest.fn()]),
  useMMKVNumber: jest.fn(() => [undefined, jest.fn()]),
  useMMKVObject: jest.fn(() => [undefined, jest.fn()]),
};

// ストアをリセットできるようにエクスポート
module.exports.__resetStore = () => store.clear();
