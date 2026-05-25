import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/AuthContext";
import { colors, fonts, shadow } from "../theme";

const LoginScreen = ({ navigation }) => {
  const { height } = useWindowDimensions();
  const compact = height < 720;
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password)
      return Alert.alert("Missing details", "Enter your email and password.");
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      const data = err.response?.data;
      if (data?.requiresOTP) {
        navigation.navigate("VerifyOTP", { email: data.email || email.trim() });
        return;
      }
      Alert.alert(
        "Sign in failed",
        data?.message || "Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.root}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, compact && styles.scrollCompact]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.phoneCard}>
          <TouchableOpacity
            style={styles.back}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
          <LinearGradient
            colors={[colors.navyDark, colors.blue, colors.sky]}
            style={[styles.formPanel, compact && styles.formPanelCompact]}
          >
            <View style={styles.formCard}>
              <View style={styles.brandRow}>
                <Image source={require("../assets/images/mitigateplus-logoonly.png")} style={styles.brandLogo} />
                <View style={styles.brandText}>
                  <Text style={styles.brandName}>MitigatePlus</Text>
                  <Text style={styles.brandTag}>Disaster readiness hub</Text>
                </View>
              </View>
              <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
                Welcome back
              </Text>
              <Text style={styles.subtitle}>Sign in to report, review, and stay ready.</Text>

              <Input
                icon="person-outline"
                label="Username"
                placeholder="Email address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <PasswordInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                show={showPassword}
                onToggle={() => setShowPassword((value) => !value)}
              />

              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={styles.remember}
                  onPress={() => setRemember((value) => !value)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[styles.checkbox, remember && styles.checkboxActive]}
                  >
                    {remember ? (
                      <Ionicons
                        name="checkmark"
                        size={10}
                        color={colors.blue}
                      />
                    ) : null}
                  </View>
                  <Text style={styles.optionText}>Remember me</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => navigation.navigate("ForgotPassword", { email: email.trim() })}
                >
                  <Text style={styles.optionText}>Forgot password?</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.signInButton, loading && styles.disabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.signInText}>Sign in</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                <Text style={styles.footerText}>
                  Don't have an account?{" "}
                  <Text style={styles.linkText}>Create one</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const Input = ({ icon, label, ...props }) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputWrap}>
      <Ionicons name={icon} size={18} color={colors.blue} />
      <TextInput
        style={styles.input}
        placeholderTextColor="#8aa0be"
        {...props}
      />
    </View>
  </View>
);

const PasswordInput = ({ label, value, onChangeText, show, onToggle }) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputWrap}>
      <Ionicons name="key-outline" size={18} color={colors.blue} />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#8aa0be"
        secureTextEntry={!show}
        value={value}
        onChangeText={onChangeText}
      />
      <TouchableOpacity onPress={onToggle} hitSlop={8}>
        <Ionicons
          name={show ? "eye-off-outline" : "eye-outline"}
          size={20}
          color={colors.blue}
        />
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#061638" },
  scroll: { flexGrow: 1 },
  scrollCompact: { paddingVertical: 0 },
  phoneCard: {
    width: "100%",
    minHeight: "100%",
    backgroundColor: "#061638",
    overflow: "hidden",
  },
  back: {
    position: "absolute",
    top: 48,
    left: 18,
    zIndex: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  formPanel: {
    flex: 1,
    minHeight: "100%",
    paddingHorizontal: 22,
    paddingTop: 86,
    paddingBottom: 32,
    justifyContent: "center",
  },
  formPanelCompact: { paddingTop: 78, paddingBottom: 24 },
  formCard: {
    width: "100%",
    borderRadius: 28,
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.72)",
    ...shadow.card,
  },
  brandRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 18 },
  brandLogo: { width: 56, height: 56, marginRight: 10 },
  brandText: { alignItems: "flex-start" },
  brandName: { color: colors.navy, fontFamily: fonts.black, fontSize: 20 },
  brandTag: { color: colors.muted, fontFamily: fonts.semiBold, fontSize: 12, marginTop: -2 },
  title: {
    color: colors.navyDark,
    fontFamily: fonts.black,
    fontSize: 32,
    letterSpacing: 0,
    textAlign: "left",
  },
  subtitle: {
    color: "#334155",
    fontFamily: fonts.bold,
    fontSize: 14,
    marginTop: 2,
    marginBottom: 20,
  },
  fieldGroup: { marginBottom: 13 },
  label: {
    color: colors.navy,
    fontFamily: fonts.bold,
    fontSize: 12,
    marginBottom: 8,
  },
  inputWrap: {
    minHeight: 56,
    borderRadius: 17,
    backgroundColor: "#f8fbff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#d9e8ff",
    shadowColor: "#1976d2",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  input: {
    flex: 1,
    color: colors.navyDark,
    fontFamily: fonts.semiBold,
    fontSize: 14,
    paddingHorizontal: 12,
    minWidth: 0,
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  remember: { flexDirection: "row", alignItems: "center" },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 5,
    borderWidth: 1.4,
    borderColor: colors.blue,
    marginRight: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: { backgroundColor: "#e8f3ff", borderColor: colors.blue },
  optionText: { color: colors.navy, fontFamily: fonts.semiBold, fontSize: 11 },
  signInButton: {
    height: 58,
    borderRadius: 18,
    backgroundColor: colors.blue,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.75)",
    ...shadow.button,
  },
  disabled: { opacity: 0.72 },
  signInText: { color: "#fff", fontFamily: fonts.bold, fontSize: 15 },
  footerText: {
    color: colors.navy,
    fontFamily: fonts.semiBold,
    fontSize: 12,
    textAlign: "center",
    marginTop: 14,
  },
  linkText: { color: colors.blue, fontFamily: fonts.bold },
});

export default LoginScreen;
