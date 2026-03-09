import { Text, VStack, HStack, Spacer } from "@expo/ui/swift-ui";
import { background, font, foregroundStyle, padding } from "@expo/ui/swift-ui/modifiers";
import { createWidget, WidgetBase } from "expo-widgets";

type WatchlistToken = {
  symbol: string;
  marketCap: string;
  oneHourChange: string;
  isPositive: boolean;
};

type WatchlistWidgetProps = {
  watchlistName: string;
  tokens: WatchlistToken[];
  updatedAt: string;
};

const WatchlistWidget = (props: WidgetBase<WatchlistWidgetProps>) => {
  "widget";
  if (props.family === "systemSmall") {
    return (
      <VStack spacing={6} alignment="leading" modifiers={[padding({ all: 12 }), background("#0a0810")]}>
        <Text
          modifiers={[font({ size: 11, weight: "medium" }), foregroundStyle("#7b6e9a")]}
        >
          {props.watchlistName}
        </Text>
        {props.tokens.map((token, i) => (
          <HStack key={i} spacing={6}>
            <Text
              modifiers={[font({ size: 13, weight: "semibold" }), foregroundStyle("#f8f7fb")]}
            >
              {token.symbol}
            </Text>
            <Spacer />
            <Text
              modifiers={[
                font({ size: 12, weight: "medium" }),
                foregroundStyle(token.isPositive ? "#4ade80" : "#f87171"),
              ]}
            >
              {token.oneHourChange}
            </Text>
          </HStack>
        ))}
        <Spacer />
        <Text
          modifiers={[font({ size: 10, weight: "regular" }), foregroundStyle("#5f596c")]}
        >
          {props.updatedAt}
        </Text>
      </VStack>
    );
  }
  return (
    <VStack spacing={6} alignment="leading" modifiers={[padding({ all: 12 }), background("#0a0810")]}>
      <Text
        modifiers={[font({ size: 11, weight: "medium" }), foregroundStyle("#7b6e9a")]}
      >
        {props.watchlistName}
      </Text>
      {props.tokens.map((token, i) => (
        <HStack key={i} spacing={8}>
          <Text
            modifiers={[
              font({ size: 13, weight: "semibold" }),
              foregroundStyle("#f8f7fb"),
            ]}
          >
            {token.symbol}
          </Text>
          <Spacer />
          <Text
            modifiers={[
              font({ size: 12, weight: "medium" }),
              foregroundStyle("#b7a8d9"),
            ]}
          >
            {token.marketCap}
          </Text>
          <Text
            modifiers={[
              font({ size: 12, weight: "medium" }),
              foregroundStyle(token.isPositive ? "#4ade80" : "#f87171"),
            ]}
          >
            {token.oneHourChange}
          </Text>
        </HStack>
      ))}
      <Spacer />
      <Text
        modifiers={[font({ size: 10, weight: "regular" }), foregroundStyle("#5f596c")]}
      >
        {props.updatedAt}
      </Text>
    </VStack>
  );
};

export default createWidget("WatchlistWidget", WatchlistWidget);
