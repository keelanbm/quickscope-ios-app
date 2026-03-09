import { Text, VStack, HStack, Spacer } from "@expo/ui/swift-ui";
import { background, font, foregroundStyle, padding } from "@expo/ui/swift-ui/modifiers";
import { createWidget, WidgetBase } from "expo-widgets";

type TrendingToken = {
  symbol: string;
  mentionCount: string;
  uniqueSenders: string;
  chatNames: string;
};

type ChatPulseWidgetProps = {
  windowLabel: string;
  tokens: TrendingToken[];
  updatedAt: string;
};

const ChatPulseWidget = (props: WidgetBase<ChatPulseWidgetProps>) => {
  "widget";
  if (props.family === "systemSmall") {
    return (
      <VStack spacing={6} alignment="leading" modifiers={[padding({ all: 12 }), background("#0a0810")]}>
        <Text
          modifiers={[font({ size: 11, weight: "medium" }), foregroundStyle("#7b6e9a")]}
        >
          Chats · {props.windowLabel}
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
              {token.mentionCount} mentions
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
        Chat Pulse · {props.windowLabel}
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
              foregroundStyle("#7766f7"),
            ]}
          >
            {token.mentionCount} mentions
          </Text>
          <Text
            modifiers={[
              font({ size: 12, weight: "medium" }),
              foregroundStyle("#b7a8d9"),
            ]}
          >
            {token.uniqueSenders} senders
          </Text>
          <Text
            modifiers={[
              font({ size: 11, weight: "regular" }),
              foregroundStyle("#7b6e9a"),
            ]}
          >
            {token.chatNames}
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

export default createWidget("ChatPulseWidget", ChatPulseWidget);
