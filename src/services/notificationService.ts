import notifee, {
  AndroidImportance,
  AndroidStyle,
  EventType,
} from '@notifee/react-native';

const CHANNEL_ID = 'shopping-reminder';

/**
 * アプリ起動時に通知チャンネルを作成する (Android 必須)
 */
export async function createNotificationChannel(): Promise<void> {
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'ショッピングリマインダー',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
  });
}

/**
 * メモの到着通知を表示する
 */
export async function showArrivalNotification(params: {
  memoId: string;
  memoTitle: string;
  locationLabel: string;
  itemCount: number;
}): Promise<void> {
  const { memoId, memoTitle, locationLabel, itemCount } = params;

  await notifee.displayNotification({
    id: `arrival-${memoId}`,
    title: `📍 ${locationLabel} に近づいています`,
    body: `「${memoTitle}」の買い物リスト (${itemCount}点) を確認しましょう`,
    // data はトップレベルに置く (notifee 仕様)
    data: { memoId },
    android: {
      channelId: CHANNEL_ID,
      importance: AndroidImportance.HIGH,
      style: {
        type: AndroidStyle.BIGTEXT,
        text: `「${memoTitle}」の買い物リスト (${itemCount}点) を確認しましょう\n\nタップしてメモを開く`,
      },
      pressAction: {
        id: 'open_memo',
        launchActivity: 'com.ktakahashi.shoppingreminder.MainActivity',
      },
      smallIcon: 'ic_notification',
      color: '#4CAF50',
    },
  });
}

/**
 * バックグラウンドの通知イベントリスナーを登録する
 * (index.js で呼び出す)
 */
export function registerBackgroundNotificationHandler(
  onOpenMemo: (memoId: string) => void,
): void {
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    if (type === EventType.PRESS && detail.notification?.data) {
      const memoId = detail.notification.data.memoId as string;
      if (memoId) onOpenMemo(memoId);
    }
  });
}

/**
 * フォアグラウンドの通知イベントリスナーを登録する
 * (NavigationContainer 内で呼び出す)
 */
export function useForegroundNotificationHandler(
  onOpenMemo: (memoId: string) => void,
): void {
  notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS && detail.notification?.data) {
      const memoId = detail.notification.data.memoId as string;
      if (memoId) onOpenMemo(memoId);
    }
  });
}
