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

// 現在「半径内」にあるジオフェンスのIDをキャッシュ（進入/退出検出用）
const insideGeofences = new Set<string>();

// MMKV への「半径内」キャッシュ保存キー
const INSIDE_CACHE_KEY = 'inside_geofences';

const POLL_INTERVAL_MS = 15 * 1000; // 15秒ごとに位置確認

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

function loadInsideCache(): void {
  try {
    const raw = storage.getString(INSIDE_CACHE_KEY);
    if (!raw) return;
    const arr: string[] = JSON.parse(raw);
    arr.forEach(id => insideGeofences.add(id));
  } catch {}
}

function saveInsideCache(): void {
  storage.set(INSIDE_CACHE_KEY, JSON.stringify([...insideGeofences]));
}

async function checkGeofences(
  lat: number,
  lon: number,
): Promise<void> {
  const memos = loadMemos();
  let cacheChanged = false;

  for (const memo of memos) {
    if (!memo.notificationEnabled) continue;

    for (const location of memo.locations) {
      const cacheKey = `${memo.id}:${location.id}`;
      const distance = haversineDistance(lat, lon, location.latitude, location.longitude);
      const isInside = distance <= location.radius;
      const wasInside = insideGeofences.has(cacheKey);

      if (isInside && !wasInside) {
        // 進入: 通知を送る
        insideGeofences.add(cacheKey);
        cacheChanged = true;
        await showArrivalNotification({
          memoId: memo.id,
          memoTitle: memo.title,
          locationLabel: location.label,
          itemCount: memo.items.filter(it => !it.isChecked).length,
        });
      } else if (!isInside && wasInside) {
        // 退出: 次回進入で再通知できるよう削除
        insideGeofences.delete(cacheKey);
        cacheChanged = true;
      }
    }
  }

  if (cacheChanged) saveInsideCache();
}

// ============================================================
// バックグラウンドタスク本体
// ============================================================
const backgroundTask = async (): Promise<void> => {
  loadInsideCache();

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
export async function startGeofenceMonitoring(): Promise<boolean> {
  if (BackgroundService.isRunning()) return true;

  try {
    await BackgroundService.start(backgroundTask, {
      taskName: 'YorimichiGeofence',
      taskTitle: 'Yorimichi',
      taskDesc: '登録した場所に近づくとお知らせします',
      taskIcon: {
        name: 'ic_notification',
        type: 'drawable',
      },
      color: '#4CAF50',
      linkingURI: 'shoppingreminder://open',
      parameters: {},
    });
    return true;
  } catch (error) {
    __DEV__ && console.warn('startGeofenceMonitoring failed:', error);
    return false;
  }
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
  const keysToDelete = [...insideGeofences].filter(k => k.startsWith(`${memoId}:`));
  keysToDelete.forEach(k => insideGeofences.delete(k));
  saveInsideCache();
}
