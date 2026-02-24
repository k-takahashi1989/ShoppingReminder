import React from 'react';
import { Platform } from 'react-native';
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from 'react-native-google-mobile-ads';

// リリース前に本番IDに差し替える:
// const AD_UNIT_ID = 'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY';
const AD_UNIT_ID = TestIds.ADAPTIVE_BANNER;

export default function AdBanner(): React.JSX.Element | null {
  if (Platform.OS !== 'android') return null;
  return (
    <BannerAd
      unitId={AD_UNIT_ID}
      size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
    />
  );
}
