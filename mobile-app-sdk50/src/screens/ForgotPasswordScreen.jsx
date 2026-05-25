import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import api from "../services/api";
import { colors, fonts, shadow } from "../theme";

const ForgotPasswordScreen = ({ route, navigation }) => {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState(route?.params?.email || "");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [loading, setLoading] = useState(false);
  const refs = useRef([]);
  const autoSentRef = useRef(false);

  const sendOtp = async () => {
    if (!email.trim()) return Alert.alert("Email required", "Enter your registered email.");
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: email.trim() });
      setStep("otp");
    } catch (err) {
      Alert.alert("Could not send OTP", err.response?.data?.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialEmail = route?.params?.email?.trim();
    if (!initialEmail || autoSentRef.current) return;
    autoSentRef.current = true;
    sendOtp();
  }, []);

  const verifyOtp = async () => {
    const code = otp.join("");
    if (code.length !== 6) return Alert.alert("Incomplete OTP", "Enter the 6-digit code.");
    setLoading(true);
    try {
      const res = await api.post("/auth/verify-reset-otp", { email: email.trim(), otp: code });
      setResetToken(res.data.resetToken || "");
      setStep("password");
    } catch (err) {
      Alert.alert("Invalid OTP", err.response?.data?.message || "Please check the code.");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (password.length < 6) return Alert.alert("Weak password", "Use at least 6 characters.");
    if (password !== confirm) return Alert.alert("Passwords do not match", "Confirm your new password.");
    if (!resetToken) return Alert.alert("Verification required", "Please verify your OTP again before resetting your password.");
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { email: email.trim(), password, resetToken });
      Alert.alert("Password updated", "You can now sign in with your new password.");
      navigation.navigate("Login");
    } catch (err) {
      Alert.alert("Reset failed", err.response?.data?.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const changeOtp = (value, index) => {
    if (value.length > 1) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) refs.current[index + 1]?.focus();
  };

  const title =
    step === "email"
      ? "Forgot Password"
      : step === "otp"
        ? "Enter Verification Code"
        : "New Password";
  const subtitle =
    step === "email"
      ? "Enter your email address and we will send you a code to reset your password."
      : step === "otp"
        ? "Enter the verification code we sent to your email."
        : "Enter your new password.";

  return (
    <View style={styles.root}>
      <LinearGradient colors={[colors.navyDark, colors.blue, colors.sky]} style={styles.background}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.card}>
          <View style={styles.brandRow}>
            <Image source={require("../assets/images/mitigateplus-logoonly.png")} style={styles.brandLogo} />
            <Text style={styles.brandName}>MitigatePlus</Text>
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

        {step === "email" ? (
          <>
            <Input icon="mail-outline" placeholder="Enter your Email Address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <Button label="Send OTP" loading={loading} onPress={sendOtp} />
          </>
        ) : null}

        {step === "otp" ? (
          <>
            <View style={styles.otpRow}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (refs.current[index] = ref)}
                  style={styles.otpBox}
                  value={digit}
                  onChangeText={(value) => changeOtp(value, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  onKeyPress={({ nativeEvent }) => {
                    if (nativeEvent.key === "Backspace" && !digit && index > 0) refs.current[index - 1]?.focus();
                  }}
                />
              ))}
            </View>
            <TouchableOpacity onPress={sendOtp}>
              <Text style={styles.resend}>Didn't receive an OTP? <Text style={styles.linkText}>Resend it</Text></Text>
            </TouchableOpacity>
            <Button label="Verify" loading={loading} onPress={verifyOtp} />
          </>
        ) : null}

        {step === "password" ? (
          <>
            <Input icon="lock-closed-outline" placeholder="Enter New Password" value={password} onChangeText={setPassword} secureTextEntry />
            <Input icon="shield-checkmark-outline" placeholder="Confirm Password" value={confirm} onChangeText={setConfirm} secureTextEntry />
            <Button label="Submit" loading={loading} onPress={resetPassword} />
          </>
        ) : null}
          </View>
        </View>
      </ScrollView>
      </LinearGradient>
    </View>
  );
};

const Input = ({ icon, ...props }) => (
  <View style={styles.inputWrap}>
    <Ionicons name={icon} size={18} color={colors.blue} />
    <TextInput style={styles.input} placeholderTextColor="#8aa0be" {...props} />
  </View>
);

const Button = ({ label, loading, onPress }) => (
  <TouchableOpacity style={[styles.primaryButton, loading && styles.disabled]} disabled={loading} onPress={onPress}>
    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{label}</Text>}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#061638" },
  background: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 42, paddingBottom: 30 },
  back: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.14)", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
  content: { flex: 1, justifyContent: "center", alignItems: "center", paddingBottom: 30 },
  card: { width: "100%", borderRadius: 28, padding: 20, backgroundColor: "rgba(255,255,255,0.95)", borderWidth: 1, borderColor: "rgba(255,255,255,0.72)", ...shadow.card },
  brandRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  brandLogo: { width: 54, height: 54, marginRight: 10 },
  brandName: { color: colors.navy, fontFamily: fonts.black, fontSize: 20 },
  title: { color: colors.navyDark, fontFamily: fonts.black, fontSize: 30, textAlign: "center", letterSpacing: 0 },
  subtitle: { color: "#334155", fontFamily: fonts.medium, fontSize: 13, textAlign: "center", lineHeight: 20, marginTop: 8, marginBottom: 24 },
  inputWrap: { width: "100%", minHeight: 56, borderRadius: 17, backgroundColor: "#f8fbff", flexDirection: "row", alignItems: "center", paddingHorizontal: 15, marginBottom: 14, borderWidth: 1, borderColor: "#d9e8ff" },
  input: { flex: 1, color: colors.navyDark, fontFamily: fonts.semiBold, fontSize: 14, paddingHorizontal: 12 },
  otpRow: { flexDirection: "row", justifyContent: "center", gap: 7, marginBottom: 16 },
  otpBox: { width: 44, height: 58, borderRadius: 15, backgroundColor: "#f8fbff", color: colors.navyDark, textAlign: "center", fontFamily: fonts.bold, fontSize: 21, borderWidth: 1, borderColor: "#d9e8ff" },
  resend: { color: colors.navy, fontFamily: fonts.medium, fontSize: 12, marginBottom: 18, textAlign: "center" },
  linkText: { color: colors.blue, fontFamily: fonts.bold },
  primaryButton: { width: "100%", height: 58, borderRadius: 18, backgroundColor: colors.blue, alignItems: "center", justifyContent: "center", marginTop: 2, ...shadow.button },
  disabled: { opacity: 0.72 },
  primaryText: { color: "#fff", fontFamily: fonts.bold, fontSize: 15 },
});

export default ForgotPasswordScreen;
