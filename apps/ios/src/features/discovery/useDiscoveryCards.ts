/**
 * Hook that fetches carousel card data based on the user's
 * preferred discovery card source (watchlist, recent, holdings).
 */
import { useCallback, useEffect, useRef, useState } from "react";

import { useAuthSession } from "@/src/features/auth/AuthSessionProvider";
import {
  type DiscoveryCardSource,
  useDiscoveryCardSource,
} from "@/src/features/discovery/discoveryCardsPreference";
import {
  fetchAccountTokenHoldings,
} from "@/src/features/portfolio/portfolioService";
import { getRecentSearches } from "@/src/features/search/recentSearchesStorage";
import {
  fetchTokenWatchlists,
  fetchWatchlistTokens,
} from "@/src/features/watchlist/tokenWatchlistService";
import type { RpcClient } from "@/src/lib/api/rpcClient";

export type CarouselCardItem = {
  mint: string;
  symbol: string;
  imageUri?: string;
  marketCapUsd: number;
  oneHourChangePercent: number;
};

const CAROUSEL_LABEL: Record<DiscoveryCardSource, string> = {
  watchlist: "Watchlist",
  recent: "Recently Searched",
  holdings: "Holdings",
};

const CAROUSEL_EMPTY: Record<DiscoveryCardSource, string> = {
  watchlist: "Star tokens to see them here",
  recent: "Search for tokens to see them here",
  holdings: "Connect a wallet to see holdings",
};

export function useDiscoveryCards(rpcClient: RpcClient) {
  const { source, loaded: prefLoaded } = useDiscoveryCardSource();
  const { walletAddress, primaryAccountAddress } = useAuthSession();
  const [cards, setCards] = useState<CarouselCardItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const seqRef = useRef(0);

  const accountAddress = primaryAccountAddress ?? walletAddress;

  const fetchCards = useCallback(async () => {
    const seq = ++seqRef.current;

    setIsLoading(true);
    try {
      let items: CarouselCardItem[] = [];

      if (source === "watchlist") {
        const lists = await fetchTokenWatchlists(rpcClient);
        const favList = lists.find((l) => l.isFavorites);
        const mints = favList?.tokens ?? [];
        if (mints.length > 0) {
          const enriched = await fetchWatchlistTokens(rpcClient, mints.slice(0, 8));
          items = enriched.map((t) => ({
            mint: t.mint,
            symbol: t.symbol,
            imageUri: t.imageUri,
            marketCapUsd: t.marketCapUsd,
            oneHourChangePercent: t.oneHourChangePercent,
          }));
        }
      } else if (source === "recent") {
        const recents = await getRecentSearches();
        const mints = recents.map((r) => r.mint).slice(0, 8);
        if (mints.length > 0) {
          const enriched = await fetchWatchlistTokens(rpcClient, mints);
          items = enriched.map((t) => ({
            mint: t.mint,
            symbol: t.symbol,
            imageUri: t.imageUri,
            marketCapUsd: t.marketCapUsd,
            oneHourChangePercent: t.oneHourChangePercent,
          }));
        }
      } else if (source === "holdings") {
        if (accountAddress) {
          const holdingsData = await fetchAccountTokenHoldings(rpcClient, accountAddress);
          const solPrice = holdingsData.sol_price_usd || 0;
          items = holdingsData.token_holdings
            .filter((h) => h.balance > 0 && h.token_info?.token_metadata?.mint)
            .slice(0, 8)
            .map((h) => {
              const meta = h.token_info?.token_metadata;
              return {
                mint: meta?.mint ?? "",
                symbol: meta?.symbol ?? "???",
                imageUri: meta?.image_uri,
                marketCapUsd: h.value_sol * solPrice,
                oneHourChangePercent: 0,
              };
            });
        }
      }

      if (seq === seqRef.current) {
        setCards(items);
      }
    } catch {
      if (seq === seqRef.current) {
        setCards([]);
      }
    } finally {
      if (seq === seqRef.current) {
        setIsLoading(false);
      }
    }
  }, [source, rpcClient, accountAddress]);

  useEffect(() => {
    if (!prefLoaded) return;
    void fetchCards();
  }, [fetchCards, prefLoaded]);

  return {
    cards,
    isLoading,
    source,
    label: CAROUSEL_LABEL[source],
    emptyMessage: CAROUSEL_EMPTY[source],
    refetch: fetchCards,
  };
}
