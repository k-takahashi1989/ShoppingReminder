import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useInterstitialAd } from '../hooks/useInterstitialAd';
import { useSettingsStore } from '../store/memoStore';
import { useTranslation } from 'react-i18next';

import { RootStackParamList, MainTabParamList } from '../types';
import MemoListScreen from '../screens/MemoListScreen';
import MemoDetailScreen from '../screens/MemoDetailScreen';
import MemoEditScreen from '../screens/MemoEditScreen';
import LocationPickerScreen from '../screens/LocationPickerScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs(): React.JSX.Element {
  const { t } = useTranslation();
  const { showIfReady } = useInterstitialAd();
  const totalMemoRegistrations = useSettingsStore(s => s.totalMemoRegistrations);

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: '#9E9E9E',
        headerShown: false,
      }}>
      <Tab.Screen
        name="MemoList"
        component={MemoListScreen}
        options={{
          tabBarLabel: t('nav.tabList'),
          tabBarIcon: ({ color, size }) => (
            <Icon name="shopping-cart" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        listeners={{
          tabPress: () => {
            if (totalMemoRegistrations >= 5) {
              showIfReady();
            }
          },
        }}
        options={{
          tabBarLabel: t('nav.tabSettings'),
          tabBarIcon: ({ color, size }) => (
            <Icon name="settings" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator(): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerTintColor: '#4CAF50',
          headerBackTitle: t('nav.backButton'),
        }}>
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MemoDetail"
          component={MemoDetailScreen}
          options={{ title: t('nav.memoDetail') }}
        />
        <Stack.Screen
          name="MemoEdit"
          component={MemoEditScreen}
          options={({ route }) => ({
            title: route.params?.memoId ? t('nav.memoEditExisting') : t('nav.memoEditNew'),
          })}
        />
        <Stack.Screen
          name="LocationPicker"
          component={LocationPickerScreen}
          options={{ title: t('nav.locationPicker') }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
