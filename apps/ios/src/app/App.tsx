import { useCallback, useEffect, useMemo, useRef } from "react";

import {
  AddressType,
  darkTheme,
  PhantomProvider,
  type PhantomSDKConfig,
} from "@phantom/react-native-sdk";
import {
  createNavigationContainerRef,
  NavigationContainer,
  DefaultTheme,
  Theme,
} from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
import { Pressable, Text } from "react-native";

import { loadEnv } from "@/src/config/env";
import { AuthSessionProvider } from "@/src/features/auth/AuthSessionProvider";
import { RpcClient } from "@/src/lib/api/rpcClient";
import {
  parseQuickscopeDeepLink,
  type ParsedDeepLinkTarget,
} from "@/src/navigation/deepLinks";
import {
  PortfolioRouteParams,
  RootStack,
  RootTabs,
  TelegramRouteParams,
  TrackingRouteParams,
} from "@/src/navigation/types";
import { MvpPlaceholderScreen } from "@/src/screens/MvpPlaceholderScreen";
import { DiscoveryScreen } from "@/src/screens/DiscoveryScreen";
import { SearchScreen } from "@/src/screens/SearchScreen";
import { ScopeScreen } from "@/src/screens/ScopeScreen";
import { SpikeConsoleScreen } from "@/src/screens/SpikeConsoleScreen";
import { TokenDetailScreen } from "@/src/screens/TokenDetailScreen";
import { qsColors } from "@/src/theme/tokens";
import { AuthRouteGate } from "@/src/ui/AuthRouteGate";
import { RouteErrorBoundary } from "@/src/ui/RouteErrorBoundary";

const Tabs = createBottomTabNavigator<RootTabs>();
const Stack = createNativeStackNavigator<RootStack>();
const hiddenTabOptions = {
  tabBarButton: () => null,
};

const navigationTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: qsColors.bgCanvas,
    card: qsColors.bgCard,
    text: qsColors.textPrimary,
    border: qsColors.borderDefault,
    primary: qsColors.accent,
  },
};

function getPortfolioContextLines(params?: PortfolioRouteParams): string[] | undefined {
  if (!params?.source) {
    return undefined;
  }

  const lines = ["Opened from a deep link."];
  if (params.walletAddress) {
    lines.push(`Wallet: ${params.walletAddress}`);
  }

  return lines;
}

function getTrackingContextLines(params?: TrackingRouteParams): string[] | undefined {
  if (!params?.source) {
    return undefined;
  }

  const lines = ["Opened from a deep link."];
  if (params.walletAddress) {
    lines.push(`Wallet: ${params.walletAddress}`);
  }

  return lines;
}

function getTelegramContextLines(params?: TelegramRouteParams): string[] | undefined {
  if (!params?.source) {
    return undefined;
  }

  const lines = ["Opened from a deep link."];
  if (params.action) {
    lines.push(`Action: ${params.action}`);
  }
  if (params.tokenAddress) {
    lines.push(`Token: ${params.tokenAddress}`);
  }
  if (params.chatId) {
    lines.push(`Chat ID: ${params.chatId}`);
  }

  return lines;
}

function navigateToTarget(
  navigationRef: ReturnType<typeof createNavigationContainerRef<RootStack>>,
  target: ParsedDeepLinkTarget
) {
  switch (target.screen) {
    case null:
      return;
    case "Discovery":
      navigationRef.navigate("MainTabs", { screen: "Discovery", params: target.params });
      return;
    case "Scope":
      navigationRef.navigate("MainTabs", { screen: "Scope", params: target.params });
      return;
    case "Trade":
      navigationRef.navigate("MainTabs", { screen: "Trade", params: target.params });
      return;
    case "Portfolio":
      navigationRef.navigate("MainTabs", { screen: "Portfolio", params: target.params });
      return;
    case "Tracking":
      navigationRef.navigate("MainTabs", { screen: "Tracking", params: target.params });
      return;
    case "Telegram":
      navigationRef.navigate("MainTabs", { screen: "Telegram", params: target.params });
      return;
    case "TokenDetail":
      navigationRef.navigate("TokenDetail", target.params);
      return;
    case "Dev":
      navigationRef.navigate("MainTabs", { screen: "Dev" });
      return;
  }
}

