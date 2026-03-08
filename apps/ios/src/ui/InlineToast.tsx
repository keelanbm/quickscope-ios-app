import { useEffect, useRef, useCallback, useState } from "react";
import { Animated, Easing, StyleSheet, Text } from "react-native";
import { qsColors, qsRadius, qsShadows, qsSpacing } from "@/src/theme/tokens";

type ToastVariant = "success" | "error" | "info";

type ToastMessage = {
  id: number;
  text: string;
  variant: ToastVariant;
};

type InlineToastController = {
  show: (text: string, variant?: ToastVariant) => void;
};

const VARIANT_COLORS: Record<ToastVariant, string> = {
  success: qsColors.success,
  error: qsColors.danger,
  info: qsColors.accent,
};

const AUTO_DISMISS_MS = 2000;

let toastId = 0;

export function useInlineToast(): [React.ReactNode, InlineToastController] {
  const [message, setMessage] = useState<ToastMessage | null>(null);
  const translateY = useRef(new Animated.Value(-40)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -40,
        duration: 200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setMessage(null);
    });
  }, [translateY, opacity]);

  const show = useCallback(
    (text: string, variant: ToastVariant = "info") => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      const id = ++toastId;
      setMessage({ id, text, variant });

      translateY.setValue(-40);
      opacity.setValue(0);

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 250,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      timeoutRef.current = setTimeout(dismiss, AUTO_DISMISS_MS);
    },
    [translateY, opacity, dismiss]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const element = message ? (
    <Animated.View
      style={[
        styles.container,
        { borderLeftColor: VARIANT_COLORS[message.variant] },
        { transform: [{ translateY }], opacity },
      ]}
      pointerEvents="none"
    >
      <Text style={styles.text} numberOfLines={2}>
        {message.text}
      </Text>
    </Animated.View>
  ) : null;

  return [element, { show }];
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60,
    left: qsSpacing.md,
    right: qsSpacing.md,
    backgroundColor: qsColors.bgCard,
    borderRadius: qsRadius.sm,
    borderLeftWidth: 3,
    paddingHorizontal: qsSpacing.md,
    paddingVertical: qsSpacing.sm,
    zIndex: 1000,
    ...qsShadows.md,
  },
  text: {
    color: qsColors.textPrimary,
    fontSize: 13,
  },
});
