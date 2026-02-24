/**
 * TelegramShareSheet — Bottom-sheet modal for sharing a token to Telegram group chats.
 *
 * Usage:
 *   <TelegramShareSheet
 *     visible={showSheet}
 *     rpcClient={rpcClient}
 *     mintAddress="So11111..."
 *     tokenSymbol="SOL"
 *     onClose={() => setShowSheet(false)}
 *   />
 *
 * Flow:
 * 1. Opens → loads group chats (filters negative chat_id)
 * 2. User taps chats to select (max 10)
 * 3. Tap "Share" → calls shareTokenToChats
 * 4. Success toast + close
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";

import type { RpcClient } from "@/src/lib/api/rpcClient";
import {
  fetchTelegramChats,
  fetchTelegramUserId,
  shareTokenToChats,
  type TelegramChatInfo,
} from "./telegramService";
import { qsColors, qsRadius, qsSpacing, qsTypography } from "@/src/theme/tokens";
import { Check, MessageCircle, Users, X } from "@/src/ui/icons";
import { EmptyState } from "@/src/ui/EmptyState";

const MAX_CHATS = 10;

type Props = {
  visible: boolean;
  rpcClient: RpcClient;
  mintAddress: string;
  tokenSymbol?: string;
  onClose: () => void;
};

type SheetState =
  | { kind: "loading" }
  | { kind: "not-linked" }
  | { kind: "ready"; chats: TelegramChatInfo[] }
  | { kind: "error"; message: string };

export function TelegramShareSheet({
  visible,
  rpcClient,
  mintAddress,
  tokenSymbol,
  onClose,
}: Props) {
  const [state, setState] = useState<SheetState>({ kind: "loading" });
  const [selected, setSelected] = useState<Set<string | number>>(new Set());
  const [sending, setSending] = useState(false);

  // Load chats when sheet opens
  useEffect(() => {
    if (!visible) {
      setState({ kind: "loading" });
      setSelected(new Set());
      setSending(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        // Check if linked first
        await fetchTelegramUserId(rpcClient);
        const allChats = await fetchTelegramChats(rpcClient);
        const groupChats = allChats.filter((c) => Number(c.chat_id) < 0);
        if (!cancelled) {
          setState({ kind: "ready", chats: groupChats });
        }
      } catch {
        if (!cancelled) {
          setState({ kind: "not-linked" });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [visible, rpcClient]);

  const toggleChat = useCallback(
    (chatId: string | number) => {
      Haptics.selectionAsync();
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(chatId)) {
          next.delete(chatId);
        } else if (next.size < MAX_CHATS) {
          next.add(chatId);
        }
        return next;
      });
    },
    []
  );

  const handleShare = useCallback(async () => {
    if (selected.size === 0) return;
    setSending(true);
    try {
      await shareTokenToChats(rpcClient, {
        mintAddress,
        chatIds: Array.from(selected),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: "success",
        text1: `Shared${tokenSymbol ? ` $${tokenSymbol}` : ""} to ${selected.size} chat${selected.size > 1 ? "s" : ""}`,
      });
      onClose();
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Share failed",
        text2: err instanceof Error ? err.message : "Try again",
      });
    } finally {
      setSending(false);
    }
  }, [selected, rpcClient, mintAddress, tokenSymbol, onClose]);

  const label = useMemo(() => {
    if (sending) return "Sending…";
    if (selected.size === 0) return "Select chats";
    return `Share to ${selected.size} chat${selected.size > 1 ? "s" : ""}`;
  }, [sending, selected.size]);

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTouch} onPress={onClose} />
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.title}>
              Share{tokenSymbol ? ` $${tokenSymbol}` : ""} to Telegram
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={20} color={qsColors.textSecondary} />
            </Pressable>
          </View>

          {/* Content */}
          {state.kind === "loading" && (
            <View style={styles.centerBox}>
              <ActivityIndicator color={qsColors.accent} />
            </View>
          )}

          {state.kind === "not-linked" && (
            <View style={styles.centerBox}>
              <Text style={styles.notLinkedText}>
                Link your Telegram account first to share tokens.
              </Text>
            </View>
          )}

          {state.kind === "error" && (
            <View style={styles.centerBox}>
              <Text style={styles.errorText}>{state.message}</Text>
            </View>
          )}

          {state.kind === "ready" && (
            <>
              {state.chats.length === 0 ? (
                <EmptyState
                  icon={MessageCircle}
                  title="No group chats"
                  subtitle="Add the Quickscope bot to a Telegram group first."
                />
              ) : (
                <FlatList
                  data={state.chats}
                  keyExtractor={(item) => String(item.chat_id)}
                  style={styles.chatList}
                  renderItem={({ item }) => {
                    const isSelected = selected.has(item.chat_id);
                    return (
                      <Pressable
                        style={({ pressed }) => [
                          styles.chatRow,
                          isSelected && styles.chatRowSelected,
                          pressed && styles.chatRowPressed,
                        ]}
                        onPress={() => toggleChat(item.chat_id)}
                      >
                        <View style={[styles.chatAvatar, isSelected && styles.chatAvatarSelected]}>
                          {isSelected ? (
                            <Check size={14} color={qsColors.textPrimary} />
                          ) : (
                            <Users size={14} color={qsColors.textTertiary} />
                          )}
                        </View>
                        <Text style={styles.chatName} numberOfLines={1}>
                          {item.name}
                        </Text>
                      </Pressable>
                    );
                  }}
                />
              )}

              {/* Share button */}
              {state.chats.length > 0 && (
                <Pressable
                  style={({ pressed }) => [
                    styles.shareButton,
                    selected.size === 0 && styles.shareButtonDisabled,
                    pressed && selected.size > 0 && styles.shareButtonPressed,
                  ]}
                  onPress={handleShare}
                  disabled={selected.size === 0 || sending}
                >
                  {sending ? (
                    <ActivityIndicator size="small" color={qsColors.textPrimary} />
                  ) : (
                    <Text style={styles.shareButtonText}>{label}</Text>
                  )}
                </Pressable>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(8, 12, 24, 0.6)",
    justifyContent: "flex-end",
  },
  backdropTouch: {
    flex: 1,
  },
  sheet: {
    backgroundColor: qsColors.layer1,
    borderTopLeftRadius: qsRadius.lg,
    borderTopRightRadius: qsRadius.lg,
    paddingHorizontal: qsSpacing.lg,
    paddingTop: qsSpacing.lg,
    paddingBottom: qsSpacing.xxxl,
    maxHeight: "70%",
    borderTopWidth: 1,
    borderColor: qsColors.borderDefault,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: qsSpacing.md,
  },
  title: {
    color: qsColors.textPrimary,
    fontSize: qsTypography.size.md,
    fontWeight: qsTypography.weight.semi,
  },
  centerBox: {
    paddingVertical: qsSpacing.xxxl,
    alignItems: "center",
    justifyContent: "center",
  },
  notLinkedText: {
    color: qsColors.textMuted,
    fontSize: qsTypography.size.sm,
    textAlign: "center",
  },
  errorText: {
    color: qsColors.danger,
    fontSize: qsTypography.size.sm,
    textAlign: "center",
  },
  chatList: {
    maxHeight: 320,
  },
  chatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.md,
    paddingVertical: qsSpacing.md,
    paddingHorizontal: qsSpacing.sm,
    borderRadius: qsRadius.md,
  },
  chatRowSelected: {
    backgroundColor: qsColors.layer2,
  },
  chatRowPressed: {
    opacity: 0.7,
  },
  chatAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: qsColors.layer2,
    alignItems: "center",
    justifyContent: "center",
  },
  chatAvatarSelected: {
    backgroundColor: qsColors.accent,
  },
  chatName: {
    flex: 1,
    color: qsColors.textPrimary,
    fontSize: qsTypography.size.sm,
    fontWeight: qsTypography.weight.medium,
  },
  shareButton: {
    backgroundColor: qsColors.accent,
    borderRadius: qsRadius.md,
    paddingVertical: qsSpacing.md,
    alignItems: "center",
    marginTop: qsSpacing.md,
  },
  shareButtonDisabled: {
    opacity: 0.4,
  },
  shareButtonPressed: {
    opacity: 0.7,
  },
  shareButtonText: {
    color: qsColors.textPrimary,
    fontSize: qsTypography.size.sm,
    fontWeight: qsTypography.weight.semi,
  },
});
