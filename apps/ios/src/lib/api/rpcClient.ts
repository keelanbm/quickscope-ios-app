import { TurboModuleRegistry, type TurboModule } from "react-native";

import { AppEnv } from "@/src/config/env";

/**
 * Cookie type from the CookieManager TurboModule spec.
 * Defined inline to avoid importing @preeternal/react-native-cookie-manager,
 * which internally calls TurboModuleRegistry.getEnforcing() at module load
 * time — throwing an uncatchable native invariant on builds without the module.
 */
interface NativeCookie {
  name: string;
  value: string;
  path?: string;
  domain?: string;
}

interface CookieManagerSpec extends TurboModule {
  getCookies(url: string, useWebKit?: boolean): Promise<Record<string, NativeCookie>>;
  clearAll(useWebKit?: boolean): Promise<boolean>;
}

/**
 * Use TurboModuleRegistry.get() (non-enforcing) — returns null if the
 * native module isn't compiled in, instead of throwing an invariant.
 */
const CookieManagerNative =
  TurboModuleRegistry.get<CookieManagerSpec>("CookieManager");

if (__DEV__) {
  console.log(
    `[CookieJar] Native CookieManager: ${CookieManagerNative ? "available" : "not available"}`
  );
}

type RpcResponse<T> = {
  result?: T;
  error?: {
    code: number;
    message: string;
  };
};

/**
 * Structured RPC error with a numeric `.code` property.
 * Callers can `instanceof RpcError` and switch on `.code` instead of parsing strings.
 */
export class RpcError extends Error {
  readonly code: number;
  constructor(code: number, message: string) {
    super(`RPC ${code}: ${message}`);
    this.name = "RpcError";
    this.code = code;
  }
}

/**
 * JS cookie jar that mirrors native iOS cookies for state checking
 * and diagnostics.
 *
 * React Native on iOS never exposes Set-Cookie response headers to JS
 * (facebook/react-native#19958). The native NSHTTPCookieStorage receives
 * them, but `response.headers.get("set-cookie")` returns null.
 *
 * This jar uses the CookieManager TurboModule to read cookies directly
 * from NSHTTPCookieStorage after each fetch. It is used for:
 * - `hasCookies()` checks during auth bootstrap
 * - `debugCookieState()` diagnostics
 *
 * Actual cookie sending is handled natively by NSURLSession via
 * `credentials: "include"` — matching the web app's behavior exactly.
 */
class CookieJar {
  /** name → value */
  private cookies = new Map<string, string>();

  /** Parse Set-Cookie headers from a fetch Response and store them. */
  capture(response: Response): void {
    // React Native exposes combined set-cookie header(s).
    const raw =
      response.headers.get("set-cookie") ??
      response.headers.get("Set-Cookie");

    if (!raw) return;

    // set-cookie may contain multiple cookies separated by commas when the
    // runtime combines them. Split on comma-followed-by-name=value heuristic.
    const parts = raw.split(/,(?=\s*[A-Za-z0-9_-]+=)/);
    for (const part of parts) {
      const trimmed = part.trim();
      // Extract just the name=value portion (before any ;)
      const nameValue = trimmed.split(";")[0]?.trim();
      if (!nameValue) continue;

      const eqIdx = nameValue.indexOf("=");
      if (eqIdx < 1) continue;

      const name = nameValue.slice(0, eqIdx).trim();
      const value = nameValue.slice(eqIdx + 1).trim();
      this.cookies.set(name, value);

      if (__DEV__) {
        console.log(`[CookieJar] Stored: ${name}`);
      }
    }
  }

  /** Build a Cookie header string, or null if empty. */
  buildHeader(): string | null {
    if (this.cookies.size === 0) return null;
    const pairs: string[] = [];
    this.cookies.forEach((value, name) => {
      pairs.push(`${name}=${value}`);
    });

    if (__DEV__) {
      console.log(`[CookieJar] Sending: ${Array.from(this.cookies.keys()).join(", ")}`);
    }

    return pairs.join("; ");
  }

  /** Clear all cookies (sign-out). */
  clear(): void {
    this.cookies.clear();
  }

  /**
   * Read cookies from the native iOS cookie store (NSHTTPCookieStorage)
   * and populate the JS-side map. This bridges the gap where Set-Cookie
   * headers are invisible to JS but ARE stored by the native layer.
   */
  async syncFromNative(apiHost: string): Promise<void> {
    if (!CookieManagerNative) return;

    try {
      // Must pass useWebKit explicitly — omitting it causes the TurboModule
      // bridge to misalign params, passing the resolve callback as useWebKit.
      const nativeCookies = await CookieManagerNative.getCookies(apiHost, false);

      for (const [name, cookie] of Object.entries(nativeCookies)) {
        this.cookies.set(name, cookie.value);
        if (__DEV__) {
          console.log(`[CookieJar] Synced native: ${name}`);
        }
      }
    } catch {
      if (__DEV__) {
        console.warn("[CookieJar] Native cookie sync failed");
      }
    }
  }
}

/**
 * RPC client for the Quickscope API.
 *
 * Cookie auth is handled natively by NSURLSession via `credentials: "include"`,
 * matching the web app's fetchBaseQuery behavior exactly. A JS-side CookieJar
 * mirrors native cookies for `hasCookies()` state checks and diagnostics.
 */
export class RpcClient {
  private readonly apiHost: string;
  private readonly jar = new CookieJar();

