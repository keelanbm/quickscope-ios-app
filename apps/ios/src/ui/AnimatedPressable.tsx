import { type PropsWithChildren } from "react";
import { type PressableProps, type ViewStyle } from "react-native";
import Animated, { type AnimatedStyle } from "react-native-reanimated";
import { Pressable } from "react-native";
import * as Haptics from "expo-haptics";

import { useAnimatedPress } from "@/src/hooks/useAnimatedPress";

type AnimatedPressableProps = PropsWithChildren<
  PressableProps & {
    scaleTo?: number;
    hapticStyle?: Haptics.ImpactFeedbackStyle;
    style?: ViewStyle | ViewStyle[] | AnimatedStyle<ViewStyle>;
  }
>;

const AnimatedPressableView = Animated.createAnimatedComponent(Pressable);

export function AnimatedPressable({
  children,
  scaleTo,
  hapticStyle,
  disabled,
  onPressIn: externalPressIn,
  onPressOut: externalPressOut,
  style,
  ...rest
}: AnimatedPressableProps) {
  const { animatedStyle, onPressIn, onPressOut } = useAnimatedPress({
    scaleTo,
    hapticStyle,
    disabled: !!disabled,
  });

  return (
    <AnimatedPressableView
      {...rest}
      disabled={disabled}
      style={[style, animatedStyle]}
      onPressIn={(e) => {
        onPressIn();
        externalPressIn?.(e);
      }}
      onPressOut={(e) => {
        onPressOut();
        externalPressOut?.(e);
      }}
    >
      {children}
    </AnimatedPressableView>
  );
}
