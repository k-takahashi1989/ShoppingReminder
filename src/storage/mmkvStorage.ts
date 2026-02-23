import { createMMKV, MMKV } from 'react-native-mmkv';
import { StateStorage } from 'zustand/middleware';

export const storage: MMKV = createMMKV({ id: 'shopping-reminder-store' });

/**
 * Zustand persist ミドルウェア向けの MMKV storage adapter
 */
export const mmkvStorage: StateStorage = {
  getItem: (name: string): string | null => {
    const value = storage.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string): void => {
    storage.set(name, value);
  },
  removeItem: (name: string): void => {
    storage.remove(name);
  },
};
