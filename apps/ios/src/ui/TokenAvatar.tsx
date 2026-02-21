import { Image, type ImageStyle } from "expo-image";
import { type StyleProp, StyleSheet } from "react-native";

import { qsColors } from "@/src/theme/tokens";

const FALLBACK_TOKEN_IMAGE = "https://app.quickscope.gg/favicon.ico";

type TokenAvatarProps = {
  uri?: string | null;
  size?: number;
  style?: StyleProp<ImageStyle>;
};

export function TokenAvatar({ uri, size = 44, style }: TokenAvatarProps) {
  const borderRadius = size / 2;
  return (
    <Image
      source={uri || FALLBACK_TOKEN_IMAGE}
      style={[
        styles.image,
        { width: size, height: size, borderRadius },
        style,
      ]}
      cachePolicy="memory-disk"
      recyclingKey={uri ?? undefined}
      transition={150}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: qsColors.layer3,
  },
});
