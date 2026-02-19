import { StyleSheet, Text, View } from "react-native";

import { qsColors, qsRadius, qsSpacing } from "@/src/theme/tokens";

type MvpPlaceholderScreenProps = {
  title: string;
  description: string;
  contextLines?: string[];
};

export function MvpPlaceholderScreen({
  title,
  description,
  contextLines,
}: MvpPlaceholderScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {contextLines && contextLines.length > 0 ? (
        <View style={styles.contextBox}>
          {contextLines.map((line) => (
            <Text key={line} style={styles.contextText}>
              {line}
            </Text>
          ))}
        </View>
      ) : null}
      <Text style={styles.footer}>MVP build path: active development</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: qsSpacing.xl,
    backgroundColor: qsColors.layer0,
    justifyContent: "center",
    gap: qsSpacing.sm,
  },
  title: {
    color: qsColors.textPrimary,
    fontSize: 26,
    fontWeight: "700",
  },
  description: {
    color: qsColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  contextBox: {
    marginTop: qsSpacing.sm,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.md,
    padding: qsSpacing.md,
    gap: 4,
    backgroundColor: qsColors.bgCardSoft,
  },
  contextText: {
    color: qsColors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  footer: {
    marginTop: qsSpacing.sm,
    color: qsColors.textSubtle,
    fontSize: 12,
  },
});
