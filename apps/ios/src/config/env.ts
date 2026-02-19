export type AppEnv = {
  apiHost: string;
  wsHost: string;
  solanaRpcEndpoint: string;
  phantomAppId: string;
  enableSwapExecution: boolean;
  posthogKey?: string;
  posthogHost?: string;
};

function getRequiredEnvValue(key: string, value: string | undefined): string {
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required env var: ${key}`);
  }

  return value.trim();
}

function stripTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function parseBooleanFlag(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

export function loadEnv(): AppEnv {
  return {
    apiHost: stripTrailingSlash(
      getRequiredEnvValue("EXPO_PUBLIC_API_HOST", process.env.EXPO_PUBLIC_API_HOST)
    ),
    wsHost: stripTrailingSlash(
      getRequiredEnvValue("EXPO_PUBLIC_WS_HOST", process.env.EXPO_PUBLIC_WS_HOST)
    ),
    solanaRpcEndpoint: getRequiredEnvValue(
      "EXPO_PUBLIC_SOLANA_RPC_ENDPOINT",
      process.env.EXPO_PUBLIC_SOLANA_RPC_ENDPOINT
    ),
    phantomAppId: getRequiredEnvValue(
      "EXPO_PUBLIC_PHANTOM_APP_ID",
      process.env.EXPO_PUBLIC_PHANTOM_APP_ID
    ),
    enableSwapExecution: parseBooleanFlag(process.env.EXPO_PUBLIC_ENABLE_SWAP_EXECUTION),
    posthogKey: process.env.EXPO_PUBLIC_POSTHOG_KEY?.trim(),
    posthogHost: process.env.EXPO_PUBLIC_POSTHOG_HOST?.trim(),
  };
}
