/**
 * App スモークテスト
 * @format
 */

// ナビゲーションのネイティブ依存をモック
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
    useNavigation: jest.fn(() => ({ navigate: jest.fn(), goBack: jest.fn() })),
    useRoute: jest.fn(() => ({ params: {} })),
  };
});
jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: jest.fn(() => ({
    Navigator: ({ children }: { children: React.ReactNode }) => children,
    Screen: ({ component: Comp }: { component: React.ComponentType }) => null,
  })),
}));
jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: jest.fn(() => ({
    Navigator: ({ children }: { children: React.ReactNode }) => children,
    Screen: () => null,
  })),
}));
jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
}));
jest.mock('react-native-gesture-handler', () => ({}));

// サービスのモック (副作用を防ぐ)
jest.mock('../src/services/notificationService', () => ({
  createNotificationChannel: jest.fn().mockResolvedValue(undefined),
  registerBackgroundNotificationHandler: jest.fn(),
  useForegroundNotificationHandler: jest.fn(),
}));
jest.mock('../src/services/geofenceService', () => ({
  startGeofenceMonitoring: jest.fn().mockResolvedValue(undefined),
  stopGeofenceMonitoring: jest.fn().mockResolvedValue(undefined),
  clearMemoFromCache: jest.fn(),
}));

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

test('App が例外なくレンダーされる', async () => {
  await ReactTestRenderer.act(async () => {
    ReactTestRenderer.create(<App />);
  });
});
