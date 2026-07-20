import { useEffect } from 'react';
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

/**
 * The five named Arcane animations (SPEC §11a), as reanimated hooks.
 * Each returns an animated style to spread onto an Animated.View.
 */

/** popIn — badge pop with cubic-bezier overshoot. Plays once on mount. */
export function usePopIn(delayMs = 0) {
  const scale = useSharedValue(0);
  useEffect(() => {
    scale.value = withDelay(
      delayMs,
      withTiming(1, { duration: 420, easing: Easing.bezier(0.34, 1.56, 0.64, 1) })
    );
  }, [delayMs, scale]);
  return useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
}

/** floatUp — rising "+25 Revenue XP" chip; floats up and fades out. */
export function useFloatUp(active: boolean, distance = 48) {
  const t = useSharedValue(0);
  useEffect(() => {
    if (active) {
      t.value = 0;
      t.value = withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) });
    }
  }, [active, t]);
  return useAnimatedStyle(() => ({
    opacity: active ? 1 - t.value : 0,
    transform: [{ translateY: -distance * t.value }],
  }));
}

/** twinkle — sparkle opacity/scale shimmer, loops. */
export function useTwinkle(delayMs = 0) {
  const v = useSharedValue(0.3);
  useEffect(() => {
    v.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 500, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.3, { duration: 700, easing: Easing.inOut(Easing.quad) })
        ),
        -1
      )
    );
  }, [delayMs, v]);
  return useAnimatedStyle(() => ({
    opacity: v.value,
    transform: [{ scale: 0.7 + v.value * 0.3 }],
  }));
}

/** ringPulse — active-quest halo; scale+fade pulse, loops. */
export function useRingPulse() {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.out(Easing.quad) }),
      -1
    );
  }, [t]);
  return useAnimatedStyle(() => ({
    opacity: 0.6 * (1 - t.value),
    transform: [{ scale: 1 + 0.25 * t.value }],
  }));
}

/** shine — highlight sweep across a card; translateX loop with pauses. */
export function useShine(width: number) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.cubic) }),
        withDelay(1800, withTiming(0, { duration: 0 }))
      ),
      -1
    );
  }, [t]);
  return useAnimatedStyle(() => ({
    transform: [{ translateX: -width + 2 * width * t.value }],
  }));
}
