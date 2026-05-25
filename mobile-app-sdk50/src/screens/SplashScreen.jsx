import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";

const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    const timer = setTimeout(() => navigation.replace("Login"), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.logoText}>
        Mitigate<Text style={styles.accent}>Plus</Text>
      </Text>
      <Text style={styles.subTitle}>Manila DRRM</Text>
      <Text style={styles.tagline}>
        Protecting Manila, One Barangay at a Time
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0B1B3D",
    paddingHorizontal: 30,
  },
  logoText: {
    fontSize: 36,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  accent: { color: "#4F6EF6" },
  subTitle: { fontSize: 16, color: "#8E9BB5", marginTop: 6 },
  tagline: {
    position: "absolute",
    bottom: 50,
    fontSize: 13,
    color: "#5A6E91",
    textAlign: "center",
  },
});

export default SplashScreen;
