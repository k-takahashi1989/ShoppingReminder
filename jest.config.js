module.exports = {
  preset: 'react-native',
  moduleNameMapper: {
    // ネイティブモジュールのモック
    'react-native-mmkv': '<rootDir>/__mocks__/react-native-mmkv.js',
    '@notifee/react-native': '<rootDir>/__mocks__/@notifee/react-native.js',
    'react-native-permissions': '<rootDir>/__mocks__/react-native-permissions.js',
    'react-native-background-actions': '<rootDir>/__mocks__/react-native-background-actions.js',
    'react-native-geolocation-service': '<rootDir>/__mocks__/react-native-geolocation-service.js',
    'react-native-config': '<rootDir>/__mocks__/react-native-config.js',
    'react-native-maps': '<rootDir>/__mocks__/react-native-maps.js',
    'react-native-vector-icons/(.*)': '<rootDir>/__mocks__/react-native-vector-icons.js',
    'react-native-google-places-autocomplete': '<rootDir>/__mocks__/react-native-google-places-autocomplete.js',
    '@react-native-community/slider': '<rootDir>/__mocks__/@react-native-community/slider.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-safe-area-context|react-native-screens|react-native-gesture-handler)/)',
  ],
};
