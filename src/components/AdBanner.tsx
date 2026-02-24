import React from 'react';
import { Platform } from 'react-native';
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from 'react-native-google-mobile-ads';
import Config from 'react-native-config';

const AD_UNIT_ID = __DEV__
  ? TestIds.ADAPTIVE_BANNER
  : (Config.ADMOB_BANNER_ID || TestIds.ADAPTIVE_BANNER);

export default function AdBanner(): React.JSX.Element | null {
  if (Platform.OS !== 'android') return null;
  return (
    <BannerAd
      unitId={AD_UNIT_ID}
      size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      onAdFailedToLoad={(error) => __DEV__ && console.warn('AdBanner failed:', error)}
    />
  );
}
