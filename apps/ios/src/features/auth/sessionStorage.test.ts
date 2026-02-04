import type { AuthTokens } from "@/src/features/auth/authService";
import * as SecureStore from "expo-secure-store";
import {
  clearStoredAuthSession,
  loadStoredAuthSession,
  persistAuthSession,
} from "@/src/features/auth/sessionStorage";

const v2Key = "quickscope.auth.session.v2";
const legacyKey = "quickscope.auth.tokens.v1";

function createTokens(overrides?: Partial<AuthTokens>): AuthTokens {
  return {
    subject: "user-123",
    access_token_expiration: "1770216600",
    refresh_token_expiration: "1770220200",
    ...overrides,
  };
}

describe("sessionStorage", () => {
  let getItemAsyncMock: jest.SpyInstance;
  let setItemAsyncMock: jest.SpyInstance;
  let deleteItemAsyncMock: jest.SpyInstance;

  beforeEach(() => {
    getItemAsyncMock = jest.spyOn(SecureStore, "getItemAsync");
    setItemAsyncMock = jest.spyOn(SecureStore, "setItemAsync");
    deleteItemAsyncMock = jest.spyOn(SecureStore, "deleteItemAsync");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("loads v2 stored session when available", async () => {
    const session = {
      tokens: createTokens(),
      walletAddress: "So11111111111111111111111111111111111111112",
    };
    getItemAsyncMock.mockResolvedValueOnce(JSON.stringify(session));

    const value = await loadStoredAuthSession();

    expect(value).toEqual(session);
    expect(getItemAsyncMock).toHaveBeenCalledWith(v2Key);
    expect(getItemAsyncMock).not.toHaveBeenCalledWith(legacyKey);
  });

  it("deletes corrupt v2 session and falls back to legacy tokens", async () => {
    const legacyTokens = createTokens({ subject: "legacy-user" });
    getItemAsyncMock
      .mockResolvedValueOnce("not-json")
      .mockResolvedValueOnce(JSON.stringify(legacyTokens));

    const value = await loadStoredAuthSession();

    expect(value).toEqual({ tokens: legacyTokens });
    expect(deleteItemAsyncMock).toHaveBeenCalledWith(v2Key);
  });

  it("deletes invalid legacy payloads and returns null", async () => {
    getItemAsyncMock
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(JSON.stringify({ bad: "data" }));

    const value = await loadStoredAuthSession();

    expect(value).toBeNull();
    expect(deleteItemAsyncMock).toHaveBeenCalledWith(legacyKey);
  });

  it("persists v2 session payload", async () => {
    const session = {
      tokens: createTokens(),
      walletAddress: "Z8wPMesZqDZv4URMfBFH6kwFwM4fxjpdRG33tMjNFeP",
    };

    await persistAuthSession(session);

    expect(setItemAsyncMock).toHaveBeenCalledWith(v2Key, JSON.stringify(session));
  });

  it("clears both v2 and legacy keys", async () => {
    await clearStoredAuthSession();

    expect(deleteItemAsyncMock).toHaveBeenCalledWith(v2Key);
    expect(deleteItemAsyncMock).toHaveBeenCalledWith(legacyKey);
  });
});
