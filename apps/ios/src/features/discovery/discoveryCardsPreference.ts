/**
 * Persists the user's preferred data source for the Discovery carousel cards.
 * Stored locally via AsyncStorage (UI-only preference, not synced to backend).
 */
import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type DiscoveryCardSource = "top_movers" | "watchlist" | "recent" | "holdings";

const STORAGE_KEY = "qs_discovery_card_source_v1";
const DEFAULT_SOURCE: DiscoveryCardSource = "top_movers";

export const DISCOVERY_CARD_SOURCE_OPTIONS: {
  value: DiscoveryCardSource;
  label: string;
  description: string;
}[] = [
  { value: "top_movers", label: "Top Movers", description: "Biggest 1h gainers from current tab" },
  { value: "watchlist", label: "Watchlist", description: "Tokens from your favorites list" },
  { value: "recent", label: "Recently Searched", description: "Your recent token searches" },
  { value: "holdings", label: "Holdings", description: "Tokens in your connected wallet" },
];

export async function getDiscoveryCardSource(): Promise<DiscoveryCardSource> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw && ["top_movers", "watchlist", "recent", "holdings"].includes(raw)) {
      return raw as DiscoveryCardSource;
    }
  } catch {
    // fall through
  }
  return DEFAULT_SOURCE;
}

export async function setDiscoveryCardSource(source: DiscoveryCardSource): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, source);
  } catch {
    // silent
  }
}

export function useDiscoveryCardSource() {
  const [source, setSource] = useState<DiscoveryCardSource>(DEFAULT_SOURCE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getDiscoveryCardSource().then((s) => {
      setSource(s);
      setLoaded(true);
    });
  }, []);

  const update = useCallback(async (next: DiscoveryCardSource) => {
    setSource(next);
    await setDiscoveryCardSource(next);
  }, []);

  return { source, setSource: update, loaded };
}
