export type WalletAddressEntry = {
  addressType: unknown;
  address: string;
};

export function parseExpirationToUnixMs(raw: string | undefined): number | undefined {
  if (!raw) {
    return undefined;
  }

  const numeric = Number(raw);
  if (Number.isFinite(numeric) && numeric > 0) {
    return numeric < 1_000_000_000_000 ? numeric * 1000 : numeric;
  }

  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function isFutureTimestamp(
  unixMs: number | undefined,
  options?: { nowMs?: number; skewMs?: number }
): boolean {
  if (!unixMs) {
    return false;
  }

  const nowMs = options?.nowMs ?? Date.now();
  const skewMs = options?.skewMs ?? 0;

  return unixMs > nowMs + skewMs;
}

export function getSolanaAddress(addresses: WalletAddressEntry[]): string | undefined {
  const firstSolanaAddress = addresses.find((entry) =>
    String(entry.addressType).toLowerCase().includes("solana")
  );

  if (firstSolanaAddress?.address) {
    return firstSolanaAddress.address;
  }

  return addresses[0]?.address;
}

export function shouldInvalidateSessionForWalletChange(
  sessionWalletAddress: string | undefined,
  currentWalletAddress: string | undefined
): boolean {
  if (!sessionWalletAddress || !currentWalletAddress) {
    return false;
  }

  return sessionWalletAddress !== currentWalletAddress;
}
