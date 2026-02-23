/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { registerBackgroundNotificationHandler } from './src/services/notificationService';

// バックグラウンドで通知をタップしたときの処理
// (起動前なのでナビゲーションは使えない → 起動後に initial route で処理)
registerBackgroundNotificationHandler((_memoId) => {
  // アプリが起動したときに App 内でディープリンクを処理する
});

AppRegistry.registerComponent(appName, () => App);
