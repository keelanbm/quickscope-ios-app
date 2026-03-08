import { useCallback, useEffect, useState } from "react";

import type { RpcClient } from "@/src/lib/api/rpcClient";
import { fetchActiveWallets, type UserWalletInfo } from "./walletService";

export function useSelectedWallets(rpcClient: RpcClient, isAuthenticated: boolean) {
  const [selectedWallets, setSelectedWallets] = useState<UserWalletInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!isAuthenticated) {
      setSelectedWallets([]);
      return;
    }

    setIsLoading(true);
    try {
      const { wallets } = await fetchActiveWallets(rpcClient);
      setSelectedWallets(wallets.filter((w) => w.selected));
    } catch {
      setSelectedWallets([]);
    } finally {
      setIsLoading(false);
    }
  }, [rpcClient, isAuthenticated]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const selectedPublicKeys = selectedWallets.map((w) => w.public_key);

  return { selectedWallets, selectedPublicKeys, isLoading, refetch };
}