function MainTabsNavigator({ rpcClient, wsHost }: { rpcClient: RpcClient; wsHost: string }) {
  return (
    <Tabs.Navigator
      screenOptions={({ navigation, route }) => ({
        headerStyle: { backgroundColor: qsColors.bgCard },
        headerTintColor: qsColors.textPrimary,
        tabBarStyle: {
          backgroundColor: qsColors.bgCard,
          borderTopColor: qsColors.borderDefault,
        },
        tabBarLabelStyle: { fontSize: 11 },
        headerTitle: ({ children }) => (
          <Text style={{ color: qsColors.textPrimary, fontSize: 17, fontWeight: "600" }}>
            {children}
          </Text>
        ),
        headerLeft:
          route.name === "Dev"
            ? undefined
            : () => (
                <Pressable
                  accessibilityLabel="Open Dev Console"
                  onPress={() => navigation.navigate("Dev")}
                  style={{
                    marginLeft: 12,
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: "#2a2f4a",
                    borderWidth: 1,
                    borderColor: qsColors.borderDefault,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: qsColors.textPrimary, fontSize: 14, fontWeight: "700" }}>
                    Q
                  </Text>
                </Pressable>
              ),
      })}
    >
      <Tabs.Screen name="Discovery" options={{ title: "Discover", tabBarLabel: "Discover" }}>
        {({ route }) => (
          <RouteErrorBoundary routeName="Discovery">
            <DiscoveryScreen rpcClient={rpcClient} params={route.params} />
          </RouteErrorBoundary>
        )}
      </Tabs.Screen>
      <Tabs.Screen name="Scope" options={{ title: "Scope" }}>
        {({ route }) => (
          <RouteErrorBoundary routeName="Scope">
            <ScopeScreen rpcClient={rpcClient} params={route.params} />
          </RouteErrorBoundary>
        )}
      </Tabs.Screen>
      <Tabs.Screen name="Trade" options={{ title: "Search", tabBarLabel: "Search" }}>
        {({ route }) => (
          <RouteErrorBoundary routeName="Trade">
            <AuthRouteGate
              featureName="Search"
              subtitle="Connect to access token search and quick action workflows."
            >
              <SearchScreen rpcClient={rpcClient} params={route.params} />
            </AuthRouteGate>
          </RouteErrorBoundary>
        )}
      </Tabs.Screen>
      <Tabs.Screen name="Tracking" options={{ title: "Tracking" }}>
        {({ route }) => (
          <RouteErrorBoundary routeName="Tracking">
            <AuthRouteGate
              featureName="Tracking"
              subtitle="Connect to manage tracked wallets and token alerts."
            >
              <MvpPlaceholderScreen
                title="Tracking"
                description="Wallet and token tracking workflows are planned for Week 3."
                contextLines={getTrackingContextLines(route.params)}
              />
            </AuthRouteGate>
          </RouteErrorBoundary>
        )}
      </Tabs.Screen>
      <Tabs.Screen name="Portfolio" options={{ title: "Portfolio" }}>
        {({ route }) => (
          <RouteErrorBoundary routeName="Portfolio">
            <AuthRouteGate
              featureName="Portfolio"
              subtitle="Connect to load balances, PnL, and position details."
            >
              <MvpPlaceholderScreen
                title="Portfolio"
                description="Portfolio and positions details are planned for Week 3 and Week 5."
                contextLines={getPortfolioContextLines(route.params)}
              />
            </AuthRouteGate>
          </RouteErrorBoundary>
        )}
      </Tabs.Screen>
      <Tabs.Screen name="Telegram" options={{ title: "Telegram", ...hiddenTabOptions }}>
        {({ route }) => (
          <RouteErrorBoundary routeName="Telegram">
            <AuthRouteGate
              featureName="Telegram"
              subtitle="Connect to link Telegram and share token updates."
            >
              <MvpPlaceholderScreen
                title="Telegram"
                description="Native Telegram link/share flows are targeted in Week 6."
                contextLines={getTelegramContextLines(route.params)}
              />
            </AuthRouteGate>
          </RouteErrorBoundary>
        )}
      </Tabs.Screen>
      <Tabs.Screen
        name="Dev"
        options={{ title: "Dev Console", ...hiddenTabOptions }}
        children={() => (
          <RouteErrorBoundary routeName="Dev Console">
            <SpikeConsoleScreen rpcClient={rpcClient} wsHost={wsHost} />
          </RouteErrorBoundary>
        )}
      />
    </Tabs.Navigator>
  );
}

