import { useEffect, useRef } from 'react';
import {
  InterstitialAd,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';

// リリース前に本番IDに差し替える:
// const AD_UNIT_ID = 'ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ';
const AD_UNIT_ID = TestIds.INTERSTITIAL;

/**
 * インタースティシャル広告フック
 * showIfReady(callback?) を呼ぶと広告を表示し、閉じたあとに callback を実行する。
 * 広告がロードされていない場合は即座に callback を実行して false を返す。
 */
export function useInterstitialAd() {
  const adRef = useRef<InterstitialAd | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    const ad = InterstitialAd.createForAdRequest(AD_UNIT_ID);
    adRef.current = ad;

    const unsubLoad = ad.addAdEventListener(AdEventType.LOADED, () => {
      loadedRef.current = true;
    });
    const unsubClose = ad.addAdEventListener(AdEventType.CLOSED, () => {
      loadedRef.current = false;
      ad.load(); // 次回用にプリロード
    });

    ad.load();

    return () => {
      unsubLoad();
      unsubClose();
    };
  }, []);

  /**
   * 広告が準備できていれば表示する。
   * @param callback 広告を閉じた後（または広告なしの場合は即座）に実行
   * @returns 広告を表示した場合 true、ロード未完了の場合 false
   */
  const showIfReady = (callback?: () => void): boolean => {
    if (loadedRef.current && adRef.current) {
      if (callback) {
        const unsub = adRef.current.addAdEventListener(AdEventType.CLOSED, () => {
          unsub();
          callback();
        });
      }
      adRef.current.show();
      return true;
    }
    callback?.();
    return false;
  };

  return { showIfReady };
}
