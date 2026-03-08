/**
 * SimpleBottomSheet
 *
 * Drop-in replacement for @gorhom/bottom-sheet using only React Native built-ins.
 * No reanimated, no gesture handler.
 *
 * Usage:
 *   const sheetRef = useRef<SimpleBottomSheetRef>(null);
 *   sheetRef.current?.snapToIndex(0); // open to first snap point
 *   sheetRef.current?.close();        // close
 *
 *   <SimpleBottomSheet
 *     ref={sheetRef}
 *     snapPoints={["50%", "80%"]}
 *     enablePanDownToClose
 *     onChange={(index) => console.log("index", index)}
 *     onClose={() => console.log("closed")}
 *   >
 *     <SimpleBottomSheetView style={{ flex: 1 }}>
 *       ...content...
 *     </SimpleBottomSheetView>
 *   </SimpleBottomSheet>
 */

import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  View,
  ViewProps,
  ViewStyle,
} from "react-native";
import { qsColors, qsRadius, qsShadows } from "@/src/theme/tokens";

// ─── Public types ──────────────────────────────────────────────────────────

export type SimpleBottomSheetRef = {
  snapToIndex(index: number): void;
  close(): void;
};

export type SimpleBottomSheetProps = {
  snapPoints: string[]; // e.g. ["50%", "80%"]
  /** Initial snap index. -1 means closed (default). Provided for API compatibility; sheet always starts closed. */
  index?: number;
  enablePanDownToClose?: boolean;
  backgroundStyle?: ViewStyle;
  handleIndicatorStyle?: ViewStyle;
  onChange?: (index: number) => void;
  onClose?: () => void;
  children?: React.ReactNode;
};

// ─── Helpers ───────────────────────────────────────────────────────────────

const SCREEN_HEIGHT = Dimensions.get("window").height;
const ANIMATION_DURATION = 250;
const PAN_DISMISS_THRESHOLD = 100; // px drag-down to trigger close

/** Convert a snap-point string ("50%", "80%") to a pixel height. */
function resolveHeight(point: string): number {
  const trimmed = point.trim();
  if (trimmed.endsWith("%")) {
    const pct = parseFloat(trimmed) / 100;
    return Math.round(SCREEN_HEIGHT * pct);
  }
  return parseFloat(trimmed);
}

// ─── Component ─────────────────────────────────────────────────────────────

