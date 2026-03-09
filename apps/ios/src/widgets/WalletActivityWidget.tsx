import { Text, VStack, HStack, Spacer } from "@expo/ui/swift-ui";
import { background, font, foregroundStyle, padding } from "@expo/ui/swift-ui/modifiers";
import { createWidget, WidgetBase } from "expo-widgets";

type HotToken = {
  symbol: string;
  tradeCount: string;
  volumeSol: string;
  buyRatio: number;
};

type WalletActivityWidgetProps = {
  windowLabel: string;
  tokens: HotToken[];
  updatedAt: string;
};

const WalletActivityWidget = (
  props: WidgetBase<WalletActivityWidgetProps>
) => {
  "widget";
  if (props.family === "systemSmall") {
    return (
      <VStack spacing={6} alignment="leading" modifiers={[padding({ all: 12 }), background("#0a0810")]}>
        <Text
          modifiers={[font({ size: 11, weight: "medium" }), foregroundStyle("#7b6e9a")]}
        >
          Wallets · {props.windowLabel}
        </Text>
        {props.tokens.map((token, i) => (
          <HStack key={i} spacing={4}>
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
              {token.tradeCount} trades
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
        Wallet Activity · {props.windowLabel}
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
            {token.volumeSol} SOL
          </Text>
          <Text
            modifiers={[
              font({ size: 12, weight: "medium" }),
              foregroundStyle(token.buyRatio >= 0.5 ? "#4ade80" : "#f87171"),
            ]}
          >
            {Math.round(token.buyRatio * 100)}% buys
          </Text>
          <Text
            modifiers={[
              font({ size: 12, weight: "medium" }),
              foregroundStyle("#7b6e9a"),
            ]}
          >
            {token.tradeCount}
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

export default createWidget("WalletActivityWidget", WalletActivityWidget);
