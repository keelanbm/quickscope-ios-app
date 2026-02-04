import * as SecureStore from "expo-secure-store";

import type { AuthTokens } from "@/src/features/auth/authService";

const authSessionStorageKey = "quickscope.auth.session.v2";
const legacyAuthTokensStorageKey = "quickscope.auth.tokens.v1";

export type StoredAuthSession = {
  tokens: AuthTokens;
  walletAddress?: string;
};

function isAuthTokensLike(value: unknown): value is AuthTokens {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as AuthTokens;

  return (
    typeof candidate.subject === "string" &&
    typeof candidate.refresh_token_expiration === "string" &&
    typeof candidate.access_token_expiration === "string"
  );
}

function parseStoredSession(raw: string | null): StoredAuthSession | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredAuthSession;
    if (!parsed || typeof parsed !== "object" || !isAuthTokensLike(parsed.tokens)) {
      return null;
    }

    return {
      tokens: parsed.tokens,
      walletAddress:
        typeof parsed.walletAddress === "string" ? parsed.walletAddress : undefined,
    };
  } catch {
    return null;
  }
}

export async function loadStoredAuthSession(): Promise<StoredAuthSession | null> {
  const storedSessionRaw = await SecureStore.getItemAsync(authSessionStorageKey);
  if (storedSessionRaw) {
    const storedSession = parseStoredSession(storedSessionRaw);
    if (storedSession) {
      return storedSession;
    }

    await SecureStore.deleteItemAsync(authSessionStorageKey);
  }

  const legacyRaw = await SecureStore.getItemAsync(legacyAuthTokensStorageKey);
  if (!legacyRaw) {
    return null;
  }

  try {
    const legacyTokens = JSON.parse(legacyRaw) as AuthTokens;
    if (!isAuthTokensLike(legacyTokens)) {
      throw new Error("legacy tokens invalid");
    }

    return { tokens: legacyTokens };
  } catch {
    await SecureStore.deleteItemAsync(legacyAuthTokensStorageKey);
    return null;
  }
}

export async function persistAuthSession(session: StoredAuthSession): Promise<void> {
  await SecureStore.setItemAsync(authSessionStorageKey, JSON.stringify(session));
}

export async function clearStoredAuthSession(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(authSessionStorageKey),
    SecureStore.deleteItemAsync(legacyAuthTokensStorageKey),
  ]);
}