export default function App() {
  const env = useMemo(() => loadEnv(), []);
  const rpcClient = useMemo(() => new RpcClient(env), [env]);
  const navigationRef = useRef(createNavigationContainerRef<RootStack>()).current;
  const pendingDeepLinkRef = useRef<ReturnType<typeof parseQuickscopeDeepLink> | null>(
    null
  );

  const phantomConfig = useMemo<PhantomSDKConfig>(
    () => ({
      providers: ["google", "apple"],
      appId: env.phantomAppId,
      scheme: "quickscope",
      addressTypes: [AddressType.solana],
      authOptions: {
        redirectUrl: "quickscope://phantom-auth-callback",
      },
    }),
    [env.phantomAppId]
  );

  const navigateFromDeepLink = useCallback(
    (rawUrl: string) => {
      const target = parseQuickscopeDeepLink(rawUrl);
      if (!navigationRef.isReady()) {
        pendingDeepLinkRef.current = target;
        return;
      }

      navigateToTarget(navigationRef, target);
    },
    [navigationRef]
  );

  useEffect(() => {
    let isUnmounted = false;

    Linking.getInitialURL().then((url) => {
      if (!isUnmounted && url) {
        navigateFromDeepLink(url);
      }
    });

    const subscription = Linking.addEventListener("url", ({ url }) => {
      navigateFromDeepLink(url);
    });

    return () => {
      isUnmounted = true;
      subscription.remove();
    };
  }, [navigateFromDeepLink]);

  return (
    <PhantomProvider
      config={phantomConfig}
      theme={darkTheme}
      appName="Quickscope"
      appIcon="https://app.quickscope.gg/favicon.ico"
    >
      <AuthSessionProvider rpcClient={rpcClient}>
        <NavigationContainer
          ref={navigationRef}
          theme={navigationTheme}
          onReady={() => {
            const pendingDeepLink = pendingDeepLinkRef.current;
            if (!pendingDeepLink) {
              return;
            }

            pendingDeepLinkRef.current = null;
            navigateToTarget(navigationRef, pendingDeepLink);
          }}
        >
          <Stack.Navigator
            initialRouteName="MainTabs"
            screenOptions={{
              headerStyle: { backgroundColor: qsColors.bgCard },
              headerTintColor: qsColors.textPrimary,
              contentStyle: { backgroundColor: qsColors.bgCanvas },
            }}
          >
            <Stack.Screen
              name="MainTabs"
              options={{ headerShown: false }}
              children={() => <MainTabsNavigator rpcClient={rpcClient} wsHost={env.wsHost} />}
            />
            <Stack.Screen
              name="TokenDetail"
              options={{ title: "Token Detail", headerBackButtonDisplayMode: "minimal" }}
              children={({ route }) => (
                <RouteErrorBoundary routeName="Token Detail">
                  <TokenDetailScreen params={route.params} />
                </RouteErrorBoundary>
              )}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </AuthSessionProvider>
    </PhantomProvider>
  );
}
