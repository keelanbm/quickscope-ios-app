import { Image as ExpoImage } from "expo-image";
import { Image, type ImageStyle, type StyleProp, StyleSheet, View } from "react-native";

import { qsColors } from "@/src/theme/tokens";

const FALLBACK_TOKEN_IMAGE = "https://app.quickscope.gg/favicon.ico";
const EXCHANGE_BASE_URL = "https://app.quickscope.gg/exchanges";

const LAUNCHPAD_BADGES: Record<string, { icon: string; border: string }> = {
  p: { icon: `${EXCHANGE_BASE_URL}/pump.svg`, border: "#58D491" },
  b: { icon: `${EXCHANGE_BASE_URL}/bonk.png`, border: "#EB8A03" },
  l: { icon: `${EXCHANGE_BASE_URL}/believe.svg`, border: "#03D945" },
  h: { icon: `${EXCHANGE_BASE_URL}/heaven.png`, border: "#6BA3FF" },
  m: { icon: `${EXCHANGE_BASE_URL}/moonshot.svg`, border: "#FF7CFE" },
  j: { icon: `${EXCHANGE_BASE_URL}/jupiter.svg`, border: "#EB8A03" },
  s: { icon: `${EXCHANGE_BASE_URL}/bags.svg`, border: "#03D52B" },
  a: { icon: `${EXCHANGE_BASE_URL}/launchlab.png`, border: "#E8C547" },
  f: { icon: `${EXCHANGE_BASE_URL}/dbc.svg`, border: "#9B7DFF" },
};

type TokenAvatarProps = {
  uri?: string | null;
  size?: number;
  style?: StyleProp<ImageStyle>;
  platform?: string | null;
};

export function TokenAvatar({ uri, size = 44, style, platform }: TokenAvatarProps) {
  const borderRadius = size / 2;
  const badge = platform ? LAUNCHPAD_BADGES[platform] : undefined;
  const badgeSize = Math.max(14, Math.floor(size / 2.5));
  const iconSize = badgeSize - 4;

  return (
    <View style={{ width: size, height: size }}>
      <Image
        source={{ uri: uri || FALLBACK_TOKEN_IMAGE }}
        style={[
          styles.image,
          { width: size, height: size, borderRadius },
          style,
        ]}
      />
      {badge ? (
        <View
          style={[
            styles.badge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              borderColor: badge.border,
            },
          ]}
        >
          <ExpoImage
            source={{ uri: badge.icon }}
            style={{ width: iconSize, height: iconSize }}
            contentFit="contain"
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: qsColors.layer3,
  },
  badge: {
    position: "absolute",
    top: -2,
    left: -2,
    backgroundColor: qsColors.layer0,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});
