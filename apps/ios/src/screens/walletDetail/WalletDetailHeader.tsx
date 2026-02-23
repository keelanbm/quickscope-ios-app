/**
 * Wallet detail header.
 *
 * Layout:
 * [Back]
 * [Emoji circle 44x44] [Name or address]  [Copy] [Star]
 *                       [Truncated address]
 */
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { qsColors, qsRadius, qsSpacing, qsTypography } from "@/src/theme/tokens";
import { ArrowLeft, Copy, Star, Wallet } from "@/src/ui/icons";
import { haptics } from "@/src/lib/haptics";
import { formatWalletAddress } from "@/src/lib/format";

type WalletDetailHeaderProps = {
  walletAddress: string;
  walletName?: string;
  walletEmoji?: string;
  isTracked: boolean;
  isWatchlistUpdating: boolean;
  onCopyAddress: () => void;
  onToggleWatchlist: () => void;
  onGoBack: () => void;
};

export function WalletDetailHeader({
  walletAddress,
  walletName,
  walletEmoji,
  isTracked,
  isWatchlistUpdating,
  onCopyAddress,
  onToggleWatchlist,
  onGoBack,
}: WalletDetailHeaderProps) {
  const displayName = walletName || formatWalletAddress(walletAddress);
  const truncatedAddress = formatWalletAddress(walletAddress);

  return (
    <View style={styles.wrap}>
      {/* Back button */}
      <Pressable
        onPress={onGoBack}
        style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.6 : 1 }]}
      >
        <ArrowLeft size={20} color={qsColors.textSecondary} />
      </Pressable>

      {/* Identity row */}
      <View style={styles.identityRow}>
        <View style={styles.avatar}>
          {walletEmoji ? (
            <Text style={styles.avatarEmoji}>{walletEmoji}</Text>
          ) : (
            <Wallet size={20} color={qsColors.textSecondary} />
          )}
        </View>

        <View style={styles.identityInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {displayName}
            </Text>

            <View style={styles.actionIcons}>
              <Pressable
                onPress={() => {
                  haptics.light();
                  onCopyAddress();
                }}
                style={({ pressed }) => [styles.iconButton, { opacity: pressed ? 0.5 : 1 }]}
                hitSlop={8}
              >
                <Copy size={14} color={qsColors.accent} />
              </Pressable>

              <Pressable
                onPress={() => {
                  haptics.light();
                  onToggleWatchlist();
                }}
                style={({ pressed }) => [styles.iconButton, { opacity: pressed ? 0.5 : 1 }]}
                disabled={isWatchlistUpdating}
                hitSlop={8}
              >
                <Star
                  size={16}
                  color={isTracked ? qsColors.accent : qsColors.textTertiary}
                  fill={isTracked ? qsColors.accent : "transparent"}
                />
              </Pressable>
            </View>
          </View>

          {/* Show full truncated address if we have a name */}
          {walletName ? (
            <Pressable
              onPress={() => {
                haptics.light();
                onCopyAddress();
              }}
            >
              <Text style={styles.address}>{truncatedAddress}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: qsSpacing.lg,
    gap: qsSpacing.sm,
  },

  backButton: {
    paddingTop: qsSpacing.md,
    paddingBottom: qsSpacing.xs,
    alignSelf: "flex-start",
  },

  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.md,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: qsColors.layer2,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: {
    fontSize: 20,
  },

  identityInfo: {
    flex: 1,
    gap: 2,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.sm,
  },
  name: {
    color: qsColors.textPrimary,
    fontSize: qsTypography.size.xl,
    fontWeight: qsTypography.weight.bold,
    letterSpacing: -0.3,
    flex: 1,
  },

  actionIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.sm,
  },
  iconButton: {
    padding: 4,
  },

  address: {
    fontFamily: "Courier",
    fontSize: 11,
    color: qsColors.textMuted,
  },
});
