import { useState } from "react";

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { qsColors, qsRadius, qsSpacing } from "@/src/theme/tokens";
import { ChevronDown, X } from "@/src/ui/icons";

type SortOption = {
  label: string;
  value: string;
};

type FilterChip = {
  label: string;
  value: string;
};

type FilterBarProps = {
  sortOptions: SortOption[];
  activeSort: string;
  onSortChange: (value: string) => void;
  filterChips?: FilterChip[];
  activeFilters?: string[];
  onFilterToggle?: (value: string) => void;
};

export function FilterBar({
  sortOptions,
  activeSort,
  onSortChange,
  filterChips = [],
  activeFilters = [],
  onFilterToggle,
}: FilterBarProps) {
  const [showSortMenu, setShowSortMenu] = useState(false);

  const activeSortLabel =
    sortOptions.find((o) => o.value === activeSort)?.label ?? "Sort";

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {/* Sort dropdown trigger */}
        <Pressable
          style={styles.sortButton}
          onPress={() => setShowSortMenu(!showSortMenu)}
        >
          <Text style={styles.sortText}>{activeSortLabel}</Text>
          <ChevronDown size={14} color={qsColors.textSecondary} />
        </Pressable>

        {/* Filter chips */}
        {filterChips.map((chip) => {
          const isActive = activeFilters.includes(chip.value);
          return (
            <Pressable
              key={chip.value}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => onFilterToggle?.(chip.value)}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {chip.label}
              </Text>
              {isActive ? (
                <X size={12} color={qsColors.accent} />
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Sort dropdown menu (simple overlay) */}
      {showSortMenu ? (
        <View style={styles.sortMenu}>
          {sortOptions.map((option) => (
            <Pressable
              key={option.value}
              style={[
                styles.sortOption,
                activeSort === option.value && styles.sortOptionActive,
              ]}
              onPress={() => {
                onSortChange(option.value);
                setShowSortMenu(false);
              }}
            >
              <Text
                style={[
                  styles.sortOptionText,
                  activeSort === option.value && styles.sortOptionTextActive,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    zIndex: 10,
  },
  container: {
    flexDirection: "row",
    gap: qsSpacing.sm,
    paddingHorizontal: qsSpacing.lg,
    paddingVertical: qsSpacing.md,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: qsColors.layer2,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sortText: {
    fontSize: 13,
    fontWeight: "600",
    color: qsColors.textSecondary,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: qsColors.layer2,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: {
    borderColor: qsColors.accent,
    backgroundColor: "rgba(119, 102, 247, 0.1)",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: qsColors.textSecondary,
  },
  chipTextActive: {
    color: qsColors.accent,
  },
  sortMenu: {
    position: "absolute",
    top: 52,
    left: qsSpacing.lg,
    backgroundColor: qsColors.layer1,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.md,
    paddingVertical: 4,
    minWidth: 140,
    zIndex: 100,
    elevation: 10,
  },
  sortOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sortOptionActive: {
    backgroundColor: qsColors.layer2,
  },
  sortOptionText: {
    fontSize: 13,
    fontWeight: "500",
    color: qsColors.textSecondary,
  },
  sortOptionTextActive: {
    color: qsColors.accent,
    fontWeight: "600",
  },
});
