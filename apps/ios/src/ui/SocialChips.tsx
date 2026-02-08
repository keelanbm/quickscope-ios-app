import { Linking, Pressable, StyleSheet, View } from "react-native";

import { qsColors, qsRadius, qsSpacing } from "@/src/theme/tokens";
import { Globe } from "@/src/ui/icons";
import { TelegramIcon, XIcon } from "@/src/ui/icons";

export type SocialLink = {
  type: "twitter" | "telegram" | "website";
  url: string;
};

type SocialChipsProps = {
  links: SocialLink[];
  size?: "sm" | "md";
};

const ICON_SIZES: Record<"sm" | "md", number> = { sm: 14, md: 16 };
const PADDINGS: Record<"sm" | "md", { h: number; v: number }> = {
  sm: { h: 6, v: 2 },
  md: { h: 8, v: 4 },
};

function SocialIcon({ type, size, color }: { type: SocialLink["type"]; size: number; color: string }) {
  switch (type) {
    case "twitter":
      return <XIcon size={size} color={color} />;
    case "telegram":
      return <TelegramIcon size={size} color={color} />;
    case "website":
      return <Globe size={size} color={color} />;
  }
}

export function SocialChips({ links, size = "sm" }: SocialChipsProps) {
  if (links.length === 0) return null;

  const iconSize = ICON_SIZES[size];
  const pad = PADDINGS[size];

  return (
    <View style={styles.container}>
      {links.map((link) => (
        <Pressable
          key={link.url}
          style={({ pressed }) => [
            styles.chip,
            {
              paddingHorizontal: pad.h,
              paddingVertical: pad.v,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          onPress={() => Linking.openURL(link.url)}
          hitSlop={size === "sm" ? 8 : 4}
        >
          <SocialIcon type={link.type} size={iconSize} color={qsColors.textSecondary} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: qsSpacing.xs,
  },
  chip: {
    backgroundColor: qsColors.layer2,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
});
