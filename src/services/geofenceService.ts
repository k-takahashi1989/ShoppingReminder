/**
 * Geofence Service
 *
 * react-native-background-actions でバックグラウンドでも動作し続け、
 * 定期的に位置情報を取得してジオフェンス侵入を検知する。
 * 侵入を検知したら notifee でプッシュ通知を発火する。
 */
import BackgroundService from 'react-native-background-actions';
import Geolocation from 'react-native-geolocation-service';
import { Memo } from '../types';
import { haversineDistance } from '../utils/helpers';
import { showArrivalNotification } from './notificationService';
import { storage } from '../storage/mmkvStorage';

// 通知を送ったジオフェンスのIDをキャッシュ (再通知防止)
const notifiedGeofences = new Set<string>();

// MMKV への通知済みキャッシュ保存キー
const NOTIFIED_CACHE_KEY = 'notified_geofences';

const POLL_INTERVAL_MS = 60 * 1000; // 1分ごとに位置確認

// ============================================================
// 位置情報の取得
// ============================================================
function getCurrentPosition(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      err => reject(err),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 30000 },
    );
  });
}

// ============================================================
// ジオフェンスのチェック
// ============================================================
function loadMemos(): Memo[] {
  try {
    const raw = storage.getString('memos');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // zustand persist は { state: { memos: [...] } } の形式
    return parsed?.state?.memos ?? [];
  } catch {
    return [];
  }
}

function loadNotifiedCache(): void {
  try {
    const raw = storage.getString(NOTIFIED_CACHE_KEY);
    if (!raw) return;
    const arr: string[] = JSON.parse(raw);
    arr.forEach(id => notifiedGeofences.add(id));
  } catch {}
}

function saveNotifiedCache(): void {
  storage.set(NOTIFIED_CACHE_KEY, JSON.stringify([...notifiedGeofences]));
}

async function checkGeofences(
  lat: number,
  lon: number,
): Promise<void> {
  const memos = loadMemos();

  for (const memo of memos) {
    if (memo.isCompleted) continue;

    for (const location of memo.locations) {
      const cacheKey = `${memo.id}:${location.id}`;

      // 既に通知済みならスキップ
      if (notifiedGeofences.has(cacheKey)) continue;

      const distance = haversineDistance(lat, lon, location.latitude, location.longitude);

      if (distance <= location.radius) {
        notifiedGeofences.add(cacheKey);
        saveNotifiedCache();

        await showArrivalNotification({
          memoId: memo.id,
          memoTitle: memo.title,
          locationLabel: location.label,
          itemCount: memo.items.filter(it => !it.isChecked).length,
        });
      }
    }
  }
}

// ============================================================
// バックグラウンドタスク本体
// ============================================================
const backgroundTask = async (): Promise<void> => {
  loadNotifiedCache();

  // eslint-disable-next-line no-constant-condition
  while (BackgroundService.isRunning()) {
    try {
      const pos = await getCurrentPosition();
      await checkGeofences(pos.latitude, pos.longitude);
    } catch {
      // 位置情報取得失敗は無視して継続
    }
    await sleep(POLL_INTERVAL_MS);
  }
};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
// 公開 API
// ============================================================
export async function startGeofenceMonitoring(): Promise<void> {
  if (BackgroundService.isRunning()) return;

  await BackgroundService.start(backgroundTask, {
    taskName: 'ShoppingReminderGeofence',
    taskTitle: 'ショッピングリマインダー',
    taskDesc: '登録した場所に近づくとお知らせします',
    taskIcon: {
      name: 'ic_notification',
      type: 'drawable',
    },
    color: '#4CAF50',
    linkingURI: 'shoppingreminder://open',
    parameters: {},
  });
}

export async function stopGeofenceMonitoring(): Promise<void> {
  if (BackgroundService.isRunning()) {
    await BackgroundService.stop();
  }
}

/**
 * メモを完了にしたとき、そのメモのジオフェンスを通知済みキャッシュから削除する
 * (次回有効化したときに再通知されるようにする)
 */
export function clearMemoFromCache(memoId: string): void {
  const keysToDelete = [...notifiedGeofences].filter(k => k.startsWith(`${memoId}:`));
  keysToDelete.forEach(k => notifiedGeofences.delete(k));
  saveNotifiedCache();
}