  /**
   * Optional handler invoked when a request fails with -32600 (auth required).
   * Should attempt to refresh the session and return true if successful.
   */
  private onAuthFailure: (() => Promise<boolean>) | null = null;

  /**
   * Promise-based refresh lock. When a refresh is in-flight, all concurrent
   * callers that also hit -32600 await the SAME promise rather than triggering
   * duplicate refreshes or being blocked.
   */
  private refreshPromise: Promise<boolean> | null = null;

  constructor(env: AppEnv) {
    this.apiHost = env.apiHost;
  }

  /**
   * Register a handler that will be called when a request fails with -32600.
   * The handler should attempt to refresh the session and return true if
   * the session was successfully refreshed (allowing a retry).
   */
  setAuthFailureHandler(handler: (() => Promise<boolean>) | null): void {
    this.onAuthFailure = handler;
  }

  /**
   * Check if the JS cookie jar has any cookies.
   * Used by bootstrap to verify that auth/refresh actually populated cookies.
   */
  hasCookies(): boolean {
    return this.jar.buildHeader() !== null;
  }

  /**
   * Clear all cookies — called on sign-out.
   * Clears both the JS jar and the native iOS cookie store.
   */
  async clearCookies(): Promise<void> {
    this.jar.clear();
    if (!CookieManagerNative) return;
    try {
      await CookieManagerNative.clearAll(false);
    } catch {
      if (__DEV__) {
        console.warn("[RpcClient] Failed to clear native cookies");
      }
    }
  }

  /**
   * Diagnostic: dump the current state of the cookie bridge for debugging.
   * Shows whether CookieManager is available, what's in the JS jar,
   * and what NSHTTPCookieStorage has for the API host.
   */
  async debugCookieState(): Promise<string[]> {
    const lines: string[] = [];
    lines.push(`CookieManagerNative: ${CookieManagerNative ? "AVAILABLE" : "NULL (module not in build)"}`);
    lines.push(`apiHost: ${this.apiHost}`);
    lines.push(`JS jar hasCookies: ${this.hasCookies()}`);
    const header = this.jar.buildHeader();
    lines.push(`JS jar header: ${header ?? "(empty)"}`);

    if (CookieManagerNative) {
      try {
        const native = await CookieManagerNative.getCookies(this.apiHost, false);
        const names = Object.keys(native);
        lines.push(`NSHTTPCookieStorage cookies: ${names.length > 0 ? names.join(", ") : "(none)"}`);
        for (const [name, cookie] of Object.entries(native)) {
          lines.push(`  ${name} = ${cookie.value.slice(0, 20)}... (domain: ${cookie.domain ?? "?"})`);
        }
      } catch (e) {
        lines.push(`NSHTTPCookieStorage error: ${String(e)}`);
      }
    } else {
      lines.push("NSHTTPCookieStorage: SKIPPED (no native module)");
    }

    return lines;
  }

  async call<T>(method: string, params: unknown[], _retryDepth = 0): Promise<T> {
    if (__DEV__) {
      console.log(`[RpcClient] → ${method} (depth=${_retryDepth})`);
    }

    // Match the web app exactly: only credentials:"include", no explicit
    // Cookie or Content-Type headers.  NSURLSession (the native fetch layer)
    // auto-attaches cookies from NSHTTPCookieStorage when credentials is
    // "include" — just like a browser does.  Previously we also injected an
    // explicit Cookie header from the JS jar, which conflicted with the
    // native cookie handling and caused -32600 auth failures.
    const response = await fetch(`${this.apiHost}/${method}`, {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({
        method,
        params,
      }),
    });

    // Capture any Set-Cookie headers from the response (harmless no-op on
    // iOS where headers aren't exposed, but works on other platforms).
    this.jar.capture(response);

    // Bridge native iOS cookies into the JS jar. NSHTTPCookieStorage always
    // receives Set-Cookie headers even when JS can't see them.
    await this.jar.syncFromNative(this.apiHost);

    const json = (await response.json()) as RpcResponse<T>;

    if (!response.ok) {
      throw new RpcError(response.status, `HTTP ${response.status}`);
    }

    if (json.error) {
      // If we got an auth failure (-32600), have a handler, haven't already
      // retried, and this isn't an auth/* method (which would cause a deadlock
      // since auth/refresh is called FROM the handler), try to refresh.
      if (
        json.error.code === -32600 &&
        this.onAuthFailure &&
        _retryDepth < 1 &&
        !method.startsWith("auth/")
      ) {
        if (__DEV__) {
          console.log(
            `[RpcClient] -32600 on ${method}, ${this.refreshPromise ? "joining existing" : "starting new"} refresh`
          );
        }

        try {
          let refreshed: boolean;

          if (this.refreshPromise) {
            // Another caller already started a refresh — join it
            refreshed = await this.refreshPromise;
          } else {
            // First caller to hit -32600 — start the refresh
            this.refreshPromise = this.onAuthFailure().finally(() => {
              this.refreshPromise = null;
            });
            refreshed = await this.refreshPromise;
          }

          if (refreshed) {
            if (__DEV__) {
              console.log(`[RpcClient] Refresh succeeded, retrying ${method}`);
            }
            return this.call<T>(method, params, _retryDepth + 1);
          }
        } catch {
          // Refresh itself failed — fall through to throw the original error
          if (__DEV__) {
            console.log(`[RpcClient] Refresh failed for ${method}`);
          }
        }
      }

      throw new RpcError(json.error.code, json.error.message);
    }

    if (json.result === undefined) {
      throw new RpcError(-1, "RPC response missing result");
    }

    return json.result;
  }
}
