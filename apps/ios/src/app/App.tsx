import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  AddressType,
  darkTheme,
  PhantomProvider,
  type PhantomSDKConfig,
  useAccounts,
} from "@phantom/react-native-sdk";
import {
  createNavigationContainerRef,
  NavigationContainer,
  DefaultTheme,
  Theme,
} from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { Pressable, Text, View } from "react-native";

import { loadEnv } from "@/src/config/env";
import { AuthSessionProvider, useAuthSession } from "@/src/features/auth/AuthSessionProvider";
import { WalletConnectProvider, useWalletConnect } from "@/src/features/wallet/WalletConnectProvider";
import { handlePhantomAppRedirect } from "@/src/features/wallet/phantomApp";
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
import { PortfolioScreen } from "@/src/screens/PortfolioScreen";
import { ReviewTradeScreen } from "@/src/screens/ReviewTradeScreen";
import { SearchScreen } from "@/src/screens/SearchScreen";
import { ScopeScreen } from "@/src/screens/ScopeScreen";
import { SpikeConsoleScreen } from "@/src/screens/SpikeConsoleScreen";
import { TrackingScreen } from "@/src/screens/TrackingScreen";
import { TokenDetailScreen } from "@/src/screens/TokenDetailScreen";
import { TradeEntryScreen } from "@/src/screens/TradeEntryScreen";
import { qsColors } from "@/src/theme/tokens";
import { AuthRouteGate } from "@/src/ui/AuthRouteGate";
import { RouteErrorBoundary } from "@/src/ui/RouteErrorBoundary";
import { OverflowMenu } from "@/src/ui/OverflowMenu";

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
      navigationRef.navigate("TradeEntry", target.params);
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
  const { logout, authenticateFromWallet, hasValidAccessToken, walletAddress } =
    useAuthSession();
  const { isConnected } = useAccounts();
  const { open: openWalletConnect, reset: resetWalletConnect } = useWalletConnect();
  const [isOverflowOpen, setIsOverflowOpen] = useState(false);
  const headerButtonStyle = {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: qsColors.bgCardSoft,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    alignItems: "center",
    justifyContent: "center",
  } as const;

  return (
    <>
      <Tabs.Navigator
        screenOptions={({ navigation, route }) => ({
          headerStyle: { backgroundColor: qsColors.bgCard },
          headerTintColor: qsColors.textPrimary,
          headerTitleAlign: "center",
          headerLeftContainerStyle: { paddingLeft: 12 },
          headerRightContainerStyle: { paddingRight: 12 },
          tabBarStyle: {
            backgroundColor: qsColors.bgCard,
            borderTopColor: qsColors.borderDefault,
            borderTopWidth: 1,
            paddingTop: 4,
            paddingBottom: 8,
            height: 58,
          },
          tabBarItemStyle: {
            flex: 1,
            width: "20%",
            justifyContent: "center",
            alignItems: "center",
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
            marginBottom: 0,
            lineHeight: 12,
            textAlign: "center",
          },
          tabBarIcon: ({ color, size }) => {
            const iconSize = size ?? 18;
            const iconName = (() => {
              switch (route.name) {
                case "Discovery":
                  return "compass";
                case "Scope":
                  return "target";
                case "Trade":
                  return "search";
                case "Tracking":
                  return "activity";
                case "Portfolio":
                  return "briefcase";
                default:
                  return "circle";
              }
            })();
            return <Feather name={iconName} size={iconSize} color={color} />;
          },
          tabBarActiveTintColor: qsColors.textPrimary,
          tabBarInactiveTintColor: qsColors.textSubtle,
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
                    style={headerButtonStyle}
                  >
                    <Text
                      style={{ color: qsColors.textPrimary, fontSize: 14, fontWeight: "700" }}
                    >
                      Q
                    </Text>
                  </Pressable>
                ),
          headerRight:
            route.name === "Dev"
              ? undefined
              : () => (
                  <Pressable
                    accessibilityLabel="Open menu"
                    onPress={() => setIsOverflowOpen(true)}
                    style={headerButtonStyle}
                  >
                    <View style={{ width: 18, height: 12, justifyContent: "space-between" }}>
                      <View
                        style={{
                          height: 2,
                          borderRadius: 1,
                          backgroundColor: qsColors.textSecondary,
                        }}
                      />
                      <View
                        style={{
                          height: 2,
                          borderRadius: 1,
                          backgroundColor: qsColors.textSecondary,
                        }}
                      />
                      <View
                        style={{
                          height: 2,
                          borderRadius: 1,
                          backgroundColor: qsColors.textSecondary,
                        }}
                      />
                    </View>
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
              <SearchScreen rpcClient={rpcClient} params={route.params} />
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
                <TrackingScreen rpcClient={rpcClient} params={route.params} />
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
                <PortfolioScreen rpcClient={rpcClient} params={route.params} />
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
      <OverflowMenu
        visible={isOverflowOpen}
        onClose={() => setIsOverflowOpen(false)}
        onAuthenticate={authenticateFromWallet}
        onOpenWalletModal={openWalletConnect}
        isAuthenticated={hasValidAccessToken}
        isWalletConnected={isConnected}
        walletAddress={walletAddress}
        onSignOut={async () => {
          await logout();
          resetWalletConnect();
          setIsOverflowOpen(false);
        }}
      />
    </>
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
      if (handlePhantomAppRedirect(rawUrl)) {
        return;
      }

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
        <WalletConnectProvider>
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
                    <TokenDetailScreen rpcClient={rpcClient} params={route.params} />
                  </RouteErrorBoundary>
                )}
              />
              <Stack.Screen
                name="TradeEntry"
                options={{ title: "Trade", headerBackButtonDisplayMode: "minimal" }}
                children={({ route }) => (
                  <RouteErrorBoundary routeName="Trade">
                    <AuthRouteGate
                      featureName="Trade"
                      subtitle="Connect to request quotes and execute trades."
                    >
                      <TradeEntryScreen rpcClient={rpcClient} params={route.params} />
                    </AuthRouteGate>
                  </RouteErrorBoundary>
                )}
              />
              <Stack.Screen
                name="ReviewTrade"
                options={{ title: "Review Trade", headerBackButtonDisplayMode: "minimal" }}
                children={({ route }) => (
                  <RouteErrorBoundary routeName="Review Trade">
                    <AuthRouteGate
                      featureName="Trade"
                      subtitle="Connect to review and execute trades."
                    >
                      <ReviewTradeScreen
                        rpcClient={rpcClient}
                        executionEnabled={env.enableSwapExecution}
                        params={route.params}
                      />
                    </AuthRouteGate>
                  </RouteErrorBoundary>
                )}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </WalletConnectProvider>
      </AuthSessionProvider>
    </PhantomProvider>
  );
}
