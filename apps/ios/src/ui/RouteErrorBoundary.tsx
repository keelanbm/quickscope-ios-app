import React, { PropsWithChildren } from "react";

import { Button, StyleSheet, Text, View } from "react-native";

import { qsColors, qsRadius, qsSpacing } from "@/src/theme/tokens";

type RouteErrorBoundaryProps = PropsWithChildren<{
  routeName: string;
}>;

type RouteErrorBoundaryState = {
  hasError: boolean;
};

class RouteErrorBoundaryInner extends React.Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  constructor(props: RouteErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.copy}>
              {this.props.routeName} hit a runtime error. Tap retry to remount this screen.
            </Text>
            <Button title="Retry screen" onPress={() => this.setState({ hasError: false })} />
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

export function RouteErrorBoundary(props: RouteErrorBoundaryProps) {
  return <RouteErrorBoundaryInner {...props} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: qsColors.layer0,
    justifyContent: "center",
    padding: qsSpacing.xl,
  },
  card: {
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.layer1,
    padding: qsSpacing.lg,
    gap: qsSpacing.sm,
  },
  title: {
    color: qsColors.textPrimary,
    fontSize: 20,
    fontWeight: "700",
  },
  copy: {
    color: qsColors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
});