const SimpleBottomSheet = forwardRef<SimpleBottomSheetRef, SimpleBottomSheetProps>(
  (
    {
      snapPoints,
      enablePanDownToClose = true,
      backgroundStyle,
      handleIndicatorStyle,
      onChange,
      onClose,
      children,
    },
    ref,
  ) => {
    const [visible, setVisible] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(-1);

    // translateY drives the sheet position. 0 = fully shown at current height,
    // positive values move it downward (off-screen).
    const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const backdropOpacity = useRef(new Animated.Value(0)).current;

    // Height of the sheet at the current snap point.
    const sheetHeightRef = useRef(0);

    // ── Internal open/close helpers ────────────────────────────────────────

    const animateOpen = useCallback(
      (height: number, index: number) => {
        sheetHeightRef.current = height;
        // Start off-screen then slide up.
        translateY.setValue(height);
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 0,
            duration: ANIMATION_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(backdropOpacity, {
            toValue: 0.5,
            duration: ANIMATION_DURATION,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setCurrentIndex(index);
          onChange?.(index);
        });
      },
      [backdropOpacity, onChange, translateY],
    );

    const animateClose = useCallback(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: sheetHeightRef.current,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setVisible(false);
        setCurrentIndex(-1);
        onChange?.(-1);
        onClose?.();
      });
    }, [backdropOpacity, onChange, onClose, translateY]);

    // ── Imperative handle ──────────────────────────────────────────────────

    useImperativeHandle(
      ref,
      () => ({
        snapToIndex(index: number) {
          if (index < 0 || index >= snapPoints.length) return;
          const height = resolveHeight(snapPoints[index]);
          if (!visible) {
            setVisible(true);
            // Defer animation until modal has mounted (one frame).
            requestAnimationFrame(() => animateOpen(height, index));
          } else {
            animateOpen(height, index);
          }
        },
        close() {
          animateClose();
        },
      }),
      [animateClose, animateOpen, snapPoints, visible],
    );

    // ── PanResponder (handle area only) ────────────────────────────────────

    const dragStartY = useRef(0);
    const dragCurrentOffset = useRef(new Animated.Value(0)).current;

    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => enablePanDownToClose,
        onMoveShouldSetPanResponder: (_, gs) =>
          enablePanDownToClose && gs.dy > 5,

        onPanResponderGrant: (_, gs) => {
          dragStartY.current = gs.y0;
          dragCurrentOffset.setValue(0);
        },

        onPanResponderMove: (_, gs) => {
          // Only allow downward drag.
          const dy = Math.max(0, gs.dy);
          dragCurrentOffset.setValue(dy);
          translateY.setValue(dy);
        },

        onPanResponderRelease: (_, gs) => {
          if (gs.dy > PAN_DISMISS_THRESHOLD) {
            // User dragged far enough — close.
            dragCurrentOffset.setValue(0);
            // Let animateClose drive translateY from current position.
            sheetHeightRef.current = Math.max(
              sheetHeightRef.current,
              gs.dy,
            );
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (translateY as any).setValue(gs.dy);
            animateClose();
          } else {
            // Spring back to 0.
            Animated.timing(translateY, {
              toValue: 0,
              duration: 150,
              useNativeDriver: true,
            }).start();
            dragCurrentOffset.setValue(0);
          }
        },
      }),
    ).current;

    // ── Resolved sheet height for the current snap (used in layout) ────────

    const sheetHeight =
      currentIndex >= 0
        ? resolveHeight(snapPoints[currentIndex])
        : snapPoints.length > 0
          ? resolveHeight(snapPoints[0])
          : SCREEN_HEIGHT * 0.5;

    // ── Render ─────────────────────────────────────────────────────────────

    if (!visible) return null;

    return (
      <Modal
        visible={visible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={animateClose}
      >
        {/* Backdrop */}
        <Animated.View
          style={[styles.backdrop, { opacity: backdropOpacity }]}
          pointerEvents="box-none"
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={animateClose} />
        </Animated.View>

        {/* Sheet */}
        <Animated.View
          style={[
            styles.sheet,
            { height: sheetHeight },
            backgroundStyle,
            { transform: [{ translateY }] },
          ]}
        >
          {/* Handle area — PanResponder lives here */}
          <View style={styles.handleArea} {...panResponder.panHandlers}>
            <View style={[styles.handle, handleIndicatorStyle]} />
          </View>

          {/* Content */}
          <View style={styles.content}>{children}</View>
        </Animated.View>
      </Modal>
    );
  },
);

SimpleBottomSheet.displayName = "SimpleBottomSheet";

// ─── Passthrough helpers ───────────────────────────────────────────────────

/** Plain View passthrough — mirrors BottomSheetView. */
export function SimpleBottomSheetView({
  children,
  ...rest
}: ViewProps & { children?: React.ReactNode }) {
  return <View {...rest}>{children}</View>;
}

/** ScrollView passthrough — mirrors BottomSheetScrollView. */
export function SimpleBottomSheetScrollView({
  children,
  ...rest
}: ScrollViewProps & { children?: React.ReactNode }) {
  return <ScrollView {...rest}>{children}</ScrollView>;
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000000",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: qsColors.layer1,
    borderTopLeftRadius: qsRadius.xl,
    borderTopRightRadius: qsRadius.xl,
    ...qsShadows.lg,
    overflow: "hidden",
  },
  handleArea: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: qsColors.layer3,
  },
  content: {
    flex: 1,
  },
});

export default SimpleBottomSheet;
