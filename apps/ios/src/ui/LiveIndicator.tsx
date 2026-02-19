import { useEffect, useRef } from "react";

import { Animated, StyleSheet, Text, View } from "react-native";

import { qsColors } from "@/src/theme/tokens";

type LiveIndicatorProps = {
  label?: string;
};

export function LiveIndicator({ label = "Live" }: LiveIndicatorProps) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.3,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.dot, { transform: [{ scale: pulse }] }]} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: qsColors.buyGreen,
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
    color: qsColors.buyGreen,
  },
});
