import { AppEnv } from "@/src/config/env";

type RpcResponse<T> = {
  result?: T;
  error?: {
    code: number;
    message: string;
  };
};

/**
 * RPC client for the Quickscope API.
 *
 * The backend sets auth tokens as httpOnly cookies via Set-Cookie headers.
 * On iOS, React Native's native networking (NSURLSession) stores these
 * cookies automatically in NSHTTPCookieStorage and replays them on
 * subsequent requests when `credentials: "include"` is set.
 *
 * As a defensive fallback, we also try to capture any Set-Cookie headers
 * that are visible to JS and manually replay them via a Cookie header.
 * This handles cases where the native cookie jar is unreliable.
 */
export class RpcClient {
  private readonly apiHost: string;
  /**
   * Fallback cookie jar: captures visible Set-Cookie response headers.
   * HttpOnly cookies may not be visible to JS, so the native cookie jar
   * is the primary mechanism. This is a belt-and-suspenders backup.
   */
  private cookieJar: Map<string, string> = new Map();

  constructor(env: AppEnv) {
    this.apiHost = env.apiHost;
  }

  /**
   * Clear all stored cookies — called on sign-out.
   */
  clearCookies(): void {
    this.cookieJar.clear();
  }

  /**
   * Extract visible Set-Cookie values from a fetch Response and store them.
   */
  private captureResponseCookies(response: Response): void {
    const rawSetCookie = response.headers.get("set-cookie");
    if (!rawSetCookie) {
      return;
    }

    // iOS RN may return multiple Set-Cookie values joined by ", " or ","
    // Each cookie directive is "name=value; Path=/; ..."
    const cookieDirectives = rawSetCookie.split(/,\s*(?=[A-Za-z0-9_.-]+=)/);

    for (const directive of cookieDirectives) {
      const trimmed = directive.trim();
      if (!trimmed) continue;

      // Extract "name=value" from "name=value; Path=/; HttpOnly; ..."
      const nameValuePart = trimmed.split(";")[0]?.trim();
      if (!nameValuePart || !nameValuePart.includes("=")) continue;

      const eqIndex = nameValuePart.indexOf("=");
      const cookieName = nameValuePart.substring(0, eqIndex).trim();
      if (!cookieName) continue;

      this.cookieJar.set(cookieName, nameValuePart);
    }

    if (__DEV__ && this.cookieJar.size > 0) {
      console.log(
        `[RpcClient] Captured cookies: ${Array.from(this.cookieJar.keys()).join(", ")}`
      );
    }
  }

  /**
   * Build the Cookie request header from our fallback jar.
   */
  private buildCookieHeader(): string | null {
    if (this.cookieJar.size === 0) return null;
    return Array.from(this.cookieJar.values()).join("; ");
  }

  async call<T>(method: string, params: unknown[]): Promise<T> {
    const headers: Record<string, string> = {
      "content-type": "application/json",
    };

    // Only attach manual Cookie header if we have captured cookies.
    // Otherwise, let the native NSHTTPCookieStorage handle it via
    // credentials: "include".
    const cookieHeader = this.buildCookieHeader();
    if (cookieHeader) {
      headers["cookie"] = cookieHeader;
    }

    const response = await fetch(`${this.apiHost}/${method}`, {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify({
        method,
        params,
      }),
    });

    // Capture any visible Set-Cookie headers from this response
    this.captureResponseCookies(response);

    const json = (await response.json()) as RpcResponse<T>;

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    if (json.error) {
      throw new Error(`RPC ${json.error.code}: ${json.error.message}`);
    }

    if (json.result === undefined) {
      throw new Error("RPC response missing result");
    }

    return json.result;
  }
}
