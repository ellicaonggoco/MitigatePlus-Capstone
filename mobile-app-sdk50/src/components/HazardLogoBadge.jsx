import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { hazardEmojis, hazardPalette } from "../theme";

const HazardLogoBadge = ({ type, size = 44, style }) => {
  const palette = hazardPalette[type] || {
    bg: "#eef7ff",
    color: "#1565c0",
  };

  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.emoji,
          {
            color: palette.color,
            fontSize: Math.round(size * 0.64),
            lineHeight: Math.round(size * 0.76),
            textShadowColor: palette.color,
          },
        ]}
      >
        {hazardEmojis[type] || "\u{26A0}\u{FE0F}"}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0d2b6b",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 5,
  },
  emoji: {
    textAlign: "center",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
});

export default HazardLogoBadge;
