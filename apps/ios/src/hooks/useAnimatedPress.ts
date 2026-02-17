import { useCallback } from "react";
import * as Haptics from "expo-haptics";
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  type AnimatedStyle,
} from "react-native-reanimated";
import type { ViewStyle } from "react-native";

type AnimatedPressOptions = {
  scaleTo?: number;
  hapticStyle?: Haptics.ImpactFeedbackStyle;
  disabled?: boolean;
};

type AnimatedPressResult = {
  animatedStyle: AnimatedStyle<ViewStyle>;
  onPressIn: () => void;
  onPressOut: () => void;
};

const SPRING_CONFIG = {
  damping: 15,
  stiffness: 150,
};

export function useAnimatedPress(
  options?: AnimatedPressOptions
): AnimatedPressResult {
  const {
    scaleTo = 0.97,
    hapticStyle = Haptics.ImpactFeedbackStyle.Light,
    disabled = false,
  } = options ?? {};

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = useCallback(() => {
    if (disabled) return;
    scale.value = withSpring(scaleTo, SPRING_CONFIG);
    void Haptics.impactAsync(hapticStyle);
  }, [disabled, scaleTo, hapticStyle, scale]);

  const onPressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_CONFIG);
  }, [scale]);

  return { animatedStyle, onPressIn, onPressOut };
}
