import { useCallback, useEffect, useRef } from "react";

import {
  Animated,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { haptics } from "@/src/lib/haptics";
import { qsColors, qsRadius, qsSpacing, qsTypography } from "@/src/theme/tokens";
import { Check, X } from "@/src/ui/icons";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const DRAWER_WIDTH = SCREEN_WIDTH * 0.8;
const DRAWER_HEIGHT = SCREEN_HEIGHT * 0.8;
const ANIMATION_DURATION = 250;

export type ListPickerItem = {
  id: string;
  label: string;
  subtitle?: string;
  imageUri?: string;
  icon?: React.ReactNode;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  items: ListPickerItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
};

export function ListPickerDrawer({ visible, onClose, title, items, activeId, onSelect }: Props) {
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -DRAWER_WIDTH,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateX, backdropOpacity]);

  const handleClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: -DRAWER_WIDTH,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  }, [onClose, translateX, backdropOpacity]);

  const handleSelect = useCallback(
    (id: string) => {
      haptics.selection();
      onSelect(id);
      handleClose();
    },
    [onSelect, handleClose]
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        {/* Drawer panel */}
        <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{title}</Text>
            <Pressable onPress={handleClose} hitSlop={12} style={styles.closeButton}>
              <X size={20} color={qsColors.textSecondary} />
            </Pressable>
          </View>

          {/* List items */}
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            bounces={false}
          >
            {items.map((item) => {
              const isActive = item.id === activeId;
              return (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [
                    styles.listRow,
                    isActive && styles.listRowActive,
                    pressed && styles.listRowPressed,
                  ]}
                  onPress={() => handleSelect(item.id)}
                >
                  {item.imageUri ? (
                    <Image source={{ uri: item.imageUri }} style={styles.listAvatar} />
                  ) : item.icon ? (
                    <View style={styles.listAvatarFallback}>{item.icon}</View>
                  ) : null}
                  <View style={styles.listTextCol}>
                    <Text
                      numberOfLines={1}
                      style={[styles.listLabel, isActive && styles.listLabelActive]}
                    >
                      {item.label}
                    </Text>
                    {item.subtitle ? (
                      <Text numberOfLines={1} style={styles.listSubtitle}>
                        {item.subtitle}
                      </Text>
                    ) : null}
                  </View>
                  {isActive ? <Check size={16} color={qsColors.accent} /> : null}
                </Pressable>
              );
            })}

            {items.length === 0 ? (
              <Text style={styles.emptyText}>No lists available</Text>
            ) : null}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  drawer: {
    position: "absolute",
    top: 60,
    left: 0,
    width: DRAWER_WIDTH,
    height: DRAWER_HEIGHT,
    backgroundColor: qsColors.layer1,
    borderRightWidth: 1,
    borderRightColor: qsColors.layer2,
    borderBottomWidth: 1,
    borderBottomColor: qsColors.layer2,
    borderBottomRightRadius: qsRadius.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: qsSpacing.lg,
    paddingBottom: qsSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: qsColors.borderDefault,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: qsTypography.weight.bold,
    color: qsColors.textPrimary,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: qsRadius.sm,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingVertical: qsSpacing.sm,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: qsSpacing.lg,
    gap: qsSpacing.md,
  },
  listRowActive: {
    backgroundColor: qsColors.layer2,
  },
  listRowPressed: {
    backgroundColor: qsColors.layer3,
  },
  listAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: qsColors.layer3,
  },
  listAvatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: qsColors.layer3,
    alignItems: "center",
    justifyContent: "center",
  },
  listTextCol: {
    flex: 1,
    gap: 1,
  },
  listLabel: {
    fontSize: 15,
    fontWeight: qsTypography.weight.medium,
    color: qsColors.textPrimary,
  },
  listLabelActive: {
    fontWeight: qsTypography.weight.semi,
  },
  listSubtitle: {
    fontSize: 12,
    color: qsColors.textTertiary,
  },
  emptyText: {
    fontSize: 14,
    color: qsColors.textSubtle,
    textAlign: "center",
    paddingVertical: qsSpacing.xxl,
  },
});
