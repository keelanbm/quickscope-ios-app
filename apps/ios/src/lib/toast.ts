/**
 * Typed toast helper.
 *
 * Every call triggers an appropriate haptic alongside the visual toast.
 */
import ToastLib from "react-native-toast-message";

import { haptics } from "@/src/lib/haptics";

export type ToastType = "success" | "error" | "info" | "warn";

interface ShowToastOptions {
  /** Primary text */
  title: string;
  /** Optional secondary text */
  message?: string;
  /** Auto-hide delay in ms (overrides per-type default) */
  autoHideMs?: number;
}

const AUTO_HIDE: Record<ToastType, number> = {
  success: 3000,
  error: 5000,
  info: 3000,
  warn: 4000,
};

function show(type: ToastType, opts: ShowToastOptions) {
  // Fire haptic
  switch (type) {
    case "success":
      haptics.success();
      break;
    case "error":
      haptics.error();
      break;
    case "warn":
      haptics.heavy();
      break;
    case "info":
      haptics.light();
      break;
  }

  ToastLib.show({
    type,
    text1: opts.title,
    text2: opts.message,
    visibilityTime: opts.autoHideMs ?? AUTO_HIDE[type],
    topOffset: 60, // below the nav bar
  });
}

function success(title: string, message?: string) {
  show("success", { title, message });
}

function error(title: string, message?: string) {
  show("error", { title, message });
}

function info(title: string, message?: string) {
  show("info", { title, message });
}

function warn(title: string, message?: string) {
  show("warn", { title, message });
}

/** Dismiss current toast immediately */
function dismiss() {
  ToastLib.hide();
}

export const toast = {
  success,
  error,
  info,
  warn,
  dismiss,
} as const;
