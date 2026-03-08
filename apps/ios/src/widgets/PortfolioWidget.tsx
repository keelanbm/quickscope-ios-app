import { Text, VStack, HStack, Spacer } from "@expo/ui/swift-ui";
import { font, foregroundStyle, padding } from "@expo/ui/swift-ui/modifiers";
import { createWidget, WidgetBase } from "expo-widgets";

type TokenHolding = {
  symbol: string;
  valueUsd: string;
  pnlPercent: string;
  isPositive: boolean;
};

type PortfolioWidgetProps = {
  totalValueUsd: string;
  pnl24h: string;
  pnl24hPercent: string;
  isPnlPositive: boolean;
  unrealizedPnl: string;
  topHoldings: TokenHolding[];
  updatedAt: string;
};

const SmallLayout = (props: WidgetBase<PortfolioWidgetProps>) => {
  "widget";
  return (
    <VStack spacing={4} modifiers={[padding({ all: 12 })]}>
      <Text
        modifiers={[font({ size: 11, weight: "medium" }), foregroundStyle("#7b6e9a")]}
      >
        Portfolio
      </Text>
      <Text
        modifiers={[font({ size: 22, weight: "bold" }), foregroundStyle("#f8f7fb")]}
      >
        {props.totalValueUsd}
      </Text>
      <HStack spacing={4}>
        <Text
          modifiers={[
            font({ size: 13, weight: "semibold" }),
            foregroundStyle(props.isPnlPositive ? "#4ade80" : "#f87171"),
          ]}
        >
          {props.pnl24h}
        </Text>
        <Text
          modifiers={[
            font({ size: 11, weight: "medium" }),
            foregroundStyle(props.isPnlPositive ? "#4ade80" : "#f87171"),
          ]}
        >
          {props.pnl24hPercent}
        </Text>
      </HStack>
      <Spacer />
      <Text
        modifiers={[font({ size: 10, weight: "regular" }), foregroundStyle("#5f596c")]}
      >
        {props.updatedAt}
      </Text>
    </VStack>
  );
};

const MediumLayout = (props: WidgetBase<PortfolioWidgetProps>) => {
  "widget";
  return (
    <HStack spacing={16} modifiers={[padding({ all: 12 })]}>
      <VStack spacing={4} alignment="leading">
        <Text
          modifiers={[font({ size: 11, weight: "medium" }), foregroundStyle("#7b6e9a")]}
        >
          Portfolio
        </Text>
        <Text
          modifiers={[font({ size: 22, weight: "bold" }), foregroundStyle("#f8f7fb")]}
        >
          {props.totalValueUsd}
        </Text>
        <HStack spacing={4}>
          <Text
            modifiers={[
              font({ size: 13, weight: "semibold" }),
              foregroundStyle(props.isPnlPositive ? "#4ade80" : "#f87171"),
            ]}
          >
            {props.pnl24h}
          </Text>
          <Text
            modifiers={[
              font({ size: 11, weight: "medium" }),
              foregroundStyle(props.isPnlPositive ? "#4ade80" : "#f87171"),
            ]}
          >
            {props.pnl24hPercent}
          </Text>
        </HStack>
        <Spacer />
        <Text
          modifiers={[font({ size: 10, weight: "regular" }), foregroundStyle("#5f596c")]}
        >
          {props.updatedAt}
        </Text>
      </VStack>
      <Spacer />
      <VStack spacing={6} alignment="trailing">
        {props.topHoldings.map((token, i) => (
          <HStack key={i} spacing={8}>
            <Text
              modifiers={[
                font({ size: 13, weight: "semibold" }),
                foregroundStyle("#f8f7fb"),
              ]}
            >
              {token.symbol}
            </Text>
            <Text
              modifiers={[
                font({ size: 12, weight: "medium" }),
                foregroundStyle("#b7a8d9"),
              ]}
            >
              {token.valueUsd}
            </Text>
            <Text
              modifiers={[
                font({ size: 12, weight: "medium" }),
                foregroundStyle(token.isPositive ? "#4ade80" : "#f87171"),
              ]}
            >
              {token.pnlPercent}
            </Text>
          </HStack>
        ))}
      </VStack>
    </HStack>
  );
};

const PortfolioWidget = (props: WidgetBase<PortfolioWidgetProps>) => {
  "widget";
  if (props.family === "systemSmall") {
    return <SmallLayout {...props} />;
  }
  return <MediumLayout {...props} />;
};

export default createWidget("PortfolioWidget", PortfolioWidget);
