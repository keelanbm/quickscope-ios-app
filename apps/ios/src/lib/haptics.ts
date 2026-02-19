/**
 * Centralized haptic feedback utility.
 *
 * Wraps expo-haptics in try/catch so it never crashes on
 * simulators or unsupported hardware.
 */
import * as Haptics from "expo-haptics";

function safe(fn: () => Promise<void>) {
  fn().catch(() => {
    /* swallow — simulator or unsupported device */
  });
}

/** Light tap — button presses, preset selections */
function light() {
  safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

/** Medium tap — confirmations, trade execution */
function medium() {
  safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}

/** Heavy tap — errors, warnings */
function heavy() {
  safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
}

/** Success notification — trade success, copy confirmations */
function success() {
  safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

/** Error notification — failures */
function error() {
  safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
}

/** Selection changed — tab switches, toggles */
function selection() {
  safe(() => Haptics.selectionAsync());
}

export const haptics = {
  light,
  medium,
  heavy,
  success,
  error,
  selection,
} as const;
