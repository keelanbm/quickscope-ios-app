import { useCallback, useRef } from "react";
import { Animated, type ViewStyle } from "react-native";
import * as Haptics from "expo-haptics";

type AnimatedPressOptions = {
  scaleTo?: number;
  hapticStyle?: Haptics.ImpactFeedbackStyle;
  disabled?: boolean;
};

type AnimatedPressResult = {
  animatedStyle: { transform: { scale: Animated.Value }[] };
  onPressIn: () => void;
  onPressOut: () => void;
};

export function useAnimatedPress(
  options?: AnimatedPressOptions
): AnimatedPressResult {
  const {
    scaleTo = 0.97,
    hapticStyle = Haptics.ImpactFeedbackStyle.Light,
    disabled = false,
  } = options ?? {};

  const scale = useRef(new Animated.Value(1)).current;

  const animatedStyle = { transform: [{ scale }] };

  const onPressIn = useCallback(() => {
    if (disabled) return;
    Animated.spring(scale, {
      toValue: scaleTo,
      damping: 15,
      stiffness: 150,
      useNativeDriver: true,
    }).start();
    void Haptics.impactAsync(hapticStyle);
  }, [disabled, scaleTo, hapticStyle, scale]);

  const onPressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      damping: 15,
      stiffness: 150,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  return { animatedStyle, onPressIn, onPressOut };
}
