/**
 * Persists recent search selections in AsyncStorage.
 *
 * Each entry stores the mint + minimal display info so we can render
 * recent-search chips without hitting the network again.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "qs_recent_searches_v1";
const MAX_ENTRIES = 10;

export type RecentSearchEntry = {
  mint: string;
  symbol: string;
  name: string;
  imageUri?: string;
  /** Unix‑ms when the search was performed. */
  timestamp: number;
};

/**
 * Read all recent searches (newest first).
 * Returns an empty array if nothing is stored or on error.
 */
export async function getRecentSearches(): Promise<RecentSearchEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as RecentSearchEntry[];
  } catch {
    return [];
  }
}

/**
 * Push a new entry to the front of the list.
 * De-duplicates by mint and trims to MAX_ENTRIES.
 */
export async function addRecentSearch(
  entry: Omit<RecentSearchEntry, "timestamp">
): Promise<RecentSearchEntry[]> {
  const current = await getRecentSearches();
  const newEntry: RecentSearchEntry = { ...entry, timestamp: Date.now() };

  // Remove any existing entry for the same mint, then prepend
  const filtered = current.filter((e) => e.mint !== entry.mint);
  const updated = [newEntry, ...filtered].slice(0, MAX_ENTRIES);

  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Fire-and-forget — don't break the UI for a cache write failure
  }

  return updated;
}

/**
 * Remove a single entry by mint address.
 */
export async function removeRecentSearch(mint: string): Promise<RecentSearchEntry[]> {
  const current = await getRecentSearches();
  const updated = current.filter((e) => e.mint !== mint);

  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // silent
  }

  return updated;
}

/**
 * Clear all recent searches.
 */
export async function clearRecentSearches(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // silent
  }
}
