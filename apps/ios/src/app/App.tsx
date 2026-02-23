import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";

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
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";

import { toastConfig } from "@/src/ui/toast/toastConfig";

import { loadEnv } from "@/src/config/env";
import { AuthSessionProvider } from "@/src/features/auth/AuthSessionProvider";
import { RpcClient } from "@/src/lib/api/rpcClient";
import {
  parseQuickscopeDeepLink,
  type ParsedDeepLinkTarget,
} from "@/src/navigation/deepLinks";
import {
  RootStack,
  RootTabs,
  TelegramRouteParams,
} from "@/src/navigation/types";
import { MvpPlaceholderScreen } from "@/src/screens/MvpPlaceholderScreen";
import { DiscoveryScreen } from "@/src/screens/DiscoveryScreen";
import { ScopeScreen } from "@/src/screens/ScopeScreen";
import { SearchScreen } from "@/src/screens/SearchScreen";

// Lazy-loaded screens (not needed at startup)
const PortfolioScreen = React.lazy(() =>
  import("@/src/screens/PortfolioScreen").then((m) => ({ default: m.PortfolioScreen }))
);
const DepositScreen = React.lazy(() =>
  import("@/src/screens/DepositScreen").then((m) => ({ default: m.DepositScreen }))
);
const RewardsScreen = React.lazy(() =>
  import("@/src/screens/RewardsScreen").then((m) => ({ default: m.RewardsScreen }))
);
const SpikeConsoleScreen = React.lazy(() =>
  import("@/src/screens/SpikeConsoleScreen").then((m) => ({ default: m.SpikeConsoleScreen }))
);
const TrackingScreen = React.lazy(() =>
  import("@/src/screens/TrackingScreen").then((m) => ({ default: m.TrackingScreen }))
);
const TokenDetailScreen = React.lazy(() =>
  import("@/src/screens/TokenDetailScreen").then((m) => ({ default: m.TokenDetailScreen }))
);
const WalletDetailScreen = React.lazy(() =>
  import("@/src/screens/walletDetail/WalletDetailScreen").then((m) => ({ default: m.WalletDetailScreen }))
);
import { qsColors } from "@/src/theme/tokens";
import { AuthRouteGate } from "@/src/ui/AuthRouteGate";
import { RouteErrorBoundary } from "@/src/ui/RouteErrorBoundary";
import { SlideOutDrawer } from "@/src/ui/SlideOutDrawer";
import { QSLogoIcon, Compass, Crosshair, Search, Activity, Wallet, Menu } from "@/src/ui/icons";

function LazyFallback() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: qsColors.layer0 }}>
      <ActivityIndicator color={qsColors.accent} />
    </View>
  );
}

const Tabs = createBottomTabNavigator<RootTabs>();
const Stack = createNativeStackNavigator<RootStack>();
const hiddenTabOptions = {
  tabBarButton: () => null,
  tabBarItemStyle: { width: 0, flex: 0, padding: 0 },
};

const navigationTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: qsColors.layer0,
    card: qsColors.layer0,
    text: qsColors.textPrimary,
    border: "transparent",
    primary: qsColors.accent,
  },
};

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
      navigationRef.navigate("TokenDetail", {
        tokenAddress: target.params?.tokenAddress ?? "",
      });
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

