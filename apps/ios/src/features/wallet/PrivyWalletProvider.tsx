import { PropsWithChildren } from "react";

import { PrivyProvider } from "@privy-io/expo";

import { AppEnv } from "@/src/config/env";

type PrivyWalletProviderProps = PropsWithChildren<{
  env: AppEnv;
}>;

export function PrivyWalletProvider({ env, children }: PrivyWalletProviderProps) {
  return (
    <PrivyProvider
      appId={env.privyAppId}
      clientId={env.privyClientId}
      config={{
        embedded: {
          solana: {
            createOnLogin: "all-users",
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
