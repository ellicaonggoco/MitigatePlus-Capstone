import React, { useEffect, useRef } from "react";
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, fonts } from "../theme";

const WelcomeScreen = ({ navigation }) => {
  const { width, height } = useWindowDimensions();
  const compact = height < 740;
  const narrow = width < 370;
  const logoPanelHeight = Math.min(
    Math.max(height * (compact ? 0.4 : 0.43), 315),
    compact ? 350 : 390,
  );
  const logoSize = Math.min(width * 0.72, compact ? 245 : 275);
  const heroHeight = Math.min(width * 0.74, compact ? 265 : 300);
  const titleSize = Math.min(
    width * (narrow ? 0.155 : 0.17),
    compact ? 56 : 64,
  );
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(22)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 550,
        useNativeDriver: true,
      }),
      Animated.spring(slide, {
        toValue: 0,
        friction: 8,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, slide]);

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.phoneCard,
            { opacity: fade, transform: [{ translateY: slide }] },
          ]}
        >
          <View style={[styles.logoPanel, { height: logoPanelHeight }]}>
            <Image
              source={require("../assets/images/mitigatepluswholelogo.png")}
              resizeMode="contain"
              style={[
                styles.logo,
                {
                  width: logoSize,
                  height: logoSize * 0.62,
                  marginTop: compact ? 8 : -25,
                  marginBottom: compact ? 8 : 40,
                },
              ]}
            />
            <Image
              source={require("../assets/images/welcomepagelogo.png")}
              resizeMode="cover"
              style={[
                styles.hero,
                {
                  width: width * 1.24,
                  height: heroHeight,
                  marginTop: compact ? -130 : -132,
                },
              ]}
            />
          </View>
          <LinearGradient
            colors={[colors.navyDark, colors.blue, colors.sky]}
            style={[styles.bluePanel, compact && styles.bluePanelCompact]}
          >
            <Text
              style={[
                styles.title,
                {
                  fontSize: titleSize,
                  lineHeight: Math.round(titleSize * 1.08),
                },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.76}
            >
              WELCOME!
            </Text>
            <Text style={[styles.tagline, compact && styles.taglineCompact]}>
              Know Your Risks. Prevent. Protect.
            </Text>
            <Text style={[styles.body, compact && styles.bodyCompact]}>
              MitigatePlus empowers Manila residents and the LGU to identify,
              report, and reduce disaster risks together.
            </Text>
            <Text style={[styles.micro, compact && styles.microCompact]}>
              Get started. Log in or Sign up to join the fight against
              disasters.
            </Text>
            <View style={[styles.actionRow, narrow && styles.actionRowNarrow]}>
              <TouchableOpacity
                style={[styles.loginButton, narrow && styles.buttonNarrow]}
                onPress={() => navigation.navigate("Login")}
              >
                <Text style={styles.loginText}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.signupButton, narrow && styles.buttonNarrow]}
                onPress={() => navigation.navigate("Register")}
              >
                <Text style={styles.signupText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scroll: { flexGrow: 1, width: "100%" },
  phoneCard: {
    width: "100%",
    flexGrow: 1,
    borderRadius: 0,
    backgroundColor: colors.navyDark,
    overflow: "hidden",
  },
  logoPanel: {
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "flex-start",
    overflow: "hidden",
  },
  logo: { zIndex: 1 },
  hero: {},
  bluePanel: {
    flex: 1,
    minHeight: 0,
    marginTop: -29,
    backgroundColor: colors.blue,
    borderTopLeftRadius: 38,
    borderTopRightRadius: 38,
    alignItems: "center",
    paddingHorizontal: 26,
    paddingTop: 28,
    paddingBottom: 34,
    justifyContent: "center",
  },
  bluePanelCompact: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 28,
  },
  title: {
    color: "#fff",
    textShadowColor: "rgba(2,2,2,0.32)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
    fontFamily: fonts.black,
    letterSpacing: 0,
    textAlign: "center",
    width: "100%",
  },
  tagline: {
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.24)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
    fontSize: 15,
    fontFamily: fonts.bold,
    marginTop: 14,
    textAlign: "center",
  },
  taglineCompact: { fontSize: 14, marginTop: 10 },
  body: {
    color: "#fff",
    fontSize: 16,
    fontFamily: fonts.extraBold,
    lineHeight: 23,
    textAlign: "center",
    marginTop: 22,
  },
  bodyCompact: { fontSize: 14, lineHeight: 20, marginTop: 16 },
  micro: {
    color: "#fff",
    fontSize: 13,
    fontFamily: fonts.medium,
    textAlign: "center",
    lineHeight: 19,
    marginTop: 22,
    marginBottom: 22,
  },
  microCompact: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 16,
    marginBottom: 18,
  },
  actionRow: { flexDirection: "row", gap: 14, width: "100%" },
  actionRowNarrow: { flexDirection: "column", gap: 10 },
  loginButton: {
    flex: 1,
    height: 56,
    borderRadius: 17,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  signupButton: {
    flex: 1,
    height: 56,
    borderRadius: 17,
    backgroundColor: colors.red,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonNarrow: { flex: 0, width: "100%" },
  loginText: { color: colors.navy, fontFamily: fonts.bold, fontSize: 15 },
  signupText: { color: "#fff", fontFamily: fonts.bold, fontSize: 15 },
});

export default WelcomeScreen;
