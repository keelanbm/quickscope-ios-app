import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ActivityIndicator,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { RpcClient } from "@/src/lib/api/rpcClient";
import { haptics } from "@/src/lib/haptics";
import { toast } from "@/src/lib/toast";
import type { TransferRouteParams } from "@/src/navigation/types";
import { qsColors, qsRadius, qsSpacing, qsTypography } from "@/src/theme/tokens";
import { ChevronDown, Star, X } from "@/src/ui/icons";
import {
  type UserWalletInfo,
  type WalletWithBalance,
  LAMPORTS_PER_SOL,
  RENT_EXEMPTION_LAMPORTS,
  fetchActiveWallets,
  fetchWalletSolBalances,
  isValidSolanaAddress,
  solToLamports,
  transferSol,
  truncateAddress,
} from "@/src/features/account/walletService";

type Props = {
  rpcClient: RpcClient;
  params?: TransferRouteParams;
  onGoBack: () => void;
};

const PERCENTAGE_SHORTCUTS = [0.1, 0.25, 0.5, 0.75, 1] as const;

export function TransferScreen({ rpcClient, params, onGoBack }: Props) {
  // ── State ──
  const [wallets, setWallets] = useState<WalletWithBalance[]>([]);
  const [selectedSender, setSelectedSender] = useState<WalletWithBalance | null>(null);
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isTransferring, setIsTransferring] = useState(false);
  const [showSenderPicker, setShowSenderPicker] = useState(false);
  const [showRecipientPicker, setShowRecipientPicker] = useState(false);

  // ── Load wallets + balances ──
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { wallets: activeWallets } = await fetchActiveWallets(rpcClient);
        if (cancelled) return;

        const keys = activeWallets.map((w) => w.public_key);
        const balances = await fetchWalletSolBalances(rpcClient, keys);
        if (cancelled) return;

        const enriched: WalletWithBalance[] = activeWallets.map((w) => ({
          ...w,
          solBalance: balances[w.public_key] ?? 0,
        }));

        setWallets(enriched);

        // Pre-select sender
        const preselect = params?.senderWallet
          ? enriched.find((w) => w.public_key === params.senderWallet)
          : enriched.find((w) => w.is_primary) ?? enriched[0];
        if (preselect) setSelectedSender(preselect);
      } catch {
        toast.error("Failed to load wallets");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [rpcClient, params?.senderWallet]);

  // ── Derived values ──
  const availableBalance = useMemo(() => {
    if (!selectedSender?.solBalance) return 0;
    const afterRent = selectedSender.solBalance - RENT_EXEMPTION_LAMPORTS / LAMPORTS_PER_SOL;
    return Math.max(0, afterRent);
  }, [selectedSender]);

  const parsedAmount = useMemo(() => {
    const n = parseFloat(amount);
    return Number.isNaN(n) ? 0 : n;
  }, [amount]);

  const isAmountValid = parsedAmount > 0 && parsedAmount <= availableBalance;
  const isRecipientValid = isValidSolanaAddress(recipientAddress);
  const isSelfTransfer = selectedSender?.public_key === recipientAddress;

  const canTransfer =
    selectedSender != null &&
    isAmountValid &&
    isRecipientValid &&
    !isSelfTransfer &&
    !isTransferring;

  // ── Other wallets (for address book) ──
  const otherWallets = useMemo(
    () => wallets.filter((w) => w.public_key !== selectedSender?.public_key),
    [wallets, selectedSender]
  );

  // ── Handlers ──
  const handlePercentage = useCallback(
    (pct: number) => {
      haptics.selection();
      const val = (availableBalance * pct)
        .toFixed(9)
        .replace(/\.?0+$/, "");
      setAmount(val);
    },
    [availableBalance]
  );

  const handleSelectSender = useCallback((wallet: WalletWithBalance) => {
    haptics.selection();
    setSelectedSender(wallet);
    setShowSenderPicker(false);
    // Reset amount if new wallet has less balance
    setAmount("");
  }, []);

  const handleSelectRecipient = useCallback((wallet: WalletWithBalance) => {
    haptics.selection();
    setRecipientAddress(wallet.public_key);
    setShowRecipientPicker(false);
  }, []);

  const handleTransfer = useCallback(async () => {
    if (!canTransfer || !selectedSender) return;

    Keyboard.dismiss();
    haptics.light();
    setIsTransferring(true);

    try {
      const lamports = solToLamports(parsedAmount);
      await transferSol(rpcClient, {
        userAccountKey: selectedSender.public_key,
        receiver: recipientAddress,
        amount: lamports,
      });

      haptics.success();
      toast.success("Transfer confirmed");
      onGoBack();
    } catch (err: any) {
      haptics.error();
      toast.error("Transfer failed", err?.message ?? "Please try again");
    } finally {
      setIsTransferring(false);
    }
  }, [canTransfer, selectedSender, parsedAmount, recipientAddress, rpcClient, onGoBack]);

  // ── Loading state ──
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={qsColors.accent} />
      </View>
    );
  }

  if (wallets.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No wallets found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Sender Wallet ── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>From</Text>
        <Pressable
          style={({ pressed }) => [styles.pickerButton, pressed && styles.pickerButtonPressed]}
          onPress={() => setShowSenderPicker(true)}
        >
          {selectedSender ? (
            <View style={styles.walletRow}>
              <View style={styles.walletInfo}>
                <Text style={styles.walletName}>{selectedSender.name}</Text>
                <Text style={styles.walletKey}>
                  {truncateAddress(selectedSender.public_key)}
                </Text>
              </View>
              <View style={styles.balanceCol}>
                <Text style={styles.balanceText}>
                  {(selectedSender.solBalance ?? 0).toFixed(4)} SOL
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.placeholderText}>Select wallet</Text>
          )}
          <ChevronDown size={16} color={qsColors.textTertiary} />
        </Pressable>
      </View>

      {/* ── Amount ── */}
      <View style={styles.section}>
        <View style={styles.labelRow}>
          <Text style={styles.sectionLabel}>Amount (SOL)</Text>
          <Text style={styles.availableLabel}>
            Available: {availableBalance.toFixed(4)}
          </Text>
        </View>
        <TextInput
          style={[
            styles.input,
            amount.length > 0 && !isAmountValid && styles.inputError,
          ]}
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          placeholderTextColor={qsColors.textSubtle}
          keyboardType="decimal-pad"
          returnKeyType="done"
        />

        {/* Percentage shortcuts */}
        <View style={styles.percentageRow}>
          {PERCENTAGE_SHORTCUTS.map((pct) => (
            <Pressable
              key={pct}
              style={({ pressed }) => [
                styles.percentageButton,
                pressed && styles.percentageButtonPressed,
              ]}
              onPress={() => handlePercentage(pct)}
            >
              <Text style={styles.percentageText}>{pct * 100}%</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* ── Recipient ── */}
      <View style={styles.section}>
        <View style={styles.labelRow}>
          <Text style={styles.sectionLabel}>To</Text>
          {otherWallets.length > 0 ? (
            <Pressable onPress={() => setShowRecipientPicker(true)}>
              <Text style={styles.addressBookLink}>My Wallets</Text>
            </Pressable>
          ) : null}
        </View>
        <TextInput
          style={[
            styles.input,
            recipientAddress.length > 0 &&
              !isRecipientValid &&
              styles.inputError,
            isSelfTransfer && styles.inputError,
          ]}
          value={recipientAddress}
          onChangeText={setRecipientAddress}
          placeholder="Solana address"
          placeholderTextColor={qsColors.textSubtle}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {isSelfTransfer ? (
          <Text style={styles.errorHint}>Cannot transfer to the same wallet</Text>
        ) : null}
      </View>

      {/* ── Action Buttons ── */}
      <View style={styles.actionRow}>
        <Pressable
          style={({ pressed }) => [styles.cancelButton, pressed && styles.cancelButtonPressed]}
          onPress={onGoBack}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.transferButton,
            !canTransfer && styles.transferButtonDisabled,
            pressed && canTransfer && styles.transferButtonPressed,
          ]}
          onPress={handleTransfer}
          disabled={!canTransfer}
        >
          {isTransferring ? (
            <ActivityIndicator size="small" color={qsColors.textPrimary} />
          ) : (
            <Text
              style={[
                styles.transferButtonText,
                !canTransfer && styles.transferButtonTextDisabled,
              ]}
            >
              Transfer
            </Text>
          )}
        </Pressable>
      </View>

      {/* ── Sender Wallet Picker Modal ── */}
      <WalletPickerModal
        visible={showSenderPicker}
        title="Select Sender"
        wallets={wallets}
        selectedKey={selectedSender?.public_key}
        onSelect={handleSelectSender}
        onClose={() => setShowSenderPicker(false)}
      />

      {/* ── Recipient Address Book Modal ── */}
      <WalletPickerModal
        visible={showRecipientPicker}
        title="My Wallets"
        wallets={otherWallets}
        onSelect={handleSelectRecipient}
        onClose={() => setShowRecipientPicker(false)}
      />
    </ScrollView>
  );
}

