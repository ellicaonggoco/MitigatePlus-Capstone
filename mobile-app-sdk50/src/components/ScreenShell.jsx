import React from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../theme";

const ScreenShell = ({ children, padded = true }) => (
  <LinearGradient colors={[colors.bgWarm, colors.bg, "#e8f7ff"]} style={styles.root}>
    <View style={[styles.inner, padded && styles.padded]}>{children}</View>
  </LinearGradient>
);

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: { flex: 1 },
  padded: { paddingHorizontal: 18 },
});

export default ScreenShell;
