/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { registerBackgroundNotificationHandler } from './src/services/notificationService';
import { backgroundTask } from './src/services/geofenceService';

// react-native-background-actions は Android でタスクキーに "1" を付加する
// AppRegistry に先行登録しないと "No task registered for key YorimichiGeofence1" エラーになる
AppRegistry.registerHeadlessTask('YorimichiGeofence1', () => backgroundTask);

// バックグラウンドで通知をタップしたときの処理
// (起動前なのでナビゲーションは使えない → 起動後に initial route で処理)
registerBackgroundNotificationHandler((_memoId) => {
  // アプリが起動したときに App 内でディープリンクを処理する
});

AppRegistry.registerComponent(appName, () => App);
