import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const SPOT_PAD = 10; // スポットライトのパディング
const BUBBLE_H = 16; // 吹き出しとスポットの間隔

export interface TargetLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Props {
  visible: boolean;
  targetLayout: TargetLayout | null;
  text: string;
  stepLabel: string;
  isLast: boolean;
  nextLabel: string;
  skipLabel: string;
  onNext: () => void;
  onSkip: () => void;
}

export default function TutorialTooltip({
  visible,
  targetLayout,
  text,
  stepLabel,
  isLast,
  nextLabel,
  skipLabel,
  onNext,
  onSkip,
}: Props): React.JSX.Element | null {
  if (!visible || !targetLayout) return null;

  // statusBarTranslucent Modal の座標系はステータスバー上端から始まるが
  // measureInWindow はステータスバーを除いたアプリ窓からの座標を返すため
  // Android のステータスバー高さ分だけオフセットを補正する
  const statusBarOffset = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;

  const sx = Math.max(targetLayout.x - SPOT_PAD, 0);
  const sy = Math.max(targetLayout.y + statusBarOffset - SPOT_PAD, 0);
  const sw = Math.min(targetLayout.width + SPOT_PAD * 2, SCREEN_W);
  const sh = targetLayout.height + SPOT_PAD * 2;

  // ターゲットが画面下半分なら吹き出しは上に、そうでなければ下に
  const showAbove = sy + sh > SCREEN_H * 0.55;

  // 矢印の水平位置（吹き出し内のオフセット）
  const bubbleLeft = 16;
  const bubbleRight = 16;
  const bubbleWidth = SCREEN_W - bubbleLeft - bubbleRight;
  const arrowX = Math.min(
    Math.max(sx + sw / 2 - bubbleLeft - 8, 12),
    bubbleWidth - 28,
  );

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      {/* スポットライト: 4枚のオーバーレイ */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* 上 */}
        <View style={[styles.overlay, { top: 0, left: 0, right: 0, height: sy }]} />
        {/* 下 */}
        <View style={[styles.overlay, { top: sy + sh, left: 0, right: 0, bottom: 0 }]} />
        {/* 左 */}
        <View style={[styles.overlay, { top: sy, left: 0, width: sx, height: sh }]} />
        {/* 右 */}
        <View style={[styles.overlay, { top: sy, left: sx + sw, right: 0, height: sh }]} />
        {/* スポット枠線 */}
        <View
          style={[
            styles.spotBorder,
            { top: sy, left: sx, width: sw, height: sh },
          ]}
        />
      </View>

      {/* 吹き出し本体 */}
      <View
        style={[
          styles.bubble,
          { left: bubbleLeft, right: bubbleRight },
          showAbove
            ? { bottom: SCREEN_H - sy + BUBBLE_H }
            : { top: sy + sh + BUBBLE_H },
        ]}>
        {/* 上向き矢印（吹き出しが下にある場合） */}
        {!showAbove && (
          <View style={[styles.arrowUp, { left: arrowX }]} />
        )}

        <View style={styles.bubbleInner}>
          <View style={styles.headerRow}>
            <Text style={styles.stepLabel}>{stepLabel}</Text>
            <TouchableOpacity onPress={onSkip} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.skipText}>{skipLabel}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.bodyText}>{text}</Text>
          <TouchableOpacity style={styles.nextBtn} onPress={onNext}>
            <Text style={styles.nextBtnText}>{isLast ? nextLabel : `${nextLabel} →`}</Text>
          </TouchableOpacity>
        </View>

        {/* 下向き矢印（吹き出しが上にある場合） */}
        {showAbove && (
          <View style={[styles.arrowDown, { left: arrowX }]} />
        )}
      </View>
    </Modal>
  );
}

const ARROW_SIZE = 10;

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  spotBorder: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 8,
  },
  bubble: {
    position: 'absolute',
  },
  arrowUp: {
    position: 'absolute',
    top: -ARROW_SIZE,
    width: 0,
    height: 0,
    borderLeftWidth: ARROW_SIZE,
    borderRightWidth: ARROW_SIZE,
    borderBottomWidth: ARROW_SIZE,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#fff',
  },
  arrowDown: {
    position: 'absolute',
    bottom: -ARROW_SIZE,
    width: 0,
    height: 0,
    borderLeftWidth: ARROW_SIZE,
    borderRightWidth: ARROW_SIZE,
    borderTopWidth: ARROW_SIZE,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#fff',
  },
  bubbleInner: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4CAF50',
    letterSpacing: 0.5,
  },
  skipText: {
    fontSize: 13,
    color: '#9E9E9E',
  },
  bodyText: {
    fontSize: 15,
    color: '#212121',
    lineHeight: 22,
    marginBottom: 14,
  },
  nextBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  nextBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
