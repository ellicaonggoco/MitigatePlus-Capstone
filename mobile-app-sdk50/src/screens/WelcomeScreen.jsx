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
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, shadow } from "../theme";

const WelcomeScreen = ({ navigation }) => {
  const { height } = useWindowDimensions();
  const compact = height < 720;
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
          <View style={[styles.logoPanel, compact && styles.logoPanelCompact]}>
            <Image
              source={require("../assets/images/mitigatepluswholelogo.png")}
              resizeMode="contain"
              style={styles.logo}
            />
            <Image
              source={require("../assets/images/welcomepagelogo.png")}
              resizeMode="cover"
              style={[styles.hero, compact && styles.heroCompact]}
            />
          </View>
          <View style={[styles.bluePanel, compact && styles.bluePanelCompact]}>
            <Text style={[styles.title, compact && styles.titleCompact]}>
              WELCOME!
            </Text>
            <Text style={styles.tagline}>
              Know Your Risks. Prevent. Protect.
            </Text>
            <Text style={styles.body}>
              MitigatePlus empowers Manila residents and the LGU to identify,
              report, and reduce disaster risks together.
            </Text>
            <Text style={styles.micro}>
              Get started. Log in or Sign up to join the fight against
              disasters.
            </Text>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => navigation.navigate("Login")}
              >
                <Text style={styles.loginText}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.signupButton}
                onPress={() => navigation.navigate("Register")}
              >
                <Text style={styles.signupText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    minHeight: "100%",
    borderRadius: 0,
    backgroundColor: colors.blue,
    overflow: "hidden",
  },
  logoPanel: {
    height: 380,
    backgroundColor: "#fff",
    alignItems: "center",
    overflow: "hidden",
  },
  logoPanelCompact: { height: 325 },
  logo: { width: 260, height: 250, marginTop: -45, zIndex: 1, right: -7 },
  hero: { width: "130%", height: 240, marginTop: -105, right: 3 },
  heroCompact: { height: 236 },
  bluePanel: {
    flex: 1,
    marginTop: -40,
    backgroundColor: colors.blue,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: -35,
    justifyContent: "center",
  },
  bluePanelCompact: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 18 },
  shield: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: colors.navy,
    borderWidth: 5,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -42,
    marginBottom: 10,
  },
  shieldCompact: {
    width: 66,
    height: 66,
    borderRadius: 33,
    marginTop: -34,
    marginBottom: 8,
  },
  title: {
    color: "#fff",
    textShadowColor: "rgba(2,2,2,2.24)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 20,
    fontSize: 60,
    fontFamily: fonts.black,
    letterSpacing: 0,
    top: -45,
  },
  titleCompact: { fontSize: 29 },
  tagline: {
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.24)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 20,
    fontSize: 14,
    fontFamily: fonts.bold,
    marginTop: 2,
    top: -60,
  },
  body: {
    color: "rgba(255,255,255,2.9)",
    fontSize: 15,
    fontFamily: fonts.extraBold,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 14,
    top: -50,
  },
  micro: {
    color: "#fff",
    fontSize: 12,
    fontFamily: fonts.medium,
    textAlign: "center",
    marginTop: 14,
    marginBottom: 18,
    top: -40,
  },
  actionRow: { flexDirection: "row", gap: 14, width: "100%" },
  loginButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    top: -40,
  },
  signupButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#ff1212",
    alignItems: "center",
    justifyContent: "center",
    top: -40,
  },
  loginText: { color: colors.blue, fontFamily: fonts.bold, fontSize: 14 },
  signupText: { color: "#fff", fontFamily: fonts.bold, fontSize: 14 },
});

export default WelcomeScreen;