function MainTabsNavigator({
  rpcClient,
  wsHost,
  onOpenDrawer,
}: {
  rpcClient: RpcClient;
  wsHost: string;
  onOpenDrawer: () => void;
}) {
  return (
    <Tabs.Navigator
      screenOptions={({ navigation, route }) => ({
        headerStyle: {
          backgroundColor: qsColors.layer0,
          shadowColor: "transparent",
          elevation: 0,
        },
        headerShadowVisible: false,
        headerTintColor: qsColors.textPrimary,
        tabBarStyle: {
          backgroundColor: qsColors.layer0,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: qsColors.accent,
        tabBarInactiveTintColor: qsColors.textTertiary,
        tabBarLabelStyle: { fontSize: 10 },
        tabBarItemStyle: { flex: 1 },
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
                    width: 28,
                    height: 28,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <QSLogoIcon size={28} />
                </Pressable>
              ),
        headerRight:
          route.name === "Dev"
            ? undefined
            : () => (
                <Pressable
                  accessibilityLabel="Open Menu"
                  onPress={onOpenDrawer}
                  style={{
                    marginRight: 12,
                    width: 32,
                    height: 32,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Menu size={22} color={qsColors.textSecondary} />
                </Pressable>
              ),
      })}
    >
      <Tabs.Screen name="Discovery" options={{ title: "Discover", tabBarLabel: "Discover", tabBarIcon: ({ color, size }) => <Compass size={size} color={color} /> }}>
        {({ route }) => (
          <RouteErrorBoundary routeName="Discovery">
            <DiscoveryScreen rpcClient={rpcClient} params={route.params} />
          </RouteErrorBoundary>
        )}
      </Tabs.Screen>
      <Tabs.Screen name="Scope" options={{ title: "Scope", tabBarIcon: ({ color, size }) => <Crosshair size={size} color={color} /> }}>
        {({ route }) => (
          <RouteErrorBoundary routeName="Scope">
            <ScopeScreen rpcClient={rpcClient} params={route.params} />
          </RouteErrorBoundary>
        )}
      </Tabs.Screen>
      <Tabs.Screen name="Trade" options={{ title: "Search", tabBarLabel: "Search", tabBarIcon: ({ color, size }) => <Search size={size} color={color} /> }}>
        {({ route }) => (
          <RouteErrorBoundary routeName="Trade">
            <SearchScreen rpcClient={rpcClient} params={route.params} />
          </RouteErrorBoundary>
        )}
      </Tabs.Screen>
      <Tabs.Screen name="Tracking" options={{ title: "Tracking", tabBarIcon: ({ color, size }) => <Activity size={size} color={color} /> }}>
        {({ route }) => (
          <RouteErrorBoundary routeName="Tracking">
            <AuthRouteGate
              featureName="Tracking"
              subtitle="Connect to manage tracked wallets and token alerts."
            >
              <Suspense fallback={<LazyFallback />}>
                <TrackingScreen rpcClient={rpcClient} params={route.params} />
              </Suspense>
            </AuthRouteGate>
          </RouteErrorBoundary>
        )}
      </Tabs.Screen>
      <Tabs.Screen name="Portfolio" options={{ title: "Portfolio", tabBarIcon: ({ color, size }) => <Wallet size={size} color={color} /> }}>
        {({ route }) => (
          <RouteErrorBoundary routeName="Portfolio">
            <AuthRouteGate
              featureName="Portfolio"
              subtitle="Connect to load balances, PnL, and position details."
            >
              <Suspense fallback={<LazyFallback />}>
                <PortfolioScreen rpcClient={rpcClient} params={route.params} />
              </Suspense>
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
            <Suspense fallback={<LazyFallback />}>
              <SpikeConsoleScreen rpcClient={rpcClient} wsHost={wsHost} />
            </Suspense>
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
  const [drawerVisible, setDrawerVisible] = useState(false);

  const phantomConfig = useMemo<PhantomSDKConfig>(
    () => ({
      providers: ["google", "apple", "phantom"],
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

  const openDrawer = useCallback(() => setDrawerVisible(true), []);
  const closeDrawer = useCallback(() => setDrawerVisible(false), []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
                headerStyle: {
                  backgroundColor: qsColors.layer0,
                },
                headerShadowVisible: false,
                headerTintColor: qsColors.textPrimary,
                contentStyle: { backgroundColor: qsColors.layer0 },
              }}
            >
              <Stack.Screen
                name="MainTabs"
                options={{ headerShown: false }}
                children={() => (
                  <MainTabsNavigator
                    rpcClient={rpcClient}
                    wsHost={env.wsHost}
                    onOpenDrawer={openDrawer}
                  />
                )}
              />
              <Stack.Screen
                name="TokenDetail"
                options={{ headerShown: false }}
                children={({ route }) => (
                  <RouteErrorBoundary routeName="Token Detail">
                    <Suspense fallback={<LazyFallback />}>
                      <TokenDetailScreen rpcClient={rpcClient} params={route.params} />
                    </Suspense>
                  </RouteErrorBoundary>
                )}
              />
              <Stack.Screen
                name="WalletDetail"
                options={{ headerShown: false }}
                children={({ route }) => (
                  <RouteErrorBoundary routeName="Wallet Detail">
                    <Suspense fallback={<LazyFallback />}>
                      <WalletDetailScreen rpcClient={rpcClient} params={route.params} />
                    </Suspense>
                  </RouteErrorBoundary>
                )}
              />
              <Stack.Screen
                name="Rewards"
                options={{ title: "Rewards", headerBackButtonDisplayMode: "minimal" }}
                children={() => (
                  <RouteErrorBoundary routeName="Rewards">
                    <AuthRouteGate
                      featureName="Rewards"
                      subtitle="Connect to view earnings and claim rewards."
                    >
                      <Suspense fallback={<LazyFallback />}>
                        <RewardsScreen rpcClient={rpcClient} />
                      </Suspense>
                    </AuthRouteGate>
                  </RouteErrorBoundary>
                )}
              />
              <Stack.Screen
                name="Deposit"
                options={{ title: "Deposit", headerBackButtonDisplayMode: "minimal" }}
                children={() => (
                  <RouteErrorBoundary routeName="Deposit">
                    <AuthRouteGate
                      featureName="Deposit"
                      subtitle="Connect to view your deposit address."
                    >
                      <Suspense fallback={<LazyFallback />}>
                        <DepositScreen />
                      </Suspense>
                    </AuthRouteGate>
                  </RouteErrorBoundary>
                )}
              />
            </Stack.Navigator>
            <SlideOutDrawer visible={drawerVisible} onClose={closeDrawer} />
          </NavigationContainer>
        </AuthSessionProvider>
      </PhantomProvider>
      <Toast config={toastConfig} />
    </GestureHandlerRootView>
  );
}
