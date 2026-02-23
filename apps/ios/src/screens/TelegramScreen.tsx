/**
 * TelegramScreen — Link/unlink Telegram account and view connected chats.
 *
 * States:
 * 1. Loading — checking connection status
 * 2. Unlinked — show link flow (generate access code → open Telegram bot)
 * 3. Linked — show Telegram username, group chats, unlink button
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Linking from "expo-linking";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";

import type { RpcClient } from "@/src/lib/api/rpcClient";
import type { TelegramRouteParams } from "@/src/navigation/types";
import {
  createAccessCode,
  fetchTelegramChats,
  fetchTelegramUserId,
  unlinkTelegram,
  type TelegramChatInfo,
  type TelegramUsernameAndId,
} from "@/src/features/telegram/telegramService";
import { qsColors, qsRadius, qsSpacing, qsTypography } from "@/src/theme/tokens";
import { TelegramShareSheet } from "@/src/features/telegram/TelegramShareSheet";
import { EmptyState } from "@/src/ui/EmptyState";
import {
  TelegramIcon,
  ExternalLink,
  Link,
  LogOut,
  MessageCircle,
  Users,
} from "@/src/ui/icons";

const TELEGRAM_BOT_USERNAME = "QuickscopeStagingBot";

type Props = {
  rpcClient: RpcClient;
  params?: TelegramRouteParams;
};

type ConnectionState =
  | { kind: "loading" }
  | { kind: "unlinked" }
  | { kind: "linked"; user: TelegramUsernameAndId; chats: TelegramChatInfo[] };

export function TelegramScreen({ rpcClient, params }: Props) {
  const [state, setState] = useState<ConnectionState>({ kind: "loading" });
  const [linking, setLinking] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [shareSheetToken, setShareSheetToken] = useState<string | null>(null);
  const handledDeepLinkRef = useRef<string | undefined>(undefined);

  // Handle deep link: action=share with tokenAddress
  useEffect(() => {
    if (
      params?.action === "share" &&
      params.tokenAddress &&
      state.kind === "linked" &&
      handledDeepLinkRef.current !== params.tokenAddress
    ) {
      handledDeepLinkRef.current = params.tokenAddress;
      setShareSheetToken(params.tokenAddress);
    }
  }, [params?.action, params?.tokenAddress, state.kind]);

  const checkConnection = useCallback(async () => {
    try {
      const user = await fetchTelegramUserId(rpcClient);
      const allChats = await fetchTelegramChats(rpcClient);
      // Only show group chats (negative chat_id)
      const groupChats = allChats.filter((c) => Number(c.chat_id) < 0);
      setState({ kind: "linked", user, chats: groupChats });
    } catch {
      setState({ kind: "unlinked" });
    }
  }, [rpcClient]);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const handleLink = useCallback(async () => {
    setLinking(true);
    try {
      const code = await createAccessCode(rpcClient);
      const url = `https://t.me/${TELEGRAM_BOT_USERNAME}?start=link_${code}`;
      await Linking.openURL(url);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: "info",
        text1: "Tap Start in Telegram",
        text2: "Then come back here and pull down to refresh.",
      });
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Failed to generate link code",
        text2: err instanceof Error ? err.message : "Try again",
      });
    } finally {
      setLinking(false);
    }
  }, [rpcClient]);

  const handleUnlink = useCallback(async () => {
    setUnlinking(true);
    try {
      await unlinkTelegram(rpcClient);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setState({ kind: "unlinked" });
      Toast.show({ type: "success", text1: "Telegram unlinked" });
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Failed to unlink",
        text2: err instanceof Error ? err.message : "Try again",
      });
    } finally {
      setUnlinking(false);
    }
  }, [rpcClient]);

  const handleRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await checkConnection();
  }, [checkConnection]);

  // ── Loading ──
  if (state.kind === "loading") {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={qsColors.accent} />
      </View>
    );
  }

  // ── Unlinked ──
  if (state.kind === "unlinked") {
    return (
      <View style={styles.container}>
        <View style={styles.linkCard}>
          <View style={styles.linkIconCircle}>
            <TelegramIcon size={32} color={qsColors.accent} />
          </View>
          <Text style={styles.linkTitle}>Link Telegram</Text>
          <Text style={styles.linkSubtitle}>
            Connect your Telegram account to share tokens to your group chats directly from Quickscope.
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.linkButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleLink}
            disabled={linking}
          >
            {linking ? (
              <ActivityIndicator size="small" color={qsColors.textPrimary} />
            ) : (
              <>
                <Link size={16} color={qsColors.textPrimary} />
                <Text style={styles.linkButtonText}>Link with Telegram Bot</Text>
                <ExternalLink size={14} color={qsColors.textTertiary} />
              </>
            )}
          </Pressable>

          <Pressable style={styles.refreshRow} onPress={handleRefresh}>
            <Text style={styles.refreshText}>Already linked? Tap to refresh</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Linked ──
  const { user, chats } = state;

  return (
    <>
      <FlatList
        data={chats}
        keyExtractor={(item) => String(item.chat_id)}
        contentContainerStyle={styles.listContent}
        onRefresh={handleRefresh}
        refreshing={false}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            <View style={styles.connectedBadge}>
              <TelegramIcon size={16} color={qsColors.accent} />
              <Text style={styles.connectedText}>
                Connected as <Text style={styles.connectedName}>{user.name}</Text>
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.unlinkButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleUnlink}
              disabled={unlinking}
            >
              {unlinking ? (
                <ActivityIndicator size="small" color={qsColors.sellRed} />
              ) : (
                <>
                  <LogOut size={14} color={qsColors.sellRed} />
                  <Text style={styles.unlinkText}>Unlink</Text>
                </>
              )}
            </Pressable>

            {chats.length > 0 && (
              <Text style={styles.sectionLabel}>
                Group Chats ({chats.length})
              </Text>
            )}
          </View>
        }
        renderItem={({ item }) => <ChatRow chat={item} />}
        ListEmptyComponent={
          <EmptyState
            icon={MessageCircle}
            title="No group chats"
            subtitle="Add the Quickscope bot to a Telegram group to start sharing tokens."
          />
        }
      />
      <TelegramShareSheet
        visible={shareSheetToken !== null}
        rpcClient={rpcClient}
        mintAddress={shareSheetToken ?? ""}
        onClose={() => setShareSheetToken(null)}
      />
    </>
  );
}

function ChatRow({ chat }: { chat: TelegramChatInfo }) {
  return (
    <View style={styles.chatRow}>
      <View style={styles.chatAvatar}>
        <Users size={16} color={qsColors.textTertiary} />
      </View>
      <View style={styles.chatInfo}>
        <Text style={styles.chatName} numberOfLines={1}>
          {chat.name}
        </Text>
        {chat.chat_type ? (
          <Text style={styles.chatType}>{chat.chat_type}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: qsColors.layer0,
    padding: qsSpacing.lg,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: qsColors.layer0,
  },
  listContent: {
    padding: qsSpacing.lg,
    paddingBottom: qsSpacing.xxxxl,
  },

  // ── Link card ──
  linkCard: {
    backgroundColor: qsColors.layer1,
    borderRadius: qsRadius.lg,
    padding: qsSpacing.xl,
    alignItems: "center",
    gap: qsSpacing.sm,
    marginTop: qsSpacing.xxxl,
  },
  linkIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: qsColors.layer2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: qsSpacing.xs,
  },
  linkTitle: {
    color: qsColors.textPrimary,
    fontSize: qsTypography.size.lg,
    fontWeight: qsTypography.weight.semi,
  },
  linkSubtitle: {
    color: qsColors.textMuted,
    fontSize: qsTypography.size.sm,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
    marginBottom: qsSpacing.md,
  },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.sm,
    backgroundColor: qsColors.accent,
    paddingHorizontal: qsSpacing.xl,
    paddingVertical: qsSpacing.md,
    borderRadius: qsRadius.md,
    minWidth: 200,
    justifyContent: "center",
  },
  linkButtonText: {
    color: qsColors.textPrimary,
    fontSize: qsTypography.size.sm,
    fontWeight: qsTypography.weight.semi,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  refreshRow: {
    paddingVertical: qsSpacing.sm,
    marginTop: qsSpacing.xs,
  },
  refreshText: {
    color: qsColors.textTertiary,
    fontSize: qsTypography.size.xs,
  },

  // ── Linked header ──
  headerSection: {
    gap: qsSpacing.md,
    marginBottom: qsSpacing.lg,
  },
  connectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.sm,
    backgroundColor: qsColors.layer1,
    padding: qsSpacing.md,
    borderRadius: qsRadius.md,
  },
  connectedText: {
    color: qsColors.textSecondary,
    fontSize: qsTypography.size.sm,
    flex: 1,
  },
  connectedName: {
    color: qsColors.textPrimary,
    fontWeight: qsTypography.weight.semi,
  },
  unlinkButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    gap: qsSpacing.xs,
    paddingHorizontal: qsSpacing.md,
    paddingVertical: qsSpacing.sm,
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.layer1,
  },
  unlinkText: {
    color: qsColors.sellRed,
    fontSize: qsTypography.size.xs,
    fontWeight: qsTypography.weight.medium,
  },
  sectionLabel: {
    color: qsColors.textTertiary,
    fontSize: qsTypography.size.xxs,
    fontWeight: qsTypography.weight.semi,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: qsSpacing.sm,
  },

  // ── Chat rows ──
  chatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.md,
    paddingVertical: qsSpacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: qsColors.borderSubtle,
  },
  chatAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: qsColors.layer2,
    alignItems: "center",
    justifyContent: "center",
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    color: qsColors.textPrimary,
    fontSize: qsTypography.size.sm,
    fontWeight: qsTypography.weight.medium,
  },
  chatType: {
    color: qsColors.textTertiary,
    fontSize: qsTypography.size.xxs,
    marginTop: 2,
  },
});
