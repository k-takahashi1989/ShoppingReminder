import { useState, useEffect, useRef } from 'react';
import { useSettingsStore } from '../store/memoStore';
import { TargetLayout } from '../components/TutorialTooltip';

type AnyRef = React.MutableRefObject<any> | React.RefObject<any>;

/**
 * チュートリアル管理フック
 * @param key        チュートリアル識別キー (例: 'memoEdit', 'memoDetail')
 * @param totalSteps ステップ総数
 * @param refs       各ステップで spotlight させる ref 配列
 */
export function useTutorial(key: string, totalSteps: number, refs: AnyRef[], delay = 400) {
  const seenTutorials = useSettingsStore(s => s.seenTutorials);
  const markTutorialSeen = useSettingsStore(s => s.markTutorialSeen);

  const [step, setStep] = useState(0);
  const [targetLayout, setTargetLayout] = useState<TargetLayout | null>(null);
  const mounted = useRef(true);

  const isActive = !seenTutorials.includes(key);

  // ステップが変わったら対象の View を測定する
  useEffect(() => {
    if (!isActive) return;
    const ref = refs[step];
    if (!ref?.current) return;

    const timer = setTimeout(() => {
      ref.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
        if (mounted.current) {
          setTargetLayout({ x, y, width, height });
        }
      });
    }, delay);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, isActive]);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const advance = () => {
    if (step >= totalSteps - 1) {
      markTutorialSeen(key);
    } else {
      setTargetLayout(null); // 吹き出しをいったん消してからステップアップ
      setStep(s => s + 1);
    }
  };

  const skip = () => {
    markTutorialSeen(key);
  };

  return {
    step,
    isActive,
    targetLayout,
    advance,
    skip,
  };
}