// ── Wallet Picker Modal ──

function WalletPickerModal({
  visible,
  title,
  wallets,
  selectedKey,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  wallets: WalletWithBalance[];
  selectedKey?: string;
  onSelect: (wallet: WalletWithBalance) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={modalStyles.sheet}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <X size={20} color={qsColors.textSecondary} />
            </Pressable>
          </View>
          <ScrollView bounces={false}>
            {wallets.map((w) => (
              <Pressable
                key={w.public_key}
                style={({ pressed }) => [
                  modalStyles.row,
                  selectedKey === w.public_key && modalStyles.rowSelected,
                  pressed && modalStyles.rowPressed,
                ]}
                onPress={() => onSelect(w)}
              >
                <View style={modalStyles.rowLeft}>
                  <View style={modalStyles.nameRow}>
                    <Text style={modalStyles.walletName}>{w.name}</Text>
                    {w.is_primary ? (
                      <Star size={12} color={qsColors.warning} fill={qsColors.warning} />
                    ) : null}
                  </View>
                  <Text style={modalStyles.walletKey}>
                    {truncateAddress(w.public_key)}
                  </Text>
                </View>
                <Text style={modalStyles.balance}>
                  {(w.solBalance ?? 0).toFixed(4)} SOL
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: qsColors.layer0,
  },
  content: {
    padding: qsSpacing.xl,
    gap: qsSpacing.xxl,
    paddingBottom: 60,
  },
  centered: {
    flex: 1,
    backgroundColor: qsColors.layer0,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: qsTypography.size.base,
    color: qsColors.textMuted,
  },
  section: {
    gap: qsSpacing.sm,
  },
  sectionLabel: {
    fontSize: qsTypography.size.xs,
    fontWeight: qsTypography.weight.semi,
    color: qsColors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  availableLabel: {
    fontSize: qsTypography.size.xxs,
    color: qsColors.textTertiary,
    fontVariant: ["tabular-nums"],
  },

  // Picker button
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: qsColors.layer1,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.lg,
    padding: qsSpacing.md,
    gap: qsSpacing.sm,
  },
  pickerButtonPressed: {
    backgroundColor: qsColors.layer2,
  },
  walletRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  walletInfo: {
    gap: 2,
  },
  walletName: {
    fontSize: qsTypography.size.sm,
    fontWeight: qsTypography.weight.semi,
    color: qsColors.textPrimary,
  },
  walletKey: {
    fontSize: qsTypography.size.xxs,
    color: qsColors.textTertiary,
    fontVariant: ["tabular-nums"],
  },
  balanceCol: {
    alignItems: "flex-end",
  },
  balanceText: {
    fontSize: qsTypography.size.sm,
    fontWeight: qsTypography.weight.medium,
    color: qsColors.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  placeholderText: {
    flex: 1,
    fontSize: qsTypography.size.sm,
    color: qsColors.textSubtle,
  },

  // Input
  input: {
    backgroundColor: qsColors.layer1,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.lg,
    paddingVertical: 12,
    paddingHorizontal: qsSpacing.md,
    fontSize: qsTypography.size.base,
    color: qsColors.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  inputError: {
    borderColor: qsColors.sellRed,
  },
  errorHint: {
    fontSize: qsTypography.size.xxs,
    color: qsColors.sellRed,
  },

  // Percentage row
  percentageRow: {
    flexDirection: "row",
    gap: qsSpacing.sm,
  },
  percentageButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    backgroundColor: qsColors.layer2,
    borderRadius: qsRadius.md,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
  },
  percentageButtonPressed: {
    backgroundColor: qsColors.layer3,
  },
  percentageText: {
    fontSize: qsTypography.size.xxs,
    fontWeight: qsTypography.weight.semi,
    color: qsColors.textSecondary,
  },

  // Address book link
  addressBookLink: {
    fontSize: qsTypography.size.xxs,
    fontWeight: qsTypography.weight.semi,
    color: qsColors.accent,
  },

  // Action buttons
  actionRow: {
    flexDirection: "row",
    gap: qsSpacing.md,
    marginTop: qsSpacing.sm,
  },
  cancelButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    backgroundColor: qsColors.layer2,
    borderRadius: qsRadius.lg,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
  },
  cancelButtonPressed: {
    backgroundColor: qsColors.layer3,
  },
  cancelButtonText: {
    fontSize: qsTypography.size.base,
    fontWeight: qsTypography.weight.semi,
    color: qsColors.textSecondary,
  },
  transferButton: {
    flex: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    backgroundColor: qsColors.accent,
    borderRadius: qsRadius.lg,
  },
  transferButtonPressed: {
    backgroundColor: qsColors.accentDeep,
  },
  transferButtonDisabled: {
    opacity: 0.4,
  },
  transferButtonText: {
    fontSize: qsTypography.size.base,
    fontWeight: qsTypography.weight.bold,
    color: qsColors.textPrimary,
  },
  transferButtonTextDisabled: {
    color: qsColors.textMuted,
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    padding: qsSpacing.xxl,
  },
  sheet: {
    backgroundColor: qsColors.layer1,
    borderRadius: qsRadius.xl,
    maxHeight: "60%",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: qsSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: qsColors.borderDefault,
  },
  title: {
    fontSize: qsTypography.size.md,
    fontWeight: qsTypography.weight.bold,
    color: qsColors.textPrimary,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: qsSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: qsColors.borderSubtle,
  },
  rowSelected: {
    backgroundColor: qsColors.layer2,
  },
  rowPressed: {
    backgroundColor: qsColors.pressedOverlay,
  },
  rowLeft: {
    gap: 2,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  walletName: {
    fontSize: qsTypography.size.sm,
    fontWeight: qsTypography.weight.semi,
    color: qsColors.textPrimary,
  },
  walletKey: {
    fontSize: qsTypography.size.xxs,
    color: qsColors.textTertiary,
    fontVariant: ["tabular-nums"],
  },
  balance: {
    fontSize: qsTypography.size.sm,
    fontWeight: qsTypography.weight.medium,
    color: qsColors.textPrimary,
    fontVariant: ["tabular-nums"],
  },
});
